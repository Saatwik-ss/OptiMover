/**
 * Navbar Component
 * Navigation bar with user menu
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">♟️</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:inline">
              Board Games
            </span>
          </Link>

          {/* Center nav links */}
          {user && (
            <div className="hidden md:flex gap-8">
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                History
              </Link>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="hidden sm:flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-slate-400">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-slate-300 hover:text-white focus:outline-none text-sm font-medium"
                >
                  {user.username}
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                      onClick={() => setShowMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 border-t border-slate-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
