import React, { useState, useEffect, useRef, FormEvent } from 'react';
import './App.css'; // Importera din CSS-fil här
import {
  Activity,
  Settings,
  Plus,
  Play,
  Square,
  Terminal,
  Users,
  Cpu,
  Save
} from 'lucide-react';

// 1. Definiera våra TypeScript-interfaces
interface Agent {
  id: number;
  name: string;
  role: string;
  prompt: string;
}

interface NewAgentState {
  name: string;
  role: string;
  prompt: string;
}

export default function AgentAgencyUI() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents'>('dashboard');
  const [systemRunning, setSystemRunning] = useState<boolean>(false);

  // 2. Typade states
  const [agents, setAgents] = useState<Agent[]>([
    { id: 1, name: 'Projektledare', role: 'Manager', prompt: 'Du leder projektet, bryter ned uppgifter och bestämmer när en uppgift är helt klar.' },
    { id: 2, name: 'Senior Utvecklare', role: 'Developer', prompt: 'Du skriver ren, effektiv och välkommenterad kod utifrån projektledarens instruktioner.' },
    { id: 3, name: 'Kodgranskare', role: 'Reviewer', prompt: 'Du granskar koden för säkerhet, prestanda och logiska fel. Godkänn eller skicka tillbaka.' },
    { id: 4, name: 'QA Testare', role: 'Tester', prompt: 'Du genererar och kör tester för att säkerställa att programmet fungerar felfritt 24/7.' }
  ]);

  const [newAgent, setNewAgent] = useState<NewAgentState>({
    name: '',
    role: 'Developer',
    prompt: ''
  });

  const [logs, setLogs] = useState<string[]>([
    "[System] Redo att starta agentflödet. Klicka på START.",
  ]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/logs');
    
    ws.onopen = () => console.log('WebSocket ansluten');
    
    ws.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
      if (event.data.includes("slutfört")) {
        setSystemRunning(false);
      }
    };
    
    ws.onclose = () => console.log('WebSocket frånkopplad');
    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const handleToggleSystem = () => {
    if (!systemRunning) {
      setSystemRunning(true);
      setLogs(["[System] Initierar workflow..."]);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          action: "start",
          task: "Bygg ett enkelt Tic-Tac-Toe spel i Python"
        }));
      } else {
        setLogs((prev) => [...prev, "[Error] Backend är inte ansluten! Körs python main.py?"]);
        setSystemRunning(false);
      }
    } else {
      setSystemRunning(false);
    }
  };

  // 3. Typat formulär-event
  const handleAddAgent = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newAgent.name && newAgent.prompt) {
      setAgents([...agents, { ...newAgent, id: Date.now() }]);
      setNewAgent({ name: '', role: 'Developer', prompt: '' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-indigo-500/30">
      {/* Navbar / Header */}
      <nav className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-100">Local<span className="text-indigo-400 font-light">Agency</span></span>
          </div>

          <div className="flex bg-zinc-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" /> Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'agents' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" /> Agent Setup
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-zinc-900/40 px-3 py-1.5 rounded-full border border-white/5">
              <span className="relative flex h-2.5 w-2.5">
                {systemRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${systemRunning ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`}></span>
              </span>
              <span className="text-xs font-medium text-zinc-400 tracking-wide">{systemRunning ? 'System Online' : 'System Paused'}</span>
            </div>
            <button
              onClick={handleToggleSystem}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${systemRunning
                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                  : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                }`}
            >
              {systemRunning ? <><Square className="w-4 h-4" /> STOP</> : <><Play className="w-4 h-4" /> START</>}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* VIEW: AGENT SETUP */}
        {activeTab === 'agents' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 mb-3">Agent Konfiguration</h1>
                <p className="text-zinc-400 text-lg font-light">Skapa och anpassa de lokala AI-agenterna för din byrå.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form för att lägga till ny agent */}
              <div className="col-span-1 bg-zinc-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                <h2 className="text-xl font-semibold text-zinc-100 mb-8 flex items-center gap-2 tracking-tight">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  Skapa ny roll
                </h2>
                <form onSubmit={handleAddAgent} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400">Agentens Namn</label>
                    <input
                      type="text"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 placeholder:text-zinc-600 shadow-inner"
                      placeholder="T.ex. Frontend Ninja"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400">Rolltillhörighet</label>
                    <div className="relative">
                      <select
                        value={newAgent.role}
                        onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                        className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 appearance-none shadow-inner"
                      >
                        <option value="Manager">Manager (Beslutsfattare)</option>
                        <option value="Developer">Developer (Utvecklare)</option>
                        <option value="Reviewer">Reviewer (Granskare)</option>
                        <option value="Tester">Tester (QA & Test)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-zinc-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400">System Prompt (Instruktioner)</label>
                    <textarea
                      value={newAgent.prompt}
                      onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                      className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-zinc-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 h-32 resize-none terminal-scroll placeholder:text-zinc-600 shadow-inner"
                      placeholder="Beskriv exakt hur agenten ska bete sig..."
                    ></textarea>
                  </div>
                  <button type="submit" className="w-full bg-zinc-100 text-zinc-900 font-semibold rounded-xl px-4 py-3.5 hover:bg-white hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 flex items-center justify-center gap-2 mt-4">
                    <Save className="w-4 h-4" /> Spara Agent
                  </button>
                </form>
              </div>

              {/* Lista över aktiva agenter */}
              <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {agents.map(agent => (
                  <div key={agent.id} className="bg-zinc-900/30 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/50 transition-all duration-500 rounded-3xl p-7 group backdrop-blur-sm relative overflow-hidden">
                    {/* Subtle glow effect behind card */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>

                    <div className="flex justify-between items-start mb-5 relative z-10">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80 mb-2 block">{agent.role}</span>
                        <h3 className="text-xl font-semibold tracking-tight text-zinc-100">{agent.name}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-zinc-950/50 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all duration-300 text-zinc-500 shadow-inner">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400/90 leading-relaxed bg-zinc-950/30 p-4 rounded-xl border border-white/5 line-clamp-3 relative z-10 shadow-inner">
                      {agent.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: LIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 mb-3">Command Center</h1>
                <p className="text-zinc-400 text-lg font-light">Följ det 24/7-autonoma flödet från projektledning till slutfört test.</p>
              </div>
            </div>

            {/* Status Cards / Flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {['Manager', 'Developer', 'Reviewer', 'Tester'].map((role, idx) => (
                <div key={role} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm group hover:border-white/10 transition-all duration-300">
                  {idx === 1 && systemRunning && <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>}

                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="font-medium tracking-tight text-zinc-200">{role}</h3>
                    {idx === 1 && systemRunning ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                        <Activity className="w-3.5 h-3.5 animate-pulse" /> Working
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-zinc-950/50 px-2.5 py-1 rounded-md border border-white/5">
                        Idle
                      </span>
                    )}
                  </div>

                  <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden relative z-10 shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-1000 ${idx === 1 && systemRunning ? 'bg-indigo-500 w-2/3 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : idx < 1 ? 'bg-zinc-600 w-full' : 'w-0'}`}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Terminal */}
            <div className="bg-zinc-950/80 border border-white/10 rounded-3xl overflow-hidden mt-8 shadow-2xl backdrop-blur-xl relative">
              {/* Subtle top border highlight */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

              <div className="bg-zinc-900/50 border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-white/5 text-zinc-400 border border-white/5">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium tracking-wide text-zinc-300">Live Agent Output</span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-700/50 border border-white/10"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700/50 border border-white/10"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-700/50 border border-white/10"></div>
                </div>
              </div>
              <div className="p-8 font-mono text-[13px] leading-loose space-y-2 h-[420px] overflow-y-auto terminal-scroll text-zinc-300">
                {logs.map((log, i) => {
                  const hasPrefix = log.includes('] ');
                  const prefix = hasPrefix ? log.split('] ')[0] + ']' : '';
                  const message = hasPrefix ? log.split('] ')[1] : log;
                  return (
                  <div key={i} className="flex hover:bg-white/[0.02] -mx-4 px-4 py-1 rounded transition-colors duration-200">
                    <span className="text-zinc-600 w-28 shrink-0">{prefix}</span>
                    <span className={`${message.includes('Manager') ? 'text-indigo-400' :
                      message.includes('Utvecklare') ? 'text-sky-400' :
                        message.includes('Reviewer') ? 'text-amber-400' :
                          message.includes('Tester') ? 'text-emerald-400' : 'text-zinc-300'
                      }`}>
                      {message}
                    </span>
                  </div>
                  );
                })}
                {systemRunning && (
                  <div className="flex items-center gap-2 text-zinc-500 mt-6 px-4">
                    <span className="w-1.5 h-4 bg-indigo-500/50 animate-pulse"></span> Genererar...
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}