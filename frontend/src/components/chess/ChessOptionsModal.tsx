import React, { useState } from "react";
import { BoardTheme } from "./ChessBoard3D";

export interface ChessOptions {
  whoMovesFirst: "you" | "opponent";
  playerColor: "white" | "black";
  boardTheme: BoardTheme;
  difficulty: number; // 1 to 5
  timeControl: number; // in seconds: 60, 180, 300, 600
}

interface ChessOptionsModalProps {
  open: boolean;
  vsAI?: boolean;
  onClose: () => void;
  onConfirm: (opts: ChessOptions) => void;
}

const TIME_CONTROL_OPTIONS = [
  { seconds: 60, label: "1 min", type: "Bullet" },
  { seconds: 180, label: "3 min", type: "Blitz" },
  { seconds: 300, label: "5 min", type: "Blitz" },
  { seconds: 600, label: "10 min", type: "Rapid" },
];

const THEME_OPTIONS: { id: BoardTheme; label: string; previewClass: string }[] = [
  { id: "indigo", label: "Midnight Indigo", previewClass: "bg-indigo-950 border-indigo-700" },
  { id: "wood", label: "Walnut & Maple", previewClass: "bg-[#784c28] border-amber-800" },
  { id: "emerald", label: "Royal Emerald", previewClass: "bg-[#1b5e20] border-emerald-800" },
  { id: "obsidian", label: "Obsidian Slate", previewClass: "bg-zinc-900 border-zinc-700" },
];

const DIFFICULTY_PRESETS = [
  { level: 1, label: "Beginner", elo: "600 ELO", desc: "Frequent mistakes, relaxed play" },
  { level: 2, label: "Novice", elo: "1000 ELO", desc: "Developing piece skills" },
  { level: 3, label: "Intermediate", elo: "1400 ELO", desc: "Standard tactical play" },
  { level: 4, label: "Advanced", elo: "1700 ELO", desc: "Calculates captures and combinations" },
  { level: 5, label: "Master", elo: "2000+ ELO", desc: "Maximum search depth and evaluation" },
];

export const ChessOptionsModal: React.FC<ChessOptionsModalProps> = ({
  open,
  vsAI = true,
  onClose,
  onConfirm,
}) => {
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("indigo");
  const [difficulty, setDifficulty] = useState<number>(3);
  const [timeControl, setTimeControl] = useState<number>(300);

  if (!open) return null;

  const handleConfirm = () => {
    const whoMovesFirst = playerColor === "white" ? "you" : "opponent";
    onConfirm({
      playerColor,
      whoMovesFirst,
      boardTheme,
      difficulty,
      timeControl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop without blur distortion */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Clean Modal matched to dark theme palette */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">Chess Match Setup</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {vsAI ? "Configure match against AI" : "Set up multiplayer match"}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Piece Color Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Side
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlayerColor("white")}
                className={`py-2.5 px-4 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  playerColor === "white"
                    ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">White</p>
                  <p className="text-[11px] text-zinc-400">Moves first</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPlayerColor("black")}
                className={`py-2.5 px-4 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  playerColor === "black"
                    ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-zinc-950 border border-zinc-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Black</p>
                  <p className="text-[11px] text-zinc-400">Replies to first move</p>
                </div>
              </button>
            </div>
          </div>

          {/* Time Control Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Time Control
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_CONTROL_OPTIONS.map((tc) => (
                <button
                  key={tc.seconds}
                  type="button"
                  onClick={() => setTimeControl(tc.seconds)}
                  className={`py-2 px-2 rounded-xl border text-center transition-colors ${
                    timeControl === tc.seconds
                      ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                      : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <span className="text-sm font-semibold block">{tc.label}</span>
                  <span className="text-[10px] text-zinc-400 block">{tc.type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Board Theme Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Board Theme
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {THEME_OPTIONS.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setBoardTheme(th.id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-colors ${
                    boardTheme === th.id
                      ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                      : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border ${th.previewClass} shrink-0`} />
                  <span className="text-xs font-medium">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          {vsAI && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  AI Difficulty
                </label>
                <span className="text-xs font-mono font-medium text-blue-400">
                  {DIFFICULTY_PRESETS[difficulty - 1]?.elo}
                </span>
              </div>

              <div className="space-y-2">
                {DIFFICULTY_PRESETS.map((p) => {
                  const isSelected = difficulty === p.level;
                  return (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => setDifficulty(p.level)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                          : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      <div className="text-left">
                        <span className="text-xs font-semibold block">{p.label}</span>
                        <span className="text-[11px] text-zinc-400">{p.desc}</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">{p.elo}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChessOptionsModal;
