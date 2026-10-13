"""
Chess API Router
FastAPI endpoints for Chess AI
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.engines.chess_engine import ChessEngine

router = APIRouter()

class ChessMoveRequest(BaseModel):
    fen: str = Field(..., description="Board position in FEN notation")
    difficulty: Optional[int] = Field(3, ge=1, le=5, description="AI difficulty level (1-5)")

class ChessMoveResponse(BaseModel):
    move: str
    from_square: str = Field(..., alias="from")
    to_square: str = Field(..., alias="to")
    promotion: Optional[str] = None
    eval: Optional[float] = None

    class Config:
        populate_by_name = True

@router.post("/chess/move", response_model=ChessMoveResponse)
async def get_chess_move(req: ChessMoveRequest):
    try:
        result = ChessEngine.get_best_move(req.fen, difficulty=req.difficulty or 3)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return ChessMoveResponse(
            move=result["move"],
            from_square=result["from"],
            to_square=result["to"],
            promotion=result.get("promotion"),
            eval=result.get("eval")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chess AI error: {str(e)}")

@router.get("/chess/health")
async def chess_health():
    return {"status": "ok", "game": "chess"}
