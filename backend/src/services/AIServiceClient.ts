/**
 * AI Service Client
 * HTTP client for communicating with Python FastAPI AI service
 */

import axios, { AxiosInstance } from "axios";

export interface AIMove {
  move: number; // Column index for Connect Four
  confidence?: number;
  analysis?: Record<number, number>;
}

export interface PositionAnalysis {
  win_probability: number;
  valid_moves: number[];
  move_scores: Record<number, number>;
}

export interface GameState {
  status: "ongoing" | "human_wins" | "ai_wins" | "draw";
  is_full: boolean;
  last_move?: [number, number];
}

export class AIServiceClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = "http://localhost:8000") {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get AI's move for Connect Four
   */
  async getConnectFourMove(board: number[][]): Promise<AIMove> {
    try {
      const response = await this.client.post<AIMove>("/api/games/connect-four/move", {
        board,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to get AI move");
    }
  }

  /**
   * Analyze a board position
   */
  async analyzePosition(
    board: number[][],
    perspective: number = 1
  ): Promise<PositionAnalysis> {
    try {
      const response = await this.client.post<PositionAnalysis>(
        "/api/games/connect-four/analyze",
        {
          board,
          perspective,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to analyze position");
    }
  }

  /**
   * Get game state (winner, draw, ongoing)
   */
  async getGameState(board: number[][]): Promise<GameState> {
    try {
      const response = await this.client.post<GameState>(
        "/api/games/connect-four/state",
        {
          board,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to get game state");
    }
  }

  /**
   * Test if AI service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch (error) {
      console.error("AI Service health check failed:", error);
      return false;
    }
  }

  /**
   * Test model inference
   */
  async testInference(): Promise<any> {
    try {
      const response = await this.client.get("/api/games/connect-four/test");
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Inference test failed");
    }
  }

  /**
   * Error handler
   */
  private handleError(error: any, message: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail || error.message;

      if (status === 400) {
        return new Error(`Bad request: ${detail}`);
      } else if (status === 500) {
        return new Error(`AI service error: ${detail}`);
      } else if (error.code === "ECONNREFUSED") {
        return new Error("AI service is not available. Is it running?");
      } else {
        return new Error(`${message}: ${detail}`);
      }
    }

    return new Error(message);
  }

  /**
   * Set API key if needed
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Update base URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }
}

export default AIServiceClient;
