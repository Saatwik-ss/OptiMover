/**
 * Dashboard Page
 * Main landing page with game options and login
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import Button from "../components/Button";
import { 
  Gamepad2, 
  Cpu, 
  Activity, 
  History, 
  Target, 
  Trophy, 
  TrendingUp, 
  Medal, 
  User, 
  Lock,
  Play,
  Info
} from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated, user, login } = useAuth();
  const { createGame } = useSocket();
  const navigate = useNavigate();

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Game creation state
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoginError("");
      setIsLoggingIn(true);
      await login(username, password);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

const handlePlayVsAI = async () => {
    if (!user) return;

    try {
      setIsCreatingGame(true);
      const response = await createGame(user.id, true);
      
      navigate(`/game/${response}`); 
    
    } catch (error) {
      console.error("Failed to create game: Sorry", error);
    } finally {
      setIsCreatingGame(false);
    }
  };
  // Not logged in - show login form
  if (!isAuthenticated) {
    return (
      <div className="bg-chessboard min-h-screen text-zinc-100 p-6 md:p-12 font-sans">        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl">
              <Gamepad2 className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 mb-2">Platform Access</h1>
            <p className="text-zinc-500 text-sm">Sign in to your neural network dashboard</p>
          </div>

          {/* Login Form */}
          <div className="bg-zinc-950/50 backdrop-blur-xl rounded-2xl border border-white/5 p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>{loginError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 font-medium shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] transition-all mt-2"
              >
                {isLoggingIn ? "Authenticating..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-white/5 flex items-start gap-3">
              <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-500">
                <p className="font-medium text-zinc-400 mb-1">Demo Access</p>
                <p>User: <span className="text-zinc-300 font-mono bg-white/5 px-1.5 py-0.5 rounded">player1</span> • Pass: <span className="text-zinc-300 font-mono bg-white/5 px-1.5 py-0.5 rounded">demo</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - show game options
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
              Welcome back, <span className="text-indigo-400">{user?.username}</span>
            </h1>
            <p className="text-zinc-500 text-sm">Select a module to initiate a new session.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900/50 border border-white/5 px-4 py-2 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Game Area (Takes up 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Connect Four Card */}
            <div className="group relative overflow-hidden bg-zinc-950/50 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all duration-500 p-1">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative bg-zinc-900/40 rounded-[22px] p-8 h-full border border-white/5">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-indigo-400" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                    <Activity className="w-3 h-3" /> Ready
                  </span>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-2">Connect Four</h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-md">
                  Deploy strategy and tactical vertical placement. Challenge the neural network in a classic game of pattern recognition.
                </p>

                {/* Features Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 text-xs border border-white/5">
                    <Cpu className="w-3.5 h-3.5 text-zinc-400" /> AI Opponent
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 text-xs border border-white/5">
                    <Gamepad2 className="w-3.5 h-3.5 text-zinc-400" /> Real-time
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 text-xs border border-white/5">
                    <History className="w-3.5 h-3.5 text-zinc-400" /> Analytics Logged
                  </span>
                </div>

                <Button
                  onClick={handlePlayVsAI}
                  disabled={isCreatingGame}
                  className="w-full sm:w-auto flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl px-6 py-2.5 font-medium transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isCreatingGame ? "Initializing..." : "Commence Match"}
                </Button>
              </div>
            </div>

            {/* Coming Soon Card */}
            <div className="relative overflow-hidden bg-zinc-950/20 rounded-3xl border border-white/5 p-8 border-dashed flex flex-col items-center justify-center text-center py-12">
              <Gamepad2 className="w-8 h-8 text-zinc-700 mb-4" />
              <h3 className="text-zinc-500 font-medium mb-1">More Modules Pending</h3>
              <p className="text-zinc-600 text-sm">Chess, Checkers, and Go algorithms are currently in training.</p>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider px-2">Performance Metrics</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <StatCard icon={Trophy} label="Matches Played" value="12" />
              <StatCard icon={Medal} label="Victories" value="8" valueColor="text-emerald-400" />
              <StatCard icon={TrendingUp} label="Win Ratio" value="66.6%" valueColor="text-indigo-400" />
              <StatCard icon={Activity} label="ELO Rating" value="1450" valueColor="text-amber-400" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, valueColor = "text-zinc-100" }: { icon: any, label: string, value: string, valueColor?: string }) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:bg-zinc-900/60 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium mb-1">{label}</p>
        <p className={`text-xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}