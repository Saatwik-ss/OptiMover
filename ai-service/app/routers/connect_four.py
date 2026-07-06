"""
Connect Four API Router
FastAPI endpoints for Connect Four AI
"""

import numpy as np
from fastapi import APIRouter, HTTPException, Request
from typing import List

from app.engines.connect_four_engine import GameBoard, ConnectFourEngine
from app.schemas.connect_four import (
    MoveRequest, MoveResponse,
    AnalyzeRequest, AnalyzeResponse,
    GameStateRequest, GameStateResponse
)

router = APIRouter()

def get_engine(request: Request) -> ConnectFourEngine:
    """Get Connect Four engine with loaded model"""
    model = request.app.state.c4_model
    device = request.app.state.device
    return ConnectFourEngine(model=model, device=device)


@router.post("/connect-four/move", response_model=MoveResponse)
async def get_ai_move(req: MoveRequest, request: Request):
    """
    Get AI's next move for given board state
    
    The AI evaluates all valid moves and returns the one with
    the lowest win probability for the opponent (highest for AI).
    """
    try:
        engine = get_engine(request)
        board = GameBoard(np.array(req.board, dtype=np.int8))
        
        # Validate board state
        valid_moves = board.get_valid_moves()
        if not valid_moves:
            raise HTTPException(
                status_code=400,
                detail="No valid moves available. Board may be full or malformed."
            )
        
        # Get AI move
        best_move = engine.ai_move(board)
        
        # Get scores for analysis
        scores = engine.get_move_scores(board)
        
        # Confidence is from human's perspective (lower = better for AI)
        human_view_board = board.copy()
        human_view_board.drop_piece(best_move, GameBoard.AI)
        confidence = engine.evaluate_position(human_view_board, GameBoard.HUMAN)
        
        return MoveResponse(
            move=best_move,
            confidence=confidence,
            analysis=scores
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@router.post("/connect-four/analyze", response_model=AnalyzeResponse)
async def analyze_position(req: AnalyzeRequest, request: Request):
    """
    Analyze a position and get move scores
    
    Returns win probability from the given perspective and scores
    for all valid moves.
    """
    try:
        engine = get_engine(request)
        board = GameBoard(np.array(req.board, dtype=np.int8))
        
        player = req.perspective
        valid_moves = board.get_valid_moves()
        
        if not valid_moves:
            raise HTTPException(
                status_code=400,
                detail="No valid moves available."
            )
        
        # Evaluate current position
        win_prob = engine.evaluate_position(board, player)
        
        # Get scores for all moves
        move_scores = {}
        for col in valid_moves:
            test_board = board.copy()
            test_board.drop_piece(col, player)
            # From opponent's perspective
            opponent = GameBoard.AI if player == GameBoard.HUMAN else GameBoard.HUMAN
            score = engine.evaluate_position(test_board, opponent)
            move_scores[col] = score
        
        return AnalyzeResponse(
            win_probability=win_prob,
            valid_moves=valid_moves,
            move_scores=move_scores
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.post("/connect-four/state", response_model=GameStateResponse)
async def get_game_state(req: GameStateRequest, request: Request):
    """
    Get game state (status, winner, board full)
    
    This is lightweight validation - no model inference needed.
    """
    try:
        board = GameBoard(np.array(req.board, dtype=np.int8))
        status = board.get_game_status()
        
        return GameStateResponse(
            status=status,
            is_full=board.is_board_full(),
            last_move=board.last_move
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/connect-four/test")
async def test_inference(request: Request):
    """
    Test endpoint for verifying model is loaded and working
    Returns a test move on empty board
    """
    try:
        engine = get_engine(request)
        
        # Create empty board
        empty_board = GameBoard()
        
        # Get move (should return center column on empty board)
        test_move = engine.ai_move(empty_board)
        
        return {
            "status": "ok",
            "test_move": test_move,
            "model_loaded": request.app.state.c4_model is not None,
            "device": str(request.app.state.device)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")
