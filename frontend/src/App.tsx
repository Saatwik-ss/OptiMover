/**
 * Board Game Platform - React App
 * Main application component with routing and global state
 */

import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ConnectFourGame from "./pages/ConnectFourGame";
import GameHistory from "./pages/GameHistory";
import { useSocket } from "./hooks/useSocket";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { isConnected } = useSocket();
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!isConnected && (
            <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <p className="text-yellow-200 text-sm">
                ⚠️ Connection to server lost. Attempting to reconnect...
              </p>
            </div>
          )}

          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/login" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/game/:gameId" element={<ConnectFourGame />} />
                <Route path="/game/connect-four/:gameId" element={<ConnectFourGame />} />
                <Route path="/history" element={<GameHistory />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}
