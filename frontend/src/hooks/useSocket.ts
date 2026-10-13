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
  gameState: number[][] | { board: number[][]; moveCount?: number; currentPlayer?: number };
  move?: GameMove;
  playerId?: string;
  status?: {
    status: "ongoing" | "finished";
    result?: "player1_wins" | "player2_wins" | "draw" | "ai_wins";
    winner?: number;
  };
  player1Time?: number;
  player2Time?: number;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(import.meta.env.VITE_API_URL || "http://localhost:4000", {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ["websocket", "polling"],
      });
    }

    const socket = globalSocket;
    socketRef.current = socket;

    const onConnect = () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      setError(null);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      console.error("Socket error:", err);
      setError(String(err));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // Sync immediately (important when reusing socket after Strict Mode remount)
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,

    // Game methods (Connect Four)
    createGame: (
      playerId: string,
      vsAI: boolean = true,
      options: Record<string, any> | null = null
    ) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "create-game",
          { playerId, gameType: "connect-four", vsAI, options },
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

    // Game methods (Chess)
    createChessGame: (
      playerId: string,
      vsAI: boolean = true,
      options: Record<string, any> | null = null,
      username?: string
    ) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "create-chess-game",
          { playerId, vsAI, options, username },
          (response: any) => {
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });
    },

    joinChessGame: (gameId: string, playerId: string, username?: string) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "join-chess-game",
          { gameId, playerId, username },
          (response: any) => {
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });
    },

    getChessGame: (gameId: string, playerId: string) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "get-chess-game",
          { gameId, playerId },
          (response: any) => {
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });
    },

    makeChessMove: (
      gameId: string,
      playerId: string,
      move: { from: string; to: string; promotion?: string }
    ) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit(
          "make-chess-move",
          { gameId, playerId, move },
          (response: any) => {
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });
    },

    resignChess: (gameId: string, playerId: string) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit("resign-chess", { gameId, playerId }, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },

    offerDraw: (gameId: string, playerId: string) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit("offer-draw", { gameId, playerId }, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },

    respondDraw: (gameId: string, playerId: string, accept: boolean) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit("respond-draw", { gameId, playerId, accept }, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },

    offerChessDraw: (gameId: string, playerId: string) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit("offer-chess-draw", { gameId, playerId }, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },

    respondChessDraw: (gameId: string, playerId: string, accept: boolean) => {
      return new Promise((resolve, reject) => {
        socketRef.current?.emit("respond-chess-draw", { gameId, playerId, accept }, (response: any) => {
          if (response?.error) {
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

    onDrawOffered: (callback: (event: any) => void) => {
      socketRef.current?.on("draw-offered", callback);
      return () => socketRef.current?.off("draw-offered", callback);
    },

    onDrawDeclined: (callback: (event: any) => void) => {
      socketRef.current?.on("draw-declined", callback);
      return () => socketRef.current?.off("draw-declined", callback);
    },

    onPlayerJoined: (callback: (event: any) => void) => {
      socketRef.current?.on("player-joined", callback);
      return () => socketRef.current?.off("player-joined", callback);
    },

    onAIError: (callback: (event: any) => void) => {
      socketRef.current?.on("ai-error", callback);
      return () => socketRef.current?.off("ai-error", callback);
    },

    // Chess Event listeners
    onChessMoveMade: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-move-made", callback);
      return () => socketRef.current?.off("chess-move-made", callback);
    },

    onChessGameCreated: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-game-created", callback);
      return () => socketRef.current?.off("chess-game-created", callback);
    },

    onChessGameEnded: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-game-ended", callback);
      return () => socketRef.current?.off("chess-game-ended", callback);
    },

    onChessDrawOffered: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-draw-offered", callback);
      return () => socketRef.current?.off("chess-draw-offered", callback);
    },

    onChessDrawDeclined: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-draw-declined", callback);
      return () => socketRef.current?.off("chess-draw-declined", callback);
    },

    onChessPlayerJoined: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-player-joined", callback);
      return () => socketRef.current?.off("chess-player-joined", callback);
    },

    onChessAIError: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-ai-error", callback);
      return () => socketRef.current?.off("chess-ai-error", callback);
    },

    onChessTimeSync: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-time-sync", callback);
      return () => socketRef.current?.off("chess-time-sync", callback);
    },

    onChessTimeOut: (callback: (event: any) => void) => {
      socketRef.current?.on("chess-time-out", callback);
      return () => socketRef.current?.off("chess-time-out", callback);
    },

    onConnectFourTimeSync: (callback: (event: any) => void) => {
      socketRef.current?.on("connect-four-time-sync", callback);
      return () => socketRef.current?.off("connect-four-time-sync", callback);
    },

    onConnectFourTimeOut: (callback: (event: any) => void) => {
      socketRef.current?.on("connect-four-time-out", callback);
      return () => socketRef.current?.off("connect-four-time-out", callback);
    },
  };
}
