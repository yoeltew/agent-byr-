import asyncio
import json
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

# Tillåt CORS för React-frontenden
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama konfiguration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"  # eller "llama3.2" (användaren kan byta)

# Enkel WebSocket Connection Manager för realtids-loggar
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

async def query_ollama(prompt: str, system_prompt: str = "") -> str:
    """Skickar en förfrågan asynkront till lokala Ollama-servern."""
    async with httpx.AsyncClient() as client:
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False
        }
        try:
            # Sätt en timeout på 120s eftersom lokala modeller kan ta tid att svara
            response = await client.post(OLLAMA_URL, json=payload, timeout=120.0)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except httpx.RequestError as exc:
            return f"[Error] Ett nätverksfel uppstod vid kontakt med Ollama: {exc}"
        except Exception as e:
            return f"[Error] Ett oväntat fel uppstod: {str(e)}"

# System-prompts för agenterna
AGENTS = {
    "Manager": "Du är projektledaren (Manager). Din uppgift är att bryta ner användarens uppgift till en konkret och kortfattad teknisk plan. Svara på svenska.",
    "Developer": "Du är en expertutvecklare (Developer). Skriv ren och tydlig kod baserat på projektledarens plan. Returnera enbart kod (ingen förklaring) om möjligt.",
    "Reviewer": "Du är kodgranskaren (Reviewer). Granska Utvecklarens kod och peka ut brister, säkerhetsfel, eller logiska fel. Föreslå förbättringar. Svara kort och koncist på svenska.",
    "Tester": "Du är QA-testaren (Tester). Läs utvecklarens kod och granskarens feedback, generera sedan ett relevant och enkelt testfall (exempelvis ett unit test). Svara på svenska."
}

async def run_agency_workflow(task: str):
    """
    Orkestrerar agentflödet med ren Python-logik och delat kontext/arbetsminne.
    Flödet: Manager -> Developer -> Reviewer -> Tester
    """
    context = []  # Vårt gemensamma "arbetsminne" för denna körning
    
    # 1. MANAGER
    await manager.broadcast(f"[10:42:01] Manager: Mottog ny huvuduppgift: '{task}'")
    await manager.broadcast(f"[10:42:02] Manager: Genererar detaljerad arbetsplan...")
    
    manager_prompt = f"Uppgift: {task}"
    manager_response = await query_ollama(manager_prompt, AGENTS["Manager"])
    context.append(f"--- MANAGER PLAN ---\n{manager_response}")
    await manager.broadcast(f"[10:42:15] Manager: Arbetsplan klar. Skickar vidare till Utvecklare.")
    
    # 2. DEVELOPER
    await manager.broadcast(f"[10:42:16] Utvecklare: Mottog plan. Påbörjar kodskrivning...")
    
    dev_prompt = f"Här är projektplanen som du ska implementera:\n\n{context[-1]}\n\nSkriv den fullständiga koden för detta."
    dev_response = await query_ollama(dev_prompt, AGENTS["Developer"])
    context.append(f"--- DEVELOPER CODE ---\n{dev_response}")
    await manager.broadcast(f"[10:42:35] Utvecklare: Kodfärdig. Checkar in och överlämnar till Kodgranskare.")

    # 3. REVIEWER
    await manager.broadcast(f"[10:42:36] Reviewer: Mottog kod. Analyserar säkerhet och struktur...")
    
    rev_prompt = f"Granska följande kod baserat på planen:\n\n{context[-2]}\n\nKod att granska:\n{context[-1]}"
    rev_response = await query_ollama(rev_prompt, AGENTS["Reviewer"])
    context.append(f"--- REVIEWER FEEDBACK ---\n{rev_response}")
    await manager.broadcast(f"[10:42:50] Reviewer: Kodgranskning utförd. Skickar rapport till QA-avdelningen.")

    # 4. TESTER
    await manager.broadcast(f"[10:42:51] Tester: Mottog kod och granskningsrapport. Genererar tester...")
    
    test_prompt = f"Här är koden:\n{context[-2]}\n\nHär är granskarens åsikter:\n{context[-1]}\n\nSkriv lämpliga testfall för detta."
    test_response = await query_ollama(test_prompt, AGENTS["Tester"])
    context.append(f"--- TEST CASES ---\n{test_response}")
    await manager.broadcast(f"[10:43:10] Tester: Testfall klara. Alla agenter har slutfört sina uppgifter!")
    
    # Spara resultatet på skrivbordet
    import os
    import datetime
    
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop", "Agent_Outputs")
    os.makedirs(desktop_path, exist_ok=True)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(desktop_path, f"AgentResultat_{timestamp}.md")
    
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"# Agent-uppdrag: {task}\n\n")
            for item in context:
                f.write(f"{item}\n\n---\n\n")
        await manager.broadcast(f"[Live] System: Sparade all kod och planering i {filepath}")
    except Exception as e:
        await manager.broadcast(f"[Live] System: Fel vid sparande av fil - {str(e)}")

    # Slutför
    await manager.broadcast(f"[Live] System: Autonomt 24/7-flöde slutfört och inväntar ny uppgift.")

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    """Hantera inkommande WebSocket-anslutningar."""
    await manager.connect(websocket)
    try:
        while True:
            # Ta emot data från React-frontenden (t.ex. när du klickar "START" eller skickar en prompt)
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                # Om frontenden skickar {"action": "start", "task": "Bygg en kalkylator"}
                if message.get("action") == "start":
                    task = message.get("task", "Bygg ett enkelt 'Hello World' i Python")
                    
                    # Kör vår orkestrering asynkront som en bakgrundstask, så att websockten hålls vid liv!
                    asyncio.create_task(run_agency_workflow(task))
                    
            except json.JSONDecodeError:
                print("Mottog ogiltig JSON via WebSocket.")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    # Starta servern med kommandot: python main.py
    uvicorn.run(app, host="0.0.0.0", port=8000)
