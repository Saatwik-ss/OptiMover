import { useState } from "react";
import Button from "./Button";

export interface GameOptions {
  whoMovesFirst?: "you" | "opponent";
  playerColor?: "red" | "yellow";
  opponentColor?: "red" | "yellow";
  boardColor?: string;
  difficulty?: number; // 1..5
}

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
  const [boardColor, setBoardColor] = useState<string>("bg-slate-800");
  const [difficulty, setDifficulty] = useState<number>(1);

  if (!open) return null;

  const handleConfirm = () => {
    const opponentColor = playerColor === "red" ? "yellow" : "red";
    onConfirm({ whoMovesFirst, playerColor, opponentColor, boardColor, difficulty });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-w-md w-full bg-black border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Game Options</h3>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-400 uppercase mb-2">Who moves first</p>
            <div className="flex gap-2">
              <button
                onClick={() => setWhoMovesFirst("you")}
                className={`flex-1 py-2 rounded-lg ${whoMovesFirst === "you" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
              >
                You
              </button>
              <button
                onClick={() => setWhoMovesFirst("opponent")}
                className={`flex-1 py-2 rounded-lg ${whoMovesFirst === "opponent" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
              >
                {vsAI ? "AI" : "Opponent"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-400 uppercase mb-2">Your piece color</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPlayerColor("red")}
                className={`flex-1 py-2 rounded-lg ${playerColor === "red" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
              >
                Red
              </button>
              <button
                onClick={() => setPlayerColor("yellow")}
                className={`flex-1 py-2 rounded-lg ${playerColor === "yellow" ? "bg-amber-400 text-zinc-900" : "bg-zinc-800 text-zinc-300"}`}
              >
                Yellow
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-400 uppercase mb-2">Board color</p>
            <div className="flex gap-2">
              <button onClick={() => setBoardColor("bg-slate-800")} className={`w-10 h-8 rounded ${boardColor === "bg-slate-800" ? "ring-2 ring-indigo-500" : ""} bg-slate-800`} />
              <button onClick={() => setBoardColor("bg-indigo-800")} className={`w-10 h-8 rounded ${boardColor === "bg-indigo-800" ? "ring-2 ring-indigo-500" : ""} bg-indigo-800`} />
              <button onClick={() => setBoardColor("bg-emerald-800")} className={`w-10 h-8 rounded ${boardColor === "bg-emerald-800" ? "ring-2 ring-indigo-500" : ""} bg-emerald-800`} />
              <button onClick={() => setBoardColor("bg-rose-800")} className={`w-10 h-8 rounded ${boardColor === "bg-rose-800" ? "ring-2 ring-indigo-500" : ""} bg-rose-800`} />
            </div>
          </div>

          {vsAI && (
            <div>
              <p className="text-xs text-zinc-400 uppercase mb-2">Difficulty</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`flex-1 py-2 rounded-lg ${difficulty === lvl ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700">Cancel</Button>
          <Button onClick={handleConfirm} className="bg-indigo-600 hover:bg-indigo-500">Start</Button>
        </div>
      </div>
    </div>
  );
}
