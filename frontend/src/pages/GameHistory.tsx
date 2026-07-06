/**
 * Game History Page
 * Shows past games and statistics
 */

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

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

  const getResultColor = (result?: string) => {
    if (!result) return "text-slate-400";
    if (result === "player1_wins") return "text-green-400";
    if (result === "ai_wins") return "text-red-400";
    return "text-yellow-400";
  };

  const getResultText = (result?: string) => {
    if (!result) return "In Progress";
    if (result === "player1_wins") return "Won";
    if (result === "ai_wins") return "Lost";
    return "Draw";
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
      <div className="flex items-center justify-center min-h-96">
        <p className="text-slate-400">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Game History</h1>
        <p className="text-slate-400">Your past games and statistics</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">Total Games</p>
          <p className="text-3xl font-bold text-white">{games.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">Wins</p>
          <p className="text-3xl font-bold text-green-400">
            {games.filter((g) => g.result === "player1_wins").length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">Losses</p>
          <p className="text-3xl font-bold text-red-400">
            {games.filter((g) => g.result === "ai_wins").length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <p className="text-slate-400 text-sm">Win Rate</p>
          <p className="text-3xl font-bold text-blue-400">
            {games.length > 0
              ? Math.round(
                  (games.filter((g) => g.result === "player1_wins").length / games.length) * 100
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Games Table */}
      {games.length > 0 ? (
        <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Opponent
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-sm">
                      <span className="text-white font-medium capitalize">
                        {game.gameType.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{game.opponent}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-semibold ${getResultColor(game.result)}`}>
                        {getResultText(game.result)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {formatDate(game.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No games played yet</p>
          <p className="text-slate-500 text-sm">Play a game to see it appear in your history</p>
        </div>
      )}
    </div>
  );
}
