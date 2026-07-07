/**
 * Board Game Platform - React App
 */

import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { WifiOff } from "lucide-react";
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
      {/* Replaced the blue gradient with the custom chessboard background */}
      <div className="min-h-screen bg-chessboard flex flex-col font-sans selection:bg-indigo-500/30">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow">
          
          {/* Upgraded Connection Alert Banner */}
          {!isConnected && (
            <div className="mb-8 p-4 bg-rose-950/40 border border-rose-500/20 rounded-2xl flex items-center gap-4 backdrop-blur-md shadow-lg shadow-rose-900/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                <WifiOff className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <p className="text-rose-400 text-sm font-semibold tracking-wide">Connection Lost</p>
                <p className="text-rose-500/80 text-xs mt-0.5 font-medium">Attempting to re-establish secure link to the server...</p>
              </div>
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