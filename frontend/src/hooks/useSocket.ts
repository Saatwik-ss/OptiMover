/**
 * useSocket Hook
 * Manages Socket.IO connection and game events
 */

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;

export interface GameMove {
  column: number;
}

export interface GameEvent {
  gameId: string;
  gameState: number[][];
  move?: GameMove;
  playerId?: string;
  status?: {
    status: "ongoing" | "finished";
    result?: "player1_wins" | "player2_wins" | "draw";
    winner?: number;
  };
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reuse global socket if available
    if (globalSocket) {
      socketRef.current = globalSocket;
      setIsConnected(globalSocket.connected);
      return;
    }

    // Create new socket connection
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    globalSocket = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket error:", error);
      setError(String(error));
    });

    return () => {
      // Don't disconnect - keep connection alive
      // socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,

    // Game methods
    createGame: (playerId: string, vsAI: boolean = true) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "create-game",
          { playerId, gameType: "connect-four", vsAI },
          (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });
    },

    joinGame: (gameId: string, playerId: string) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "join-game",
          { gameId, playerId },
          (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });
    },

    makeMove: (gameId: string, playerId: string, column: number) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "make-move",
          { gameId, playerId, column },
          (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });
    },

    resign: (gameId: string, playerId: string) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit("resign", { gameId, playerId }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },

    // Event listeners
    onMoveMade: (callback: (event: GameEvent) => void) => {
      socketRef.current?.on("move-made", callback);
      return () => socketRef.current?.off("move-made", callback);
    },

    onGameCreated: (callback: (event: any) => void) => {
      socketRef.current?.on("game-created", callback);
      return () => socketRef.current?.off("game-created", callback);
    },

    onGameEnded: (callback: (event: any) => void) => {
      socketRef.current?.on("game-ended", callback);
      return () => socketRef.current?.off("game-ended", callback);
    },

    onPlayerJoined: (callback: (event: any) => void) => {
      socketRef.current?.on("player-joined", callback);
      return () => socketRef.current?.off("player-joined", callback);
    },

    onAIError: (callback: (event: any) => void) => {
      socketRef.current?.on("ai-error", callback);
      return () => socketRef.current?.off("ai-error", callback);
    },
  };
}
