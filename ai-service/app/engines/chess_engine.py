"""
Chess AI Engine
Evaluates chess positions and generates moves based on difficulty levels (1 to 5).
Uses minimax with alpha-beta pruning and Piece-Square Tables (PST).
"""

import chess
import random
from typing import Tuple, Optional, Dict, Any

# Piece base values (centipawns)
PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 20000,
}

# Piece-Square Tables (evaluated from White's perspective)
PAWN_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
]

KNIGHT_TABLE = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
]

BISHOP_TABLE = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
]

ROOK_TABLE = [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
]

QUEEN_TABLE = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
]

KING_TABLE_MID = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
]


def evaluate_board(board: chess.Board) -> int:
    """
    Static evaluation of board position from White's perspective in centipawns.
    Positive means White is leading; negative means Black is leading.
    """
    if board.is_checkmate():
        return -99999 if board.turn == chess.WHITE else 99999
    if board.is_stalemate() or board.is_insufficient_material():
        return 0

    score = 0
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if not piece:
            continue

        val = PIECE_VALUES.get(piece.piece_type, 0)
        pst = 0

        # Square indices for PST (flip rank for black)
        pst_idx = square if piece.color == chess.WHITE else chess.square_mirror(square)

        if piece.piece_type == chess.PAWN:
            pst = PAWN_TABLE[pst_idx]
        elif piece.piece_type == chess.KNIGHT:
            pst = KNIGHT_TABLE[pst_idx]
        elif piece.piece_type == chess.BISHOP:
            pst = BISHOP_TABLE[pst_idx]
        elif piece.piece_type == chess.ROOK:
            pst = ROOK_TABLE[pst_idx]
        elif piece.piece_type == chess.QUEEN:
            pst = QUEEN_TABLE[pst_idx]
        elif piece.piece_type == chess.KING:
            pst = KING_TABLE_MID[pst_idx]

        total_piece_score = val + pst
        if piece.color == chess.WHITE:
            score += total_piece_score
        else:
            score -= total_piece_score

    return score


def minimax(board: chess.Board, depth: int, alpha: float, beta: float, is_maximizing: bool) -> Tuple[float, Optional[chess.Move]]:
    """Minimax search with alpha-beta pruning."""
    if depth == 0 or board.is_game_over():
        return float(evaluate_board(board)), None

    best_move = None

    # Move ordering: captures and checks first
    legal_moves = list(board.legal_moves)
    legal_moves.sort(key=lambda m: (board.is_capture(m), board.gives_check(m)), reverse=True)

    if is_maximizing:
        max_eval = -float('inf')
        for move in legal_moves:
            board.push(move)
            eval_score, _ = minimax(board, depth - 1, alpha, beta, False)
            board.pop()
            if eval_score > max_eval:
                max_eval = eval_score
                best_move = move
            alpha = max(alpha, eval_score)
            if beta <= alpha:
                break
        return max_eval, best_move
    else:
        min_eval = float('inf')
        for move in legal_moves:
            board.push(move)
            eval_score, _ = minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            if eval_score < min_eval:
                min_eval = eval_score
                best_move = move
            beta = min(beta, eval_score)
            if beta <= alpha:
                break
        return min_eval, best_move


class ChessEngine:
    """Serves chess moves for various difficulty tiers."""

    @staticmethod
    def get_best_move(fen: str, difficulty: int = 3) -> Dict[str, Any]:
        board = chess.Board(fen)
        if board.is_game_over():
            return {"error": "Game is already over"}

        legal_moves = list(board.legal_moves)
        if not legal_moves:
            return {"error": "No legal moves available"}

        is_white = (board.turn == chess.WHITE)

        # Level 1 (Casual/Beginner ~ 600 ELO): 70% random, 30% shallow search
        if difficulty <= 1:
            if random.random() < 0.65:
                chosen_move = random.choice(legal_moves)
                eval_score = float(evaluate_board(board)) / 100.0
                return {
                    "move": chosen_move.uci(),
                    "from": chess.square_name(chosen_move.from_square),
                    "to": chess.square_name(chosen_move.to_square),
                    "promotion": chosen_move.promotion and chess.piece_symbol(chosen_move.promotion),
                    "eval": eval_score,
                }
            depth = 1

        # Level 2 (Novice ~ 1000 ELO): Depth 1 with 25% blunder chance
        elif difficulty == 2:
            if random.random() < 0.25:
                chosen_move = random.choice(legal_moves)
                eval_score = float(evaluate_board(board)) / 100.0
                return {
                    "move": chosen_move.uci(),
                    "from": chess.square_name(chosen_move.from_square),
                    "to": chess.square_name(chosen_move.to_square),
                    "promotion": chosen_move.promotion and chess.piece_symbol(chosen_move.promotion),
                    "eval": eval_score,
                }
            depth = 2

        # Level 3 (Intermediate ~ 1400 ELO): Depth 2-3 standard search
        elif difficulty == 3:
            depth = 2

        # Level 4 (Advanced ~ 1700 ELO): Depth 3
        elif difficulty == 4:
            depth = 3

        # Level 5 (Master ~ 2000+ ELO): Depth 4
        else:
            depth = 4

        score, best_move = minimax(board, depth=depth, alpha=-float('inf'), beta=float('inf'), is_maximizing=is_white)

        if not best_move:
            best_move = random.choice(legal_moves)

        eval_norm = score / 100.0  # In pawn units

        return {
            "move": best_move.uci(),
            "from": chess.square_name(best_move.from_square),
            "to": chess.square_name(best_move.to_square),
            "promotion": best_move.promotion and chess.piece_symbol(best_move.promotion),
            "eval": eval_norm,
        }
