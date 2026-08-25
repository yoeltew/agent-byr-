import pytest

def test_print_board():
    board = [
        ["X", "O", "X"],
        ["O", " ", "O"],
        ["X", " ", " "]
    ]

    def mock_print(x):
        print(x)

    with patch('builtins.print', side_effect=mock_print):
        tic_tac_toe(board)




def test_make_move():
    board = [[" " for _ in range(3)] for _ in range(3)]
    players = ['X', 'O']
    current_player = 0

    make_move(players[current_player], (1, 2), board)
    assert board[1][2] == players[current_player]

### 3. Test för `check_winner`:


def test_check_winner():
    # Spelplats som redan är vannigt.
    board = [
        ["X", "O", " "],
        [" ", "X", "O"],
        [" ", "O", "X"]
    ]
    
    assert check_winner(board) == True

    # Rad, kolumn och diagonal
    board = [
        ["O", "O", "O"],
        [" ", " ", " "],
        [" ", " ", " "]
    ]
    assert check_winner(board) == False

    board = [["X", " ", " "], [ "", "O", " "], [ "", " ", "X"]]
    assert check_winner(board) == True



def test_tic_tac_toe():
    board = [
        [" ", " ", " "],
        [" ", "X", "O"],
        [" ", "O", "X"]
    ]

    tic_tac_toe(board)