/**
 * Game History Page
 * Shows past games and statistics from the API
 */

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchGameHistory, type ApiGame } from "../lib/api";
import {
  Trophy,
  Gamepad2,
  TrendingUp,
  XCircle,
  Minus,
  History as HistoryIcon,
  Calendar,
  User as UserIcon,
  Bot,
} from "lucide-react";

function getOutcomeForUser(
  game: ApiGame,
  userId: string
): "win" | "loss" | "draw" | "unknown" {
  if (!game.result) return "unknown";
  if (game.result === "draw") return "draw";
  if (game.result === "player1_wins") {
    return game.player1Id === userId ? "win" : "loss";
  }
  if (game.result === "player2_wins") {
    return game.player2Id === userId ? "win" : "loss";
  }
  if (game.result === "ai_wins") return "loss";
  return "unknown";
}

export default function GameHistory() {
  const { user } = useAuth();
  const [games, setGames] = useState<ApiGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGameHistory(user!.id);
        if (!cancelled) {
          setGames(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load history");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const getResultBadge = (game: ApiGame) => {
    const outcome = user ? getOutcomeForUser(game, user.id) : "unknown";

    if (outcome === "win") {
      return {
        style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        text: "Victory",
        icon: Trophy,
      };
    }
    if (outcome === "loss") {
      return {
        style: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        text: "Defeat",
        icon: XCircle,
      };
    }
    if (outcome === "draw") {
      return {
        style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        text: "Draw",
        icon: Minus,
      };
    }
    return {
      style: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      text: "In Progress",
      icon: HistoryIcon,
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
      <div className="bg-chessboard min-h-screen text-zinc-100 p-6 md:p-12 font-sans flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase">
          Retrieving Records...
        </p>
      </div>
    );
  }

  const wins = user
    ? games.filter((g) => getOutcomeForUser(g, user.id) === "win").length
    : 0;
  const losses = user
    ? games.filter((g) => getOutcomeForUser(g, user.id) === "loss").length
    : 0;
  const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Match History
            </h1>
          </div>
          <p className="text-zinc-500 text-sm ml-13">
            Your recorded Connect Four matches and outcomes.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/20 rounded-xl text-rose-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Gamepad2} label="Total Matches" value={games.length.toString()} />
          <StatCard icon={Trophy} label="Victories" value={wins.toString()} valueColor="text-emerald-400" />
          <StatCard icon={XCircle} label="Defeats" value={losses.toString()} valueColor="text-rose-400" />
          <StatCard icon={TrendingUp} label="Win Ratio" value={`${winRate}%`} valueColor="text-indigo-400" />
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4 px-1">
            Recent Sessions
          </h3>

          {games.length > 0 ? (
            <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-white/5">
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Module
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Opponent
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Outcome
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {games.map((game) => {
                      const badge = getResultBadge(game);
                      const BadgeIcon = badge.icon;
                      const opponent = game.isAgainstAI ? "AI" : "Human";

                      return (
                        <tr
                          key={game.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
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
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              {game.isAgainstAI ? (
                                <Bot className="w-4 h-4" />
                              ) : (
                                <UserIcon className="w-4 h-4" />
                              )}
                              {opponent}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badge.style}`}
                            >
                              <BadgeIcon className="w-3 h-3" />
                              {badge.text}
                            </span>
                          </td>
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
              <p className="text-zinc-600 text-sm max-w-sm">
                Finish a Connect Four match and it will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueColor = "text-zinc-100",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex items-start gap-4 hover:bg-zinc-900/60 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
        <Icon className="w-5 h-5 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium mb-1 uppercase tracking-wider">
          {label}
        </p>
        <p className={`text-2xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}
