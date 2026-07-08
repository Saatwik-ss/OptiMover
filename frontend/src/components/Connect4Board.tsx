/**
 * Connect Four Board Component
 * Game board UI with column selection and piece animation
 */

import { useState } from "react";
import classNames from "classnames";

export interface Connect4BoardProps {
  board: number[][];
  onColumnClick: (column: number) => void;
  disabled?: boolean;
  isAIThinking?: boolean;
  playerPieceClass?: string;
  opponentPieceClass?: string;
  boardClass?: string;
  opponentLabel?: string;
}

const COLS = 7;

export default function Connect4Board({
  board,
  onColumnClick,
  disabled = false,
  isAIThinking = false,
  playerPieceClass = "bg-yellow-400",
  opponentPieceClass = "bg-red-500",
  boardClass = "bg-gradient-to-b from-blue-600 to-blue-800 border border-blue-400/30",
  opponentLabel = "AI",
}: Connect4BoardProps) {
  const [highlightColumn, setHighlightColumn] = useState<number | null>(null);
  const canPlay = !disabled && !isAIThinking;

  const handleColumnClick = (col: number) => {
    if (!canPlay) return;

    // Column is full if top row is occupied
    if (board[0]?.[col] !== 0) return;

    onColumnClick(col);
  };

  const isColumnFull = (col: number) => board[0]?.[col] !== 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <p className="text-sm text-zinc-400 text-center">
        Click a column below to drop your{" "}
        <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 align-middle" />{" "}
        piece. Get four in a row to win.
      </p>

      {/* Column drop buttons */}
      <div className="grid grid-cols-7 gap-2 w-full">
        {Array.from({ length: COLS }).map((_, col) => (
          <button
            key={`drop-${col}`}
            type="button"
            disabled={!canPlay || isColumnFull(col)}
            className={classNames(
              "h-10 rounded-lg font-mono text-sm font-medium transition-all",
              "border border-white/10",
              {
                "bg-indigo-600/80 hover:bg-indigo-500 text-white cursor-pointer":
                  canPlay && !isColumnFull(col),
                "bg-zinc-800/50 text-zinc-600 cursor-not-allowed": isColumnFull(col),
                "opacity-50 cursor-not-allowed": !canPlay && !isColumnFull(col),
                "ring-2 ring-yellow-400/60 bg-indigo-500": highlightColumn === col && canPlay,
              }
            )}
            onMouseEnter={() => canPlay && setHighlightColumn(col)}
            onMouseLeave={() => setHighlightColumn(null)}
            onClick={() => handleColumnClick(col)}
            aria-label={`Drop piece in column ${col}`}
          >
            {col}
          </button>
        ))}
      </div>

      {/* Board */}
      <div
        className={classNames(
          "w-full rounded-2xl p-3 shadow-2xl",
          boardClass,
          { "opacity-60": !canPlay }
        )}
      >
        <div className="grid grid-cols-7 gap-2">
          {board.map((row, rowIdx) =>
            row.map((piece, colIdx) => (
              <button
                key={`cell-${rowIdx}-${colIdx}`}
                type="button"
                disabled={!canPlay || isColumnFull(colIdx)}
                className={classNames(
                  "aspect-square rounded-full transition-colors",
                  "bg-slate-900/70 border border-blue-900/50",
                  "flex items-center justify-center",
                  {
                    "hover:bg-slate-800/80 cursor-pointer":
                      canPlay && !isColumnFull(colIdx),
                    "cursor-default": !canPlay || isColumnFull(colIdx),
                    "ring-2 ring-yellow-400/40": highlightColumn === colIdx && canPlay,
                  }
                )}
                onClick={() => handleColumnClick(colIdx)}
                onMouseEnter={() => canPlay && setHighlightColumn(colIdx)}
                onMouseLeave={() => setHighlightColumn(null)}
                aria-label={`Column ${colIdx}, row ${rowIdx}`}
              >
                {piece !== 0 && (
                  <div
                    className={classNames(
                      "w-[88%] h-[88%] rounded-full shadow-lg",
                      {
                        [playerPieceClass + " shadow-yellow-400/40"]: piece === 1,
                        [opponentPieceClass + " shadow-red-500/40"]: piece === 2,
                      }
                    )}
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm text-zinc-400">
          <span className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${playerPieceClass}`} />
            You
          </span>
          <span className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${opponentPieceClass}`} />
            {opponentLabel}
          </span>
        </div>

      {isAIThinking && (
        <div className="flex items-center gap-2 text-blue-400">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
          <span className="text-sm font-medium">AI is thinking...</span>
        </div>
      )}
    </div>
  );
}
