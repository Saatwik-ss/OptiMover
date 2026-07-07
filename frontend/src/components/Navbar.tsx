/**
 * Navbar Component
 * Navigation bar with user menu
 */

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { 
  Gamepad2, 
  LayoutDashboard, 
  History, 
  LogOut, 
  ChevronDown,
  User as UserIcon
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper to check active route
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-indigo-500/50 transition-colors shadow-lg">
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-100 hidden sm:inline group-hover:text-white transition-colors">
              OptiMover<span className="text-indigo-500">.AI</span>
            </span>
          </Link>

          {/* Center nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/dashboard') 
                    ? 'bg-white/10 text-zinc-100' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/history"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/history') 
                    ? 'bg-white/10 text-zinc-100' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <History className="w-4 h-4" />
                History
              </Link>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-4">
            
            {/* Connection status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5">
              <div className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? "bg-emerald-500" : "bg-rose-500"
                }`}></span>
              </div>
              <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>

            {/* User menu */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 transition-all focus:outline-none"
                >
                  {/* User Avatar Circle */}
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-zinc-300 hidden sm:block">
                    {user.username}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-950/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-1.5 z-50">
                    <div className="px-4 py-3 border-b border-white/5 mb-1">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-semibold text-zinc-200 truncate mt-0.5">{user.username}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 mx-1.5 px-2.5 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 rounded-lg transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                      Profile Overview
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 mx-1.5 mt-1 px-2.5 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors w-[calc(100%-12px)] text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
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