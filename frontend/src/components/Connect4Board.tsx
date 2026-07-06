/**
 * Connect Four Board Component
 * Game board UI with column selection and piece animation
 */

import { useState, useEffect } from "react";
import classNames from "classnames";

export interface Connect4BoardProps {
  board: number[][];
  onColumnClick: (column: number) => void;
  disabled?: boolean;
  isAIThinking?: boolean;
}

export default function Connect4Board({
  board,
  onColumnClick,
  disabled = false,
  isAIThinking = false,
}: Connect4BoardProps) {
  const [highlightColumn, setHighlightColumn] = useState<number | null>(null);
  const [dropAnimation, setDropAnimation] = useState<{ col: number; row: number } | null>(
    null
  );

  const ROWS = 6;
  const COLS = 7;

  const handleColumnHover = (col: number) => {
    if (!disabled && !isAIThinking) {
      setHighlightColumn(col);
    }
  };

  const handleColumnClick = (col: number) => {
    if (disabled || isAIThinking) return;

    // Find where piece would land
    let landRow = -1;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === 0) {
        landRow = row;
        break;
      }
    }

    if (landRow >= 0) {
      setDropAnimation({ col, row: landRow });
      setTimeout(() => {
        onColumnClick(col);
        setDropAnimation(null);
      }, 300);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Column indicators */}
      <div className="flex gap-3">
        {Array.from({ length: COLS }).map((_, col) => (
          <div
            key={`header-${col}`}
            className="w-14 h-10 flex items-center justify-center text-slate-400 font-mono text-sm"
          >
            {col}
          </div>
        ))}
      </div>

      {/* Board */}
      <div
        className={classNames(
          "relative bg-gradient-to-b from-blue-600 to-blue-700 rounded-xl p-3 shadow-2xl",
          "grid gap-3",
          { "opacity-60 cursor-not-allowed": disabled || isAIThinking }
        )}
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          aspectRatio: `${COLS} / ${ROWS}`,
        }}
      >
        {/* Column click targets */}
        {Array.from({ length: COLS }).map((_, col) => (
          <button
            key={`target-${col}`}
            className={classNames(
              "absolute top-0 h-12 cursor-pointer hover:bg-white/10 transition-colors",
              { "bg-blue-400/20": highlightColumn === col && !disabled && !isAIThinking }
            )}
            style={{
              left: `calc((100% / ${COLS}) * ${col})`,
              width: `calc(100% / ${COLS})`,
              pointerEvents: disabled || isAIThinking ? "none" : "auto",
            }}
            onMouseEnter={() => handleColumnHover(col)}
            onMouseLeave={() => setHighlightColumn(null)}
            onClick={() => handleColumnClick(col)}
            aria-label={`Column ${col}`}
          />
        ))}

        {/* Game pieces */}
        {board.map((row, rowIdx) =>
          row.map((piece, colIdx) => {
            const isNewPiece = dropAnimation?.col === colIdx && dropAnimation?.row === rowIdx;
            const key = `piece-${rowIdx}-${colIdx}`;

            return (
              <div
                key={key}
                className={classNames(
                  "absolute rounded-full shadow-lg transition-all duration-300",
                  "w-12 h-12 sm:w-14 sm:h-14",
                  {
                    "bg-yellow-400 shadow-yellow-400/50": piece === 1,
                    "bg-red-500 shadow-red-500/50": piece === 2,
                    "bg-slate-700/30": piece === 0,
                  },
                  { "animate-pulse scale-110": isNewPiece }
                )}
                style={{
                  left: `calc((100% / ${COLS}) * ${colIdx} + (100% / ${COLS} - 3.5rem) / 2)`,
                  top: `calc((100% / ${ROWS}) * ${rowIdx} + (100% / ${ROWS} - 3.5rem) / 2)`,
                  transform: isNewPiece ? "translateY(-200px)" : "translateY(0)",
                }}
              />
            );
          })
        )}
      </div>

      {/* Status info */}
      {isAIThinking && (
        <div className="flex items-center gap-2 text-blue-400">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
          </div>
          <span className="text-sm font-medium">AI is thinking...</span>
        </div>
      )}
    </div>
  );
}

// Tailwind animation utilities (add to your CSS)
const tailwindAnimations = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .delay-100 {
    animation-delay: 0.1s;
  }

  .delay-200 {
    animation-delay: 0.2s;
  }
`;
