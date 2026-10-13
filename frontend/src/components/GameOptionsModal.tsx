import { useState } from "react";

export interface GameOptions {
  whoMovesFirst?: "you" | "opponent";
  playerColor?: "red" | "yellow";
  opponentColor?: "red" | "yellow";
  boardColor?: string;
  difficulty?: number; // 1..5
  timeControl?: number; // 60, 180, 300, 600
}

const TIME_CONTROL_OPTIONS = [
  { seconds: 60, label: "1 min", type: "Bullet" },
  { seconds: 180, label: "3 min", type: "Blitz" },
  { seconds: 300, label: "5 min", type: "Blitz" },
  { seconds: 600, label: "10 min", type: "Rapid" },
];

export default function GameOptionsModal({
  open,
  onClose,
  onConfirm,
  vsAI = true,
}: {
  open: boolean;
  vsAI?: boolean;
  onClose: () => void;
  onConfirm: (opts: GameOptions) => void;
}) {
  const [whoMovesFirst, setWhoMovesFirst] = useState<"you" | "opponent">("you");
  const [playerColor, setPlayerColor] = useState<"red" | "yellow">("red");
  const [boardColor, setBoardColor] = useState<string>("bg-blue-800");
  const [difficulty, setDifficulty] = useState<number>(3);
  const [timeControl, setTimeControl] = useState<number>(300);

  if (!open) return null;

  const handleConfirm = () => {
    const opponentColor = playerColor === "red" ? "yellow" : "red";
    onConfirm({ whoMovesFirst, playerColor, opponentColor, boardColor, difficulty, timeControl });
  };

  const BOARD_COLORS = [
    { id: "bg-blue-800", label: "Classic Blue", preview: "bg-blue-800" },
    { id: "bg-slate-800", label: "Slate Gray", preview: "bg-slate-800" },
    { id: "bg-emerald-800", label: "Emerald", preview: "bg-emerald-800" },
    { id: "bg-zinc-800", label: "Dark Obsidian", preview: "bg-zinc-800" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl z-10">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
          <h3 className="text-lg font-semibold text-white">Connect Four Setup</h3>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Who Moves First</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setWhoMovesFirst("you")}
                className={`py-2 px-3 text-sm font-medium rounded-xl border transition-colors ${
                  whoMovesFirst === "you"
                    ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                You
              </button>
              <button
                type="button"
                onClick={() => setWhoMovesFirst("opponent")}
                className={`py-2 px-3 text-sm font-medium rounded-xl border transition-colors ${
                  whoMovesFirst === "opponent"
                    ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                {vsAI ? "AI" : "Opponent"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Piece Color</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPlayerColor("red")}
                className={`py-2.5 px-3 rounded-xl border flex items-center gap-2.5 transition-colors ${
                  playerColor === "red"
                    ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-red-500 shrink-0" />
                <span className="text-sm font-medium">Red</span>
              </button>
              <button
                type="button"
                onClick={() => setPlayerColor("yellow")}
                className={`py-2.5 px-3 rounded-xl border flex items-center gap-2.5 transition-colors ${
                  playerColor === "yellow"
                    ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-yellow-400 shrink-0" />
                <span className="text-sm font-medium">Yellow</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Time Control</p>
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

          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Board Color</p>
            <div className="grid grid-cols-2 gap-2.5">
              {BOARD_COLORS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBoardColor(b.id)}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-colors ${
                    boardColor === b.id
                      ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                      : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <span className={`w-4 h-4 rounded ${b.preview} shrink-0`} />
                  <span className="text-xs font-medium">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          {vsAI && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Difficulty</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                      difficulty === lvl
                        ? "bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500"
                        : "bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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
}
