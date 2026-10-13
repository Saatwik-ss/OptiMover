/**
 * Chess Game Page
 * Complete Chess experience with 3D board, move history, turn indicators, and real-time AI & multiplayer integration.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Copy, Check, Users, Flag, Handshake } from "lucide-react";
import { Chess } from "chess.js";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/authContext";
import ChessBoard3D, { BoardTheme } from "../components/chess/ChessBoard3D";
import PawnPromotionModal from "../components/chess/PawnPromotionModal";
import Button from "../components/Button";
import GameClock from "../components/GameClock";

interface GameLocationState {
  initialState?: {
    fen: string;
    currentPlayer?: number;
    history?: string[];
  };
  isVsAI?: boolean;
  isHost?: boolean;
  options?: any;
  yourColor?: "white" | "black";
  player1Username?: string;
}

const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function ChessGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    makeChessMove,
    resignChess,
    offerChessDraw,
    respondChessDraw,
    getChessGame,
    onChessMoveMade,
    onChessGameEnded,
    onChessDrawOffered,
    onChessDrawDeclined,
    onChessPlayerJoined,
    onChessAIError,
    onChessTimeSync,
    onChessTimeOut,
  } = useSocket();
  const { user } = useAuth();

  const gameStateLocation = (location.state as GameLocationState | null) ?? {};
  const isVsAI = gameStateLocation.isVsAI ?? true;
  const isHost = gameStateLocation.isHost ?? true;
  const options = gameStateLocation.options ?? {};

  // Host gets chosen color; Guest gets opposite color in multiplayer
  const hostColor: "white" | "black" = options?.playerColor === "black" ? "black" : "white";
  const initialUserColor: "white" | "black" =
    gameStateLocation.yourColor ||
    (isVsAI ? hostColor : (isHost ? hostColor : (hostColor === "white" ? "black" : "white")));

  const initialTimeControl: number =
    options?.timeControl ||
    gameStateLocation.options?.timeControl ||
    300;

  const [timeControl, setTimeControl] = useState<number>(initialTimeControl);
  const [whiteTime, setWhiteTime] = useState<number>(initialTimeControl);
  const [blackTime, setBlackTime] = useState<number>(initialTimeControl);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(isVsAI || !isHost);

  const [userColor, setUserColor] = useState<"white" | "black">(initialUserColor);
  const [opponentUsername, setOpponentUsername] = useState<string>(
    isVsAI
      ? "OptiMover Engine"
      : gameStateLocation.player1Username || "Opponent"
  );
  const boardTheme: BoardTheme = options?.boardTheme || "indigo";

  const [fen, setFen] = useState<string>(
    gameStateLocation.initialState?.fen || DEFAULT_FEN
  );
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(
    (gameStateLocation.initialState?.currentPlayer === 2 ? 2 : 1)
  );
  const [history, setHistory] = useState<string[]>(
    gameStateLocation.initialState?.history || []
  );
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const [opponentJoined, setOpponentJoined] = useState(isVsAI || !isHost);
  const [gameStatus, setGameStatus] = useState<"ongoing" | "finished">("ongoing");
  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Draw offer state
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(false);
  const [drawNotice, setDrawNotice] = useState<string | null>(null);
  const [isOfferingDraw, setIsOfferingDraw] = useState(false);

  // Promotion pending state
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // White is 1, Black is 2
  const turnColor = currentPlayer === 1 ? "white" : "black";
  const isMyTurn = turnColor === userColor;
  const canPlay = gameStatus === "ongoing" && opponentJoined && isMyTurn && !isAIThinking;

  // Local 1-second countdown ticker for smooth clock display
  useEffect(() => {
    if (gameStatus !== "ongoing" || !opponentJoined || !isTimerRunning) return;

    const timer = setInterval(() => {
      if (currentPlayer === 1) {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, opponentJoined, isTimerRunning, currentPlayer]);

  useEffect(() => {
    if (!gameId || !user) return;

    if (!isVsAI) {
      getChessGame(gameId, user.id)
        .then((res: any) => {
          if (res?.success) {
            if (res.yourColor) {
              setUserColor(res.yourColor);
            }
            if (res.opponentJoined) {
              setOpponentJoined(true);
            }
            if (res.opponentUsername) {
              setOpponentUsername(res.opponentUsername);
            }
            if (typeof res.whiteTime === "number") {
              setWhiteTime(res.whiteTime);
            }
            if (typeof res.blackTime === "number") {
              setBlackTime(res.blackTime);
            }
            if (res.timeControl) {
              setTimeControl(res.timeControl);
            }
            if (res.isTimerActive) {
              setIsTimerRunning(true);
            }
            if (res.gameState) {
              setFen(res.gameState.fen);
              setCurrentPlayer(res.gameState.currentPlayer === 2 ? 2 : 1);
              if (res.gameState.history) {
                setHistory(res.gameState.history);
              }
            }
          }
        })
        .catch((err) => {
          console.error("[Chess] Failed to fetch game state:", err);
        });
    }

    const unsubMove = onChessMoveMade((event: any) => {
      if (event.gameId !== gameId) return;

      if (event.gameState) {
        setFen(event.gameState.fen);
        setCurrentPlayer(event.gameState.currentPlayer === 2 ? 2 : 1);
        if (event.gameState.history) {
          setHistory(event.gameState.history);
        }
      }

      if (event.move) {
        setLastMove({ from: event.move.from, to: event.move.to });
      }

      if (typeof event.whiteTime === "number") {
        setWhiteTime(event.whiteTime);
      }
      if (typeof event.blackTime === "number") {
        setBlackTime(event.blackTime);
      }
      setIsTimerRunning(true);
      setIsAIThinking(false);

      if (event.status?.status === "finished") {
        setGameStatus("finished");
        setIsTimerRunning(false);
        if (event.status.result === "player1_wins") {
          setWinnerMessage(userColor === "white" ? "Checkmate — You Win!" : "Checkmate — White Wins!");
        } else if (event.status.result === "player2_wins") {
          setWinnerMessage(userColor === "black" ? "Checkmate — You Win!" : "Checkmate — Black Wins!");
        } else if (event.status.result === "ai_wins") {
          setWinnerMessage("Checkmate — AI Wins!");
        } else if (event.status.result === "draw") {
          setWinnerMessage("Stalemate / Draw!");
        }
      }
    });

    const unsubEnded = onChessGameEnded((event: any) => {
      if (event.gameId !== gameId) return;
      setGameStatus("finished");
      setIsTimerRunning(false);

      if (event.timedOutPlayerId) {
        setWinnerMessage(
          event.timedOutPlayerId === user.id
            ? "Time Out — You ran out of time."
            : "Time Out — Opponent ran out of time! You Win!"
        );
      } else if (event.result === "draw") {
        setWinnerMessage("Game Drawn!");
      } else if (event.resignedBy) {
        setWinnerMessage(
          event.resignedBy === user.id
            ? "You resigned the match."
            : "Opponent resigned — You Win!"
        );
      } else {
        setWinnerMessage(
          event.winner === user.id
            ? "Victory!"
            : event.winner === "AI"
              ? "AI Victory!"
              : "Defeat!"
        );
      }
    });

    const unsubDrawOffered = onChessDrawOffered((event: any) => {
      if (event.gameId === gameId && event.offeredBy !== user.id) {
        setIncomingDrawOffer(true);
      }
    });

    const unsubDrawDeclined = onChessDrawDeclined((event: any) => {
      if (event.gameId === gameId) {
        setDrawNotice(event.message || "Draw offer declined.");
        setTimeout(() => setDrawNotice(null), 4000);
      }
    });

    const unsubJoined = onChessPlayerJoined((event: any) => {
      if (event.gameId === gameId) {
        setOpponentJoined(true);
        setIsTimerRunning(true);
        if (typeof event.whiteTime === "number") {
          setWhiteTime(event.whiteTime);
        }
        if (typeof event.blackTime === "number") {
          setBlackTime(event.blackTime);
        }
        if (event.timeControl) {
          setTimeControl(event.timeControl);
        }
        if (event.player2Username && event.player2Id !== user.id) {
          setOpponentUsername(event.player2Username);
        } else if (event.player1Username && event.player2Id === user.id) {
          setOpponentUsername(event.player1Username);
        }
      }
    });

    const unsubTimeSync = onChessTimeSync((event: any) => {
      if (event.gameId === gameId) {
        if (typeof event.whiteTime === "number") {
          setWhiteTime(event.whiteTime);
        }
        if (typeof event.blackTime === "number") {
          setBlackTime(event.blackTime);
        }
        setIsTimerRunning(true);
      }
    });

    const unsubTimeOut = onChessTimeOut((event: any) => {
      if (event.gameId === gameId) {
        setGameStatus("finished");
        setIsTimerRunning(false);
        setWinnerMessage(
          event.timedOutPlayerId === user.id
            ? "Time Out — You ran out of time."
            : "Time Out — Opponent ran out of time! You Win!"
        );
      }
    });

    const unsubAIError = onChessAIError((event: any) => {
      if (event.gameId === gameId) {
        setError(event.error);
        setIsAIThinking(false);
      }
    });

    return () => {
      unsubMove();
      unsubEnded();
      unsubDrawOffered();
      unsubDrawDeclined();
      unsubJoined();
      unsubTimeSync();
      unsubTimeOut();
      unsubAIError();
    };
  }, [gameId, user, userColor]);

  const handleMove = async (from: string, to: string, promotion?: string) => {
    if (!gameId || !user || !canPlay) return;

    // Use chess.js to accurately detect if this specific move is a pawn promotion
    const currentChess = new Chess(fen);
    const legalMoves = currentChess.moves({ verbose: true });
    const isPromoMove = legalMoves.some(
      (m) => m.from === from && m.to === to && m.promotion
    );

    if (isPromoMove && !promotion) {
      setPendingPromotion({ from, to });
      return;
    }

    try {
      setError(null);
      if (isVsAI) {
        setIsAIThinking(true);
      }
      await makeChessMove(gameId, user.id, { from, to, promotion });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make move");
      setIsAIThinking(false);
    }
  };

  const handlePromotionSelect = async (piece: "q" | "r" | "b" | "n") => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);
    await handleMove(from, to, piece);
  };

  const handleOfferDraw = async () => {
    if (!gameId || !user || gameStatus === "finished" || isOfferingDraw) return;
    try {
      setIsOfferingDraw(true);
      setDrawNotice("Offering draw...");
      const res = (await offerChessDraw(gameId, user.id)) as any;
      if (res?.accepted) {
        setDrawNotice("Draw agreed!");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to offer draw");
    } finally {
      setIsOfferingDraw(false);
    }
  };

  const handleRespondDraw = async (accept: boolean) => {
    if (!gameId || !user) return;
    try {
      setIncomingDrawOffer(false);
      await respondChessDraw(gameId, user.id, accept);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to respond to draw offer");
    }
  };

  const handleResign = async () => {
    if (!gameId || !user) return;
    try {
      await resignChess(gameId, user.id);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resign");
    }
  };

  const handleCopyGameId = async () => {
    if (!gameId) return;
    await navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Title */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Chess
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          {isVsAI
            ? `Playing vs AI (Difficulty Level ${options?.difficulty || 3}) • ${Math.round(timeControl / 60)} min`
            : `Multiplayer Match • ${Math.round(timeControl / 60)} min`}
        </p>
      </div>

      {/* Multiplayer Join Card */}
      {!isVsAI && isHost && !opponentJoined && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl mx-auto">
          <div className="flex items-center gap-2 text-zinc-300 text-sm font-semibold mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            Waiting for Opponent
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Share this Game ID with an opponent to start the match:
          </p>
          <div className="flex gap-2">
            <code className="flex-1 px-3 py-2 bg-zinc-950 rounded-xl text-xs text-zinc-300 font-mono truncate border border-zinc-800">
              {gameId}
            </code>
            <Button onClick={handleCopyGameId} className="bg-blue-600 hover:bg-blue-500 px-4">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Draw Notice Banner */}
      {drawNotice && (
        <div className="mb-5 max-w-md mx-auto p-3 bg-zinc-900 border border-blue-500/30 rounded-xl text-center text-xs font-semibold text-blue-300 animate-fade-in shadow-md">
          {drawNotice}
        </div>
      )}

      {/* Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Board Column */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between px-4 mb-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${userColor === "white" ? "bg-zinc-800 border border-zinc-600" : "bg-white border border-slate-300"}`} />
              <span className="font-semibold text-sm text-zinc-200">{opponentUsername}</span>
            </div>
            <div className="flex items-center gap-3">
              {isAIThinking && (
                <span className="text-blue-400 font-medium animate-pulse flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Calculating best move...
                </span>
              )}
              <GameClock
                timeInSeconds={userColor === "white" ? blackTime : whiteTime}
                isActive={gameStatus === "ongoing" && opponentJoined && (userColor === "white" ? currentPlayer === 2 : currentPlayer === 1)}
              />
            </div>
          </div>

          <ChessBoard3D
            fen={fen}
            onMove={handleMove}
            disabled={!canPlay}
            isAIThinking={isAIThinking}
            orientation={userColor}
            theme={boardTheme}
            lastMove={lastMove}
          />

          <div className="w-full flex items-center justify-between px-4 mt-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${userColor === "white" ? "bg-white border border-slate-300" : "bg-zinc-800 border border-zinc-600"}`} />
              <span className="font-semibold text-sm text-zinc-200">{user?.username} (You)</span>
              <span className="font-medium text-zinc-500 text-xs ml-1">
                ({userColor})
              </span>
            </div>
            <GameClock
              timeInSeconds={userColor === "white" ? whiteTime : blackTime}
              isActive={gameStatus === "ongoing" && opponentJoined && (userColor === "white" ? currentPlayer === 1 : currentPlayer === 2)}
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/20 rounded-xl text-rose-300 text-xs text-center w-full max-w-lg">
              {error}
            </div>
          )}
        </div>

        {/* Sidebar Info & Move History */}
        <div className="lg:col-span-4 space-y-4">
          {/* Status Box */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider">Status</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                gameStatus === "finished"
                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/60"
                  : isMyTurn
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/40"
                    : "bg-zinc-800 text-zinc-400"
              }`}>
                {gameStatus === "finished" ? "Match Concluded" : isMyTurn ? "Your Turn" : "Opponent's Turn"}
              </span>
            </div>

            {winnerMessage ? (
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                <p className="text-base font-bold text-emerald-400">{winnerMessage}</p>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Current Turn</span>
                <span className="font-semibold capitalize text-zinc-200">
                  {turnColor} to move
                </span>
              </div>
            )}
          </div>

          {/* Move Log History */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Move History
            </h3>
            <div className="max-h-56 overflow-y-auto space-y-1 font-mono text-xs pr-1">
              {history.length === 0 ? (
                <p className="text-zinc-500 italic">No moves recorded yet</p>
              ) : (
                Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                  <div key={i} className="flex justify-between py-1 px-2 rounded hover:bg-zinc-800/50 text-zinc-300">
                    <span className="text-zinc-500">{i + 1}.</span>
                    <span className="font-semibold">{history[i * 2]}</span>
                    <span className="text-zinc-400">{history[i * 2 + 1] || ""}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5">
            {gameStatus === "finished" ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold shadow-lg"
              >
                Return to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleOfferDraw}
                  disabled={isAIThinking || isOfferingDraw}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl py-2.5 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-zinc-700/60"
                >
                  <Handshake className="w-3.5 h-3.5 text-blue-400" />
                  Draw
                </Button>
                <Button
                  onClick={handleResign}
                  disabled={isAIThinking}
                  className="flex-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl py-2.5 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Resign
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl py-2.5 font-medium text-xs transition-colors"
                >
                  Leave
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Incoming Draw Offer Modal */}
      {incomingDrawOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75" />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold text-white mb-1.5">Draw Offered</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Opponent has offered a draw. Do you want to accept?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => handleRespondDraw(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleRespondDraw(true)}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                Accept Draw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pawn Promotion Modal */}
      <PawnPromotionModal
        open={pendingPromotion !== null}
        color={userColor === "white" ? "w" : "b"}
        onSelect={handlePromotionSelect}
        onCancel={() => setPendingPromotion(null)}
      />
    </div>
  );
}
