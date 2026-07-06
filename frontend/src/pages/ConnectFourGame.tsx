/**
 * Connect Four Game Page
 * Full game experience with controls and status
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import Connect4Board from "../components/Connect4Board";
import Button from "../components/Button";

export default function ConnectFourGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { socket, makeMove, onMoveMade, onGameEnded, onAIError } = useSocket();
  const { user } = useAuth();

  const [board, setBoard] = useState<number[][]>(
    Array(6).fill(Array(7).fill(0))
  );
  const [gameStatus, setGameStatus] = useState<"ongoing" | "finished">("ongoing");
  const [result, setResult] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isVsAI, setIsVsAI] = useState(true);

  useEffect(() => {
    if (!gameId || !user) return;

    // Listen for game events
    const unsubscribeMade = onMoveMade((event) => {
      if (event.gameId === gameId) {
        setBoard(event.gameState);
        setMoveCount((prev) => prev + 1);

        if (event.playerId === "AI") {
          setIsAIThinking(false);
        }

        if (event.status?.status === "finished") {
          setGameStatus("finished");
          setResult(event.status.result || null);
          if (event.status.result === "player1_wins") {
            setWinner("You win!");
          } else if (event.status.result === "ai_wins") {
            setWinner("AI wins!");
          } else {
            setWinner("Draw!");
          }
        }
      }
    });

    const unsubscribeEnded = onGameEnded((event) => {
      if (event.gameId === gameId) {
        setGameStatus("finished");
        if (event.result === "player1_wins") {
          setWinner("You win!");
        } else if (event.result === "ai_wins") {
          setWinner("AI wins!");
        } else if (event.result === "resignation") {
          setWinner(event.winner === user.id ? "You win by resignation!" : "Opponent resigned");
        }
      }
    });

    const unsubscribeAIError = onAIError((event) => {
      if (event.gameId === gameId) {
        setError(event.error);
        setIsAIThinking(false);
      }
    });

    return () => {
      unsubscribeMade();
      unsubscribeEnded();
      unsubscribeAIError();
    };
  }, [gameId, user]);

  const handleColumnClick = async (column: number) => {
    if (!gameId || !user || gameStatus !== "ongoing") return;

    try {
      setError(null);
      setIsAIThinking(true);
      await makeMove(gameId, user.id, column);
      // AI will move automatically after server processes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make move");
      setIsAIThinking(false);
    }
  };

  const handlePlayAgain = () => {
    navigate("/dashboard");
  };

  const handleResign = async () => {
    if (!gameId || !user) return;

    try {
      await socket?.emit("resign", { gameId, playerId: user.id });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resign");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Connect Four</h1>
        <p className="text-slate-400">
          {isVsAI ? "Playing against AI" : "Multiplayer Game"}
        </p>
      </div>

      {/* Status */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p className="text-slate-400 text-sm">Moves</p>
            <p className="text-2xl font-bold text-white">{moveCount}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Status</p>
            <p className="text-xl font-bold text-blue-400">
              {gameStatus === "finished" ? "Game Over" : "Playing"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Your Color</p>
            <div className="flex justify-center">
              <div className="w-6 h-6 bg-yellow-400 rounded-full shadow-lg" />
            </div>
          </div>
        </div>

        {winner && (
          <div className="text-center pt-4 border-t border-slate-700">
            <p className="text-2xl font-bold text-green-400">{winner}</p>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="mb-8">
        <Connect4Board
          board={board}
          onColumnClick={handleColumnClick}
          disabled={gameStatus !== "ongoing"}
          isAIThinking={isAIThinking}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-4 justify-center">
        {gameStatus === "finished" ? (
          <Button
            onClick={handlePlayAgain}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Play Again
          </Button>
        ) : (
          <Button
            onClick={handleResign}
            className="bg-red-600 hover:bg-red-700"
            disabled={isAIThinking}
          >
            Resign
          </Button>
        )}

        <Button
          onClick={() => navigate("/dashboard")}
          className="bg-slate-600 hover:bg-slate-700"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
