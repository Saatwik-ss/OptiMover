/**
 * Connect Four Game Page
 * Full game experience with controls and status
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Copy, Check, Users } from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/authContext";
import Connect4Board from "../components/Connect4Board";
import Button from "../components/Button";

function createEmptyBoard(): number[][] {
  return Array.from({ length: 6 }, () => Array(7).fill(0));
}

interface GameLocationState {
  initialState?: { board: number[][]; currentPlayer?: number };
  isVsAI?: boolean;
  isHost?: boolean;
  options?: any;
}

export default function ConnectFourGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, makeMove, onMoveMade, onGameEnded, onAIError, onPlayerJoined } =
    useSocket();
  const { user } = useAuth();

  const gameState = (location.state as GameLocationState | null) ?? {};
  const isVsAI = gameState.isVsAI ?? true;
  const isHost = gameState.isHost ?? true;
  const options = gameState.options ?? null;

  const [board, setBoard] = useState<number[][]>(
    () => gameState.initialState?.board ?? createEmptyBoard()
  );
  const [currentPlayer, setCurrentPlayer] = useState(
    gameState.initialState?.currentPlayer ?? 1
  );
  const [myPlayerNumber] = useState<1 | 2>(isVsAI || isHost ? 1 : 2);
  const [opponentJoined, setOpponentJoined] = useState(isVsAI || !isHost);
  const [gameStatus, setGameStatus] = useState<"ongoing" | "finished">("ongoing");
  const [winner, setWinner] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isMyTurn = currentPlayer === myPlayerNumber;
  const canPlay =
    gameStatus === "ongoing" && opponentJoined && isMyTurn && !isAIThinking;

  const resolveWinnerMessage = (result: string, resigned?: boolean) => {
    if (result === "draw") return "Draw!";
    if (result === "player1_wins") {
      return myPlayerNumber === 1 ? "You win!" : "Opponent wins!";
    }
    if (result === "player2_wins") {
      return myPlayerNumber === 2 ? "You win!" : "Opponent wins!";
    }
    if (result === "ai_wins") return "AI wins!";
    if (resigned) return "Game ended by resignation";
    return null;
  };

  useEffect(() => {
    if (!gameId || !user) return;

    const unsubscribeMade = onMoveMade((event) => {
      if (event.gameId !== gameId) return;

      const state = event.gameState;
      const nextBoard =
        typeof state === "object" && "board" in state ? state.board : state;
      setBoard(nextBoard);
      if (typeof state === "object" && "currentPlayer" in state && state.currentPlayer) {
        setCurrentPlayer(state.currentPlayer);
      }
      setMoveCount((prev) => prev + 1);

      if (event.playerId === "AI") {
        setIsAIThinking(false);
      } else if (!isVsAI && event.playerId === user.id) {
        setIsAIThinking(false);
      }

      if (event.status?.status === "finished" && event.status.result) {
        setGameStatus("finished");
        setWinner(resolveWinnerMessage(event.status.result) ?? "Game over");
      }
    });

    const unsubscribeEnded = onGameEnded((event) => {
      if (event.gameId !== gameId) return;

      setGameStatus("finished");
      if (event.result === "resignation") {
        setWinner(
          event.winner === user.id
            ? "You win by resignation!"
            : "Opponent wins by resignation!"
        );
      } else if (event.result) {
        setWinner(resolveWinnerMessage(event.result) ?? "Game over");
      }
    });

    const unsubscribeJoined = onPlayerJoined((event) => {
      if (event.gameId === gameId) {
        setOpponentJoined(true);
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
      unsubscribeJoined();
      unsubscribeAIError();
    };
  }, [gameId, user, isVsAI, myPlayerNumber]);

  const handleColumnClick = async (column: number) => {
    if (!gameId || !user || !canPlay) return;

    try {
      setError(null);
      if (isVsAI) {
        setIsAIThinking(true);
      }
      await makeMove(gameId, user.id, column);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make move");
      setIsAIThinking(false);
    }
  };

  const handleCopyGameId = async () => {
    if (!gameId) return;
    await navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const myColorClass = myPlayerNumber === 1 ? "bg-yellow-400" : "bg-red-500";
  const opponentColorClass = myPlayerNumber === 1 ? "bg-red-500" : "bg-yellow-400";

  // Apply options-based classes
  const playerPieceClass = options?.playerColor === "red" ? "bg-red-500" : options?.playerColor === "yellow" ? "bg-yellow-400" : myColorClass;
  const opponentPieceClass = options?.opponentColor === "red" ? "bg-red-500" : options?.opponentColor === "yellow" ? "bg-yellow-400" : opponentColorClass;
  const boardClass = options?.boardColor ?? "bg-gradient-to-b from-blue-600 to-blue-800 border border-blue-400/30";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Connect Four</h1>
        <p className="text-slate-400">
          {isVsAI ? "Playing against AI" : "Multiplayer — real opponent"}
        </p>
      </div>

      {!isVsAI && isHost && !opponentJoined && (
        <div className="mb-6 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mb-2">
            <Users className="w-4 h-4" />
            Waiting for opponent to join...
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Share this game ID with your friend. They register/login, then paste it
            under &quot;Join a Friend&apos;s Game&quot; on the dashboard.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2 bg-zinc-900 rounded-lg text-xs text-zinc-300 font-mono truncate border border-white/10">
              {gameId}
            </code>
            <Button
              onClick={handleCopyGameId}
              className="bg-indigo-600 hover:bg-indigo-500 px-3"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p className="text-slate-400 text-sm">Moves</p>
            <p className="text-2xl font-bold text-white">{moveCount}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Status</p>
            <p className="text-xl font-bold text-blue-400">
              {gameStatus === "finished"
                ? "Game Over"
                : !opponentJoined
                  ? "Waiting"
                  : isMyTurn
                    ? "Your Turn"
                    : "Opponent's Turn"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Your Color</p>
            <div className="flex justify-center">
              <div className={`w-6 h-6 rounded-full shadow-lg ${myColorClass}`} />
            </div>
          </div>
        </div>

        {!isVsAI && opponentJoined && (
          <div className="flex justify-center gap-6 text-xs text-slate-400 pt-2 border-t border-slate-700">
            <span className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${myColorClass}`} />
              You (Player {myPlayerNumber})
            </span>
            <span className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${opponentColorClass}`} />
              Opponent
            </span>
          </div>
        )}

        {winner && (
          <div className="text-center pt-4 border-t border-slate-700">
            <p className="text-2xl font-bold text-green-400">{winner}</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <Connect4Board
          board={board}
          onColumnClick={handleColumnClick}
          disabled={!canPlay}
          isAIThinking={isVsAI && isAIThinking}
          playerPieceClass={playerPieceClass}
          opponentPieceClass={opponentPieceClass}
          boardClass={boardClass}
          opponentLabel={isVsAI ? "AI" : "Opponent"}
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        {gameStatus === "finished" ? (
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
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
          Leave
        </Button>
      </div>
    </div>
  );
}
