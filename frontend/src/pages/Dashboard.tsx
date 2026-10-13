/**
 * Dashboard Page
 * Main landing page with Connect Four and Chess game modules and per-game ELO statistics.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/authContext";
import { useSocket } from "../hooks/useSocket";
import { fetchUserStats } from "../lib/api";
import Button from "../components/Button";
import GameOptionsModal, { GameOptions } from "../components/GameOptionsModal";
import ChessOptionsModal, { ChessOptions } from "../components/chess/ChessOptionsModal";
import { 
  Gamepad2, 
  Activity, 
  Target, 
  Trophy, 
  TrendingUp, 
  Medal, 
  User, 
  Lock,
  Play,
  Info,
  Mail,
  Users,
  Link2,
  Crown
} from "lucide-react";

export type ActiveGameType = "connect-four" | "chess";

export default function Dashboard() {
  const { isAuthenticated, user, login, register } = useAuth();
  const { createGame, joinGame, createChessGame, joinChessGame } = useSocket();
  const navigate = useNavigate();

  // Selected game for dashboard performance metrics
  const [selectedGameType, setSelectedGameType] = useState<ActiveGameType>("chess");

  // Auth form mode
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Login state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Connect Four creation state
  const [isCreatingC4, setIsCreatingC4] = useState(false);
  const [isHostingC4, setIsHostingC4] = useState(false);
  const [c4OptionsOpen, setC4OptionsOpen] = useState(false);
  const [c4OptionsForAI, setC4OptionsForAI] = useState<boolean>(true);
  const [joinC4GameId, setJoinC4GameId] = useState("");
  const [isJoiningC4, setIsJoiningC4] = useState(false);
  const [joinC4Error, setJoinC4Error] = useState("");

  // Chess creation state
  const [isCreatingChess, setIsCreatingChess] = useState(false);
  const [isHostingChess, setIsHostingChess] = useState(false);
  const [chessOptionsOpen, setChessOptionsOpen] = useState(false);
  const [chessOptionsForAI, setChessOptionsForAI] = useState<boolean>(true);
  const [joinChessId, setJoinChessId] = useState("");
  const [isJoiningChess, setIsJoiningChess] = useState(false);
  const [joinChessError, setJoinChessError] = useState("");

  // Per-game stats cache
  const [c4Stats, setC4Stats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    eloRating: 1200,
  });
  const [chessStats, setChessStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    eloRating: 1200,
  });

  useEffect(() => {
    if (!user) return;

    fetchUserStats(user.id, "connect-four")
      .then(setC4Stats)
      .catch(() => {});

    fetchUserStats(user.id, "chess")
      .then(setChessStats)
      .catch(() => {});
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoginError("");
      setIsLoggingIn(true);
      await login(username, password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoginError("");
      setIsLoggingIn(true);
      await register(username, email, password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Connect Four Handlers
  const handleStartC4WithOptions = async (opts: GameOptions) => {
    setC4OptionsOpen(false);
    if (!user) return;

    try {
      setIsCreatingC4(true);
      if (!c4OptionsForAI) setIsHostingC4(true);

      const response = (await createGame(user.id, c4OptionsForAI, opts)) as {
        gameId: string;
        initialState: { board: number[][] };
      };

      navigate(`/game/${response.gameId}`, {
        state: {
          initialState: response.initialState,
          isVsAI: c4OptionsForAI,
          isHost: true,
          options: opts,
        },
      });
    } catch (error) {
      console.error("Failed to create connect four game:", error);
    } finally {
      setIsCreatingC4(false);
      setIsHostingC4(false);
    }
  };

  const handleJoinC4Multiplayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinC4GameId.trim()) return;

    try {
      setJoinC4Error("");
      setIsJoiningC4(true);
      const gameId = joinC4GameId.trim();
      const response = (await joinGame(gameId, user.id)) as {
        gameId: string;
        initialState: { board: number[][] };
        options?: any;
      };

      navigate(`/game/${response.gameId}`, {
        state: {
          initialState: response.initialState,
          isVsAI: false,
          isHost: false,
          options: response.options || null,
        },
      });
    } catch (error) {
      setJoinC4Error(error instanceof Error ? error.message : "Failed to join game");
    } finally {
      setIsJoiningC4(false);
    }
  };

  // Chess Handlers
  const handleStartChessWithOptions = async (opts: ChessOptions) => {
    setChessOptionsOpen(false);
    if (!user) return;

    try {
      setIsCreatingChess(true);
      if (!chessOptionsForAI) setIsHostingChess(true);

      const response = (await createChessGame(user.id, chessOptionsForAI, opts, user.username)) as {
        gameId: string;
        initialState: { fen: string };
        options?: any;
        yourColor?: "white" | "black";
      };

      navigate(`/game/chess/${response.gameId}`, {
        state: {
          initialState: response.initialState,
          isVsAI: chessOptionsForAI,
          isHost: true,
          options: response.options || opts,
          yourColor: response.yourColor || (opts.playerColor === "black" ? "black" : "white"),
        },
      });
    } catch (error) {
      console.error("Failed to create chess game:", error);
    } finally {
      setIsCreatingChess(false);
      setIsHostingChess(false);
    }
  };

  const handleJoinChessMultiplayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinChessId.trim()) return;

    try {
      setJoinChessError("");
      setIsJoiningChess(true);
      const gameId = joinChessId.trim();
      const response = (await joinChessGame(gameId, user.id, user.username)) as {
        gameId: string;
        initialState: { fen: string };
        options?: any;
        yourColor?: "white" | "black";
      };

      navigate(`/game/chess/${response.gameId}`, {
        state: {
          initialState: response.initialState,
          isVsAI: false,
          isHost: false,
          options: response.options || null,
          yourColor: response.yourColor,
          player1Username: (response as any).player1Username,
        },
      });
    } catch (error) {
      setJoinChessError(error instanceof Error ? error.message : "Failed to join chess game");
    } finally {
      setIsJoiningChess(false);
    }
  };

  // Not logged in - show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 font-sans flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Platform Sign In</h1>
            <p className="text-zinc-400 text-xs">Enter your credentials to continue</p>
          </div>

          {/* Login Form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-lg">
            <div className="flex gap-2 mb-6 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setLoginError(""); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  authMode === "login"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("register"); setLoginError(""); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  authMode === "register"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              {authMode === "register" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center gap-2 text-red-300 text-xs">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>{loginError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors mt-2"
              >
                {isLoggingIn
                  ? authMode === "login"
                    ? "Signing in..."
                    : "Registering..."
                  : authMode === "login"
                    ? "Sign In"
                    : "Create Account"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-5 pt-4 border-t border-zinc-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-400">
                <p className="font-semibold text-zinc-300 mb-0.5">Demo Access</p>
                <p>Username: <span className="text-zinc-200 font-mono bg-zinc-800 px-1 py-0.5 rounded">player1</span> • Password: <span className="text-zinc-200 font-mono bg-zinc-800 px-1 py-0.5 rounded">demo</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active stats depending on chosen game
  const currentStats = selectedGameType === "chess" ? chessStats : c4Stats;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Welcome back, <span className="text-blue-400">{user?.username}</span>
          </h1>
          <p className="text-zinc-400 text-sm">Choose a game module to begin or view your ratings.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Games Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Chess Module Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Chess</h2>
                  <p className="text-xs text-zinc-400">Tactical 3D board game</p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Play standard chess with 3D White and Black pieces, customizable boards, and AI difficulty levels from 600 to 2000+ ELO.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setChessOptionsForAI(true);
                    setChessOptionsOpen(true);
                  }}
                  disabled={isCreatingChess || isHostingChess}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isCreatingChess ? "Loading..." : "Play Chess vs AI"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChessOptionsForAI(false);
                    setChessOptionsOpen(true);
                  }}
                  disabled={isHostingChess || isCreatingChess}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Users className="w-4 h-4" />
                  {isHostingChess ? "Creating..." : "Host Multiplayer"}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-zinc-800">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5" />
                  Join a Friend&apos;s Chess Match
                </p>
                <form onSubmit={handleJoinChessMultiplayer} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={joinChessId}
                    onChange={(e) => setJoinChessId(e.target.value)}
                    placeholder="Enter Chess Game ID"
                    className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isJoiningChess || !joinChessId.trim()}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isJoiningChess ? "Joining..." : "Join Match"}
                  </button>
                </form>
                {joinChessError && (
                  <p className="mt-2 text-xs text-red-400">{joinChessError}</p>
                )}
              </div>
            </div>

            {/* 2. Connect Four Module Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 transition-colors hover:border-zinc-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Connect Four</h2>
                  <p className="text-xs text-zinc-400">Classic 4-in-a-row strategy</p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Connect 4 pieces vertically, horizontally, or diagonally. Choose first turn, piece colors, and play vs AI or friends.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setC4OptionsForAI(true);
                    setC4OptionsOpen(true);
                  }}
                  disabled={isCreatingC4 || isHostingC4}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isCreatingC4 ? "Loading..." : "Play vs AI"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setC4OptionsForAI(false);
                    setC4OptionsOpen(true);
                  }}
                  disabled={isHostingC4 || isCreatingC4}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Users className="w-4 h-4" />
                  {isHostingC4 ? "Creating..." : "Host Multiplayer"}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-zinc-800">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5" />
                  Join a Friend&apos;s Connect Four Game
                </p>
                <form onSubmit={handleJoinC4Multiplayer} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={joinC4GameId}
                    onChange={(e) => setJoinC4GameId(e.target.value)}
                    placeholder="Enter Connect Four Game ID"
                    className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isJoiningC4 || !joinC4GameId.trim()}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isJoiningC4 ? "Joining..." : "Join Game"}
                  </button>
                </form>
                {joinC4Error && (
                  <p className="mt-2 text-xs text-red-400">{joinC4Error}</p>
                )}
              </div>
            </div>

          </div>

          {/* Stats & ELO Sidebar (1 col) */}
          <div className="lg:col-span-1 space-y-5">
            <div className="px-1">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Rating & Performance
              </h3>
            </div>

            {/* Game Selector Tabs for Stats */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedGameType("chess")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  selectedGameType === "chess"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                Chess
              </button>
              <button
                type="button"
                onClick={() => setSelectedGameType("connect-four")}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  selectedGameType === "connect-four"
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Connect Four
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3.5">
              <StatCard
                icon={Activity}
                label={`${selectedGameType === "chess" ? "Chess" : "C4"} Rating`}
                value={Math.round(currentStats.eloRating).toString()}
                valueColor="text-blue-400"
              />
              <StatCard
                icon={Trophy}
                label="Matches Played"
                value={currentStats.gamesPlayed.toString()}
              />
              <StatCard
                icon={Medal}
                label="Victories"
                value={currentStats.gamesWon.toString()}
                valueColor="text-emerald-400"
              />
              <StatCard
                icon={TrendingUp}
                label="Win Ratio"
                value={`${Math.round(currentStats.winRate)}%`}
                valueColor="text-blue-400"
              />
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400">
              <p>Ratings and match histories are recorded separately for each game.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Modals rendered at root level */}
      <ChessOptionsModal
        open={chessOptionsOpen}
        vsAI={chessOptionsForAI}
        onClose={() => setChessOptionsOpen(false)}
        onConfirm={handleStartChessWithOptions}
      />

      <GameOptionsModal
        open={c4OptionsOpen}
        vsAI={c4OptionsForAI}
        onClose={() => setC4OptionsOpen(false)}
        onConfirm={handleStartC4WithOptions}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueColor = "text-zinc-100",
}: {
  icon: any;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3.5">
      <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs text-zinc-400 font-medium mb-0.5">{label}</p>
        <p className={`text-lg font-bold tracking-tight ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}