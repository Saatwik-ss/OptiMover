/**
 * Game History Page
 * Shows past games and statistics
 */

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { 
  Trophy, 
  Gamepad2, 
  TrendingUp, 
  XCircle, 
  Minus, 
  History as HistoryIcon,
  Calendar,
  User as UserIcon,
  Bot
} from "lucide-react";

interface GameRecord {
  id: string;
  gameType: string;
  status: string;
  result?: string;
  createdAt: string;
  opponent: string;
}

export default function GameHistory() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production: fetch from API
    // For now: mock data
    const mockGames: GameRecord[] = [
      {
        id: "1",
        gameType: "connect-four",
        status: "finished",
        result: "player1_wins",
        createdAt: new Date().toISOString(),
        opponent: "AI",
      },
      {
        id: "2",
        gameType: "connect-four",
        status: "finished",
        result: "ai_wins",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        opponent: "AI",
      },
      {
        id: "3",
        gameType: "connect-four",
        status: "finished",
        result: "draw",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        opponent: "AI",
      },
    ];

    setGames(mockGames);
    setLoading(false);
  }, [user]);

  // Upgraded to return full badge styling
  const getResultBadge = (result?: string) => {
    if (!result) return { 
      style: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", 
      text: "In Progress",
      icon: HistoryIcon 
    };
    if (result === "player1_wins") return { 
      style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", 
      text: "Victory",
      icon: Trophy 
    };
    if (result === "ai_wins") return { 
      style: "bg-rose-500/10 text-rose-400 border-rose-500/20", 
      text: "Defeat",
      icon: XCircle 
    };
    return { 
      style: "bg-amber-500/10 text-amber-400 border-amber-500/20", 
      text: "Draw",
      icon: Minus 
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-chessboard min-h-screen text-zinc-100 p-6 md:p-12 font-sans">        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">Retrieving Records...</p>
      </div>
    );
  }

  const wins = games.filter((g) => g.result === "player1_wins").length;
  const losses = games.filter((g) => g.result === "ai_wins").length;
  const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Match History</h1>
          </div>
          <p className="text-zinc-500 text-sm ml-13">Analyze your past performance and neural network interactions.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Gamepad2} label="Total Matches" value={games.length.toString()} />
          <StatCard icon={Trophy} label="Victories" value={wins.toString()} valueColor="text-emerald-400" />
          <StatCard icon={XCircle} label="Defeats" value={losses.toString()} valueColor="text-rose-400" />
          <StatCard icon={TrendingUp} label="Win Ratio" value={`${winRate}%`} valueColor="text-indigo-400" />
        </div>

        {/* Games Table */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4 px-1">Recent Sessions</h3>
          
          {games.length > 0 ? (
            <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-white/5">
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Module</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Opponent</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Outcome</th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {games.map((game) => {
                      const badge = getResultBadge(game.result);
                      const BadgeIcon = badge.icon;
                      
                      return (
                        <tr key={game.id} className="hover:bg-white/[0.02] transition-colors group">
                          
                          {/* Game Type */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors">
                                <Gamepad2 className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                              </div>
                              <span className="text-sm font-medium text-zinc-200 capitalize tracking-tight">
                                {game.gameType.replace("-", " ")}
                              </span>
                            </div>
                          </td>
                          
                          {/* Opponent */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              {game.opponent === "AI" ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                              {game.opponent}
                            </div>
                          </td>
                          
                          {/* Result Badge */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badge.style}`}>
                              <BadgeIcon className="w-3 h-3" />
                              {badge.text}
                            </span>
                          </td>
                          
                          {/* Date */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                              <Calendar className="w-4 h-4 text-zinc-600" />
                              {formatDate(game.createdAt)}
                            </div>
                          </td>
                          
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950/20 border border-white/5 border-dashed rounded-3xl py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-900/50 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                <HistoryIcon className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-zinc-300 font-medium mb-1">No Records Found</h3>
              <p className="text-zinc-600 text-sm max-w-sm">Initiate a match module on the dashboard to begin recording your performance analytics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ icon: Icon, label, value, valueColor = "text-zinc-100" }: { icon: any, label: string, value: string, valueColor?: string }) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:bg-zinc-900/60 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
        <Icon className="w-5 h-5 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}