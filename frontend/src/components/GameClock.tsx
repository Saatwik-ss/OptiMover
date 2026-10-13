import React from "react";
import { Clock } from "lucide-react";

export interface GameClockProps {
  timeInSeconds: number;
  isActive: boolean;
  label?: string;
  lowTimeThreshold?: number;
}

export function formatGameTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export const GameClock: React.FC<GameClockProps> = ({
  timeInSeconds,
  isActive,
  label,
  lowTimeThreshold = 30,
}) => {
  const isLowTime = timeInSeconds <= lowTimeThreshold && timeInSeconds > 0;
  const isExpired = timeInSeconds <= 0;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono transition-all duration-200 select-none shadow-sm ${
        isExpired
          ? "bg-rose-950/80 border-rose-600 text-rose-400 font-bold"
          : isLowTime
            ? "bg-rose-950/40 border-rose-500/70 text-rose-300 font-bold"
            : isActive
              ? "bg-zinc-800 border-blue-500 text-white font-bold ring-1 ring-blue-500/50 shadow-md"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 font-semibold"
      }`}
    >
      <Clock
        className={`w-3.5 h-3.5 shrink-0 ${
          isLowTime
            ? "text-rose-400 animate-pulse"
            : isActive
              ? "text-blue-400"
              : "text-zinc-500"
        }`}
      />
      <span className="text-sm font-semibold tracking-wide">
        {formatGameTime(timeInSeconds)}
      </span>
      {label && (
        <span className="text-[10px] text-zinc-500 font-sans uppercase font-medium">
          {label}
        </span>
      )}
    </div>
  );
};

export default GameClock;
