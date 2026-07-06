/**
 * Dashboard Page
 * Main landing page with game options and login
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import Button from "../components/Button";

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
      navigate(`/game/${response.gameId}`);
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  // Not logged in - show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">♟️</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Board Games</h1>
            <p className="text-slate-400">Play classic games against AI</p>
          </div>

          {/* Login Form */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  required
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-red-200 text-sm">{loginError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg text-sm text-slate-300">
              <p className="font-medium mb-1">Demo Credentials:</p>
              <p>Username: <code className="bg-slate-800 px-1 rounded">player1</code></p>
              <p>Password: <code className="bg-slate-800 px-1 rounded">demo</code></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - show game options
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user?.username}!</h1>
        <p className="text-slate-400 text-lg">Choose a game to play</p>
      </div>

      {/* Game Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Connect Four */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-8 hover:border-blue-600 transition-colors">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg flex items-center justify-center mb-4">
            <span className="text-3xl">◯</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Connect Four</h2>
          <p className="text-slate-400 mb-6">
            Drop pieces to get four in a row. Play against our AI opponent.
          </p>

          <div className="space-y-2">
            <Button
              onClick={handlePlayVsAI}
              disabled={isCreatingGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isCreatingGame ? "Creating game..." : "Play vs AI"}
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-slate-500 text-sm">
              ✅ AI-powered • 🎮 Real-time gameplay • 📊 Game history
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-8 opacity-50">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center mb-4">
            <span className="text-3xl">🎯</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-400 mb-2">More Games Coming</h2>
          <p className="text-slate-500 mb-6">
            Chess, Checkers, Go and more board games will be available soon.
          </p>

          <Button disabled className="w-full" size="lg">
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-12 bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Your Statistics</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-slate-400 text-sm mb-1">Games Played</p>
            <p className="text-2xl font-bold text-white">12</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Games Won</p>
            <p className="text-2xl font-bold text-green-400">8</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-blue-400">66%</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">ELO Rating</p>
            <p className="text-2xl font-bold text-purple-400">1450</p>
          </div>
        </div>
      </div>
    </div>
  );
}
