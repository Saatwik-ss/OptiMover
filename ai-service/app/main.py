"""
AI Service - FastAPI application for board game AI engines
Loads models once at startup and serves inference via REST endpoints
"""

import os
import torch
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import game engines and routers
from app.models.connect_four_cnn import ConnectFourCNN
from app.engines.connect_four_engine import ConnectFourEngine
from app.routers import connect_four

# Global state for models
class AppState:
    c4_model = None
    device = None

app_state = AppState()

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Service")
    
    # Determine device
    app_state.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {app_state.device}")
    
    # Load Connect Four model
    model_path = os.getenv("MODEL_PATH", "./app/weights/connect_four_epoch_1200.pt")
    
    if not Path(model_path).exists():
        logger.warning(f"Model not found at {model_path}. Initializing new model.")
        app_state.c4_model = ConnectFourCNN()
    else:
        try:
            app_state.c4_model = ConnectFourCNN()
            app_state.c4_model.load_state_dict(torch.load(model_path, map_location=app_state.device))
            logger.info(f"Loaded Connect Four model from {model_path}")
        except Exception as e:
            logger.error(f" Failed to load model: {e}")
            raise
    
    app_state.c4_model.to(app_state.device)
    app_state.c4_model.eval()
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Service")
    app_state.c4_model = None

# Create FastAPI app
app = FastAPI(
    title="Board Game AI Service",
    description="AI engines for multiple board games",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store app_state in app.state so it's accessible to routers
app.state.c4_model = app_state.c4_model
app.state.device = app_state.device

# Include routers
app.include_router(connect_four.router, prefix="/api/games", tags=["Connect Four"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "device": str(app_state.device),
        "models": {
            "connect_four": "loaded" if app_state.c4_model is not None else "not_loaded"
        }
    }

@app.get("/")
async def root():
    """Welcome endpoint"""
    return {
        "message": "Board Game AI Service",
        "endpoints": {
            "health": "/health",
            "connect_four": "/api/games/connect-four/move",
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
