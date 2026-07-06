"""
Connect Four Engine
Implements game rules, move validation, and AI decision making
"""

import numpy as np
from typing import Tuple, Optional, List
import torch

class GameBoard:
    """Connect Four board state and rules"""
    
    ROWS = 6
    COLS = 7
    WINDOW_LENGTH = 4
    
    # Players: 0 = empty, 1 = human, 2 = AI
    EMPTY = 0
    HUMAN = 1
    AI = 2
    
    def __init__(self, board: Optional[np.ndarray] = None):
        """
        Initialize board
        
        Args:
            board: Optional 6x7 numpy array. If None, creates empty board.
        """
        if board is None:
            self.board = np.zeros((self.ROWS, self.COLS), dtype=np.int8)
        else:
            self.board = board.copy()
        
        self.last_move = None
        self.move_count = 0
    
    def copy(self) -> 'GameBoard':
        """Create a deep copy of the board"""
        new_board = GameBoard(self.board.copy())
        new_board.last_move = self.last_move
        new_board.move_count = self.move_count
        return new_board
    
    def is_valid_move(self, col: int) -> bool:
        """Check if a column is a valid move"""
        if col < 0 or col >= self.COLS:
            return False
        # Can play if top cell is empty
        return self.board[0, col] == self.EMPTY
    
    def get_valid_moves(self) -> List[int]:
        """Get all valid column moves"""
        return [col for col in range(self.COLS) if self.is_valid_move(col)]
    
    def drop_piece(self, col: int, player: int) -> bool:
        """
        Drop piece in column, return success
        
        Args:
            col: Column index (0-6)
            player: HUMAN (1) or AI (2)
            
        Returns:
            True if successful, False if column is full
        """
        if not self.is_valid_move(col):
            return False
        
        # Find lowest empty row in column
        for row in range(self.ROWS - 1, -1, -1):
            if self.board[row, col] == self.EMPTY:
                self.board[row, col] = player
                self.last_move = (row, col)
                self.move_count += 1
                return True
        
        return False
    
    def check_winner(self, player: int) -> bool:
        """Check if player has won"""
        # Check horizontal
        for row in range(self.ROWS):
            for col in range(self.COLS - self.WINDOW_LENGTH + 1):
                if all(self.board[row, col + i] == player for i in range(self.WINDOW_LENGTH)):
                    return True
        
        # Check vertical
        for col in range(self.COLS):
            for row in range(self.ROWS - self.WINDOW_LENGTH + 1):
                if all(self.board[row + i, col] == player for i in range(self.WINDOW_LENGTH)):
                    return True
        
        # Check diagonal /
        for row in range(self.WINDOW_LENGTH - 1, self.ROWS):
            for col in range(self.COLS - self.WINDOW_LENGTH + 1):
                if all(self.board[row - i, col + i] == player for i in range(self.WINDOW_LENGTH)):
                    return True
        
        # Check diagonal \
        for row in range(self.ROWS - self.WINDOW_LENGTH + 1):
            for col in range(self.COLS - self.WINDOW_LENGTH + 1):
                if all(self.board[row + i, col + i] == player for i in range(self.WINDOW_LENGTH)):
                    return True
        
        return False
    
    def is_board_full(self) -> bool:
        """Check if board is full"""
        return np.all(self.board != self.EMPTY)
    
    def get_game_status(self) -> str:
        """
        Get game status
        Returns: 'ongoing', 'human_wins', 'ai_wins', 'draw'
        """
        if self.check_winner(self.HUMAN):
            return "human_wins"
        elif self.check_winner(self.AI):
            return "ai_wins"
        elif self.is_board_full():
            return "draw"
        else:
            return "ongoing"
    
    def serialize(self) -> List[List[int]]:
        """Convert board to JSON-serializable format"""
        return self.board.tolist()
    
    @staticmethod
    def deserialize(data: List[List[int]]) -> 'GameBoard':
        """Create board from JSON data"""
        return GameBoard(np.array(data, dtype=np.int8))


class ConnectFourEngine:
    """AI engine for Connect Four"""
    
    def __init__(self, model=None, device=None):
        """
        Initialize engine
        
        Args:
            model: Trained PyTorch CNN model
            device: torch.device (cuda or cpu)
        """
        self.model = model
        self.device = device
    
    def convert_board_for_model(self, board: np.ndarray, player: int) -> torch.Tensor:
        """
        Convert board to model input format
        
        Perspective: always from current player's view
        - Values: 0 (empty), 1 (current player), -1 (opponent)
        
        Args:
            board: 6x7 numpy array
            player: Current player (GameBoard.HUMAN or GameBoard.AI)
            
        Returns:
            (1, 1, 6, 7) tensor normalized for model input
        """
        opponent = GameBoard.HUMAN if player == GameBoard.AI else GameBoard.AI
        
        # Convert to perspective
        model_board = np.where(board == player, 1, 0).astype(np.float32)
        model_board -= np.where(board == opponent, 1, 0).astype(np.float32)
        
        # Add channel dimension: (1, 6, 7)
        model_board = np.expand_dims(model_board, axis=0)
        
        # Convert to tensor and add batch dimension: (1, 1, 6, 7)
        tensor = torch.from_numpy(model_board).unsqueeze(0)
        
        return tensor.to(self.device) if self.device else tensor
    
    def evaluate_position(self, board: GameBoard, player: int) -> float:
        """
        Evaluate position using CNN
        
        Args:
            board: GameBoard instance
            player: Current player
            
        Returns:
            Win probability [0, 1] from current player's perspective
        """
        if self.model is None:
            # Random evaluation if no model
            return np.random.random()
        
        tensor = self.convert_board_for_model(board.board, player)
        
        with torch.no_grad():
            win_prob = self.model(tensor).cpu().item()
        
        return win_prob
    
    def ai_move(self, board: GameBoard) -> int:
        """
        Get AI's best move using 1-ply lookahead
        
        Evaluates all 7 possible moves, scores resulting positions,
        returns column with minimum win probability for opponent
        (= maximum for AI)
        
        Args:
            board: GameBoard instance
            
        Returns:
            Best column (0-6)
        """
        valid_moves = board.get_valid_moves()
        
        if not valid_moves:
            raise ValueError("No valid moves available")
        
        # Only one move? Take it
        if len(valid_moves) == 1:
            return valid_moves[0]
        
        best_move = valid_moves[0]
        best_score = float('inf')
        
        for col in valid_moves:
            # Simulate move
            test_board = board.copy()
            test_board.drop_piece(col, GameBoard.AI)
            
            # Check if this move wins immediately
            if test_board.check_winner(GameBoard.AI):
                return col
            
            # Check if opponent would win - block it
            test_board2 = board.copy()
            test_board2.drop_piece(col, GameBoard.HUMAN)
            if test_board2.check_winner(GameBoard.HUMAN):
                return col
            
            # Evaluate from human's perspective (opponent)
            human_win_prob = self.evaluate_position(test_board, GameBoard.HUMAN)
            
            # Lower opponent win prob = better for AI
            if human_win_prob < best_score:
                best_score = human_win_prob
                best_move = col
        
        return best_move
    
    def get_move_scores(self, board: GameBoard) -> dict:
        """
        Get scores for all valid moves (for analysis/debugging)
        
        Returns:
            {col: opponent_win_prob, ...}
        """
        scores = {}
        
        for col in board.get_valid_moves():
            test_board = board.copy()
            test_board.drop_piece(col, GameBoard.AI)
            
            human_win_prob = self.evaluate_position(test_board, GameBoard.HUMAN)
            scores[col] = human_win_prob
        
        return scores
