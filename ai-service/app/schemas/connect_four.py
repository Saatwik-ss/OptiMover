"""
Pydantic schemas for Connect Four API
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict

class MoveRequest(BaseModel):
    """Request to get AI move"""
    board: List[List[int]] = Field(
        ...,
        description="6x7 board state. 0=empty, 1=human, 2=AI"
    )
    
    @validator('board')
    def validate_board(cls, v):
        if len(v) != 6:
            raise ValueError("Board must have 6 rows")
        if not all(len(row) == 7 for row in v):
            raise ValueError("Each row must have 7 columns")
        if not all(
            cell in [0, 1, 2]
            for row in v
            for cell in row
        ):
            raise ValueError("Cells must be 0 (empty), 1 (human), or 2 (AI)")
        return v


class MoveResponse(BaseModel):
    """Response with AI move"""
    move: int = Field(..., ge=0, le=6, description="Column index (0-6)")
    confidence: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
        description="Opponent win probability (lower is better)"
    )
    analysis: Optional[Dict[int, float]] = Field(
        default=None,
        description="Scores for all valid moves"
    )


class AnalyzeRequest(BaseModel):
    """Request to analyze a position"""
    board: List[List[int]] = Field(
        ...,
        description="6x7 board state"
    )
    perspective: int = Field(
        default=1,
        description="1 for human, 2 for AI"
    )
    
    @validator('board')
    def validate_board(cls, v):
        if len(v) != 6:
            raise ValueError("Board must have 6 rows")
        if not all(len(row) == 7 for row in v):
            raise ValueError("Each row must have 7 columns")
        return v
    
    @validator('perspective')
    def validate_perspective(cls, v):
        if v not in [1, 2]:
            raise ValueError("Perspective must be 1 or 2")
        return v


class AnalyzeResponse(BaseModel):
    """Response with position analysis"""
    win_probability: float = Field(
        ...,
        ge=0,
        le=1,
        description="Win probability from given perspective"
    )
    valid_moves: List[int] = Field(
        ...,
        description="List of valid column indices"
    )
    move_scores: Dict[int, float] = Field(
        ...,
        description="Win probability for each valid move"
    )


class GameStateRequest(BaseModel):
    """Request to check game state"""
    board: List[List[int]]
    
    @validator('board')
    def validate_board(cls, v):
        if len(v) != 6:
            raise ValueError("Board must have 6 rows")
        if not all(len(row) == 7 for row in v):
            raise ValueError("Each row must have 7 columns")
        return v


class GameStateResponse(BaseModel):
    """Response with game state"""
    status: str = Field(
        ...,
        description="'ongoing', 'human_wins', 'ai_wins', or 'draw'"
    )
    is_full: bool = Field(..., description="Whether board is full")
    last_move: Optional[tuple] = Field(
        None,
        description="[row, col] of last move"
    )
