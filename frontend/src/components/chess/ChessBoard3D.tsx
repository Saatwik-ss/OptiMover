import React, { useState } from "react";
import ChessPiece3D, { PieceType, PieceColor } from "./ChessPiece3D";
import { Chess, Square } from "chess.js";

export type BoardTheme = "indigo" | "wood" | "emerald" | "obsidian";

interface ChessBoard3DProps {
  fen: string;
  onMove: (from: string, to: string, promotion?: string) => void;
  disabled?: boolean;
  isAIThinking?: boolean;
  orientation?: "white" | "black";
  theme?: BoardTheme;
  lastMove?: { from: string; to: string } | null;
  isCheck?: boolean;
}

const THEME_STYLES: Record<
  BoardTheme,
  {
    light: string;
    dark: string;
    border: string;
    rim: string;
    coordLight: string;
    coordDark: string;
  }
> = {
  indigo: {
    light: "bg-slate-200 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]",
    dark: "bg-indigo-900/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]",
    border: "border-indigo-950/80 bg-gradient-to-b from-indigo-950 to-slate-950",
    rim: "ring-2 ring-indigo-500/20",
    coordLight: "text-indigo-950",
    coordDark: "text-slate-300",
  },
  wood: {
    light: "bg-[#f0d9b5] shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)]",
    dark: "bg-[#b58863] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
    border: "border-[#5c3a21] bg-gradient-to-b from-[#784c28] to-[#422513]",
    rim: "ring-2 ring-amber-600/30",
    coordLight: "text-[#b58863]",
    coordDark: "text-[#f0d9b5]",
  },
  emerald: {
    light: "bg-[#ffffdd] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]",
    dark: "bg-[#2e7d32] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]",
    border: "border-[#1b5e20] bg-gradient-to-b from-[#1b5e20] to-[#0a2f10]",
    rim: "ring-2 ring-emerald-500/20",
    coordLight: "text-[#2e7d32]",
    coordDark: "text-[#ffffdd]",
  },
  obsidian: {
    light: "bg-zinc-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]",
    dark: "bg-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]",
    border: "border-zinc-900 bg-gradient-to-b from-zinc-900 to-black",
    rim: "ring-2 ring-zinc-700/40",
    coordLight: "text-zinc-800",
    coordDark: "text-zinc-300",
  },
};

export const ChessBoard3D: React.FC<ChessBoard3DProps> = ({
  fen,
  onMove,
  disabled = false,
  isAIThinking = false,
  orientation = "white",
  theme = "indigo",
  lastMove = null,
  isCheck = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const chess = new Chess(fen);

  // Find legal moves for the selected piece
  const legalDestinations = selectedSquare
    ? chess
        .moves({ square: selectedSquare, verbose: true })
        .map((m) => m.to)
    : [];

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  const displayFiles = orientation === "white" ? files : [...files].reverse();
  const displayRanks = orientation === "white" ? ranks : [...ranks].reverse();

  const themeConfig = THEME_STYLES[theme] || THEME_STYLES.indigo;

  const handleSquareClick = (square: Square) => {
    if (disabled || isAIThinking) return;

    if (!selectedSquare) {
      const piece = chess.get(square);
      if (piece) {
        // Can only pick your turn's piece
        const turnColor = chess.turn();
        if (piece.color === turnColor) {
          setSelectedSquare(square);
        }
      }
    } else {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // Check if clicked another piece of the same color
      const clickedPiece = chess.get(square);
      if (clickedPiece && clickedPiece.color === chess.turn()) {
        setSelectedSquare(square);
        return;
      }

      // Move attempt
      if (legalDestinations.includes(square)) {
        onMove(selectedSquare, square);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  return (
    <div className="relative mx-auto flex flex-col items-center w-full">
      {/* 2D Flat Board Frame with Chess.com / Lichess proportions */}
      <div
        className={`w-full max-w-[580px] sm:max-w-[640px] lg:max-w-[680px] aspect-square p-2.5 sm:p-3.5 rounded-xl shadow-2xl border-4 ${themeConfig.border} ${themeConfig.rim} relative select-none`}
      >
        {/* 8x8 Board Grid */}
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden border border-black/40">
          {displayRanks.map((rank, rankIdx) =>
            displayFiles.map((file, fileIdx) => {
              const square = `${file}${rank}` as Square;
              const isLight = (file.charCodeAt(0) - 97 + parseInt(rank)) % 2 !== 0;

              const piece = chess.get(square);
              const isSelected = selectedSquare === square;
              const isLegalTarget = legalDestinations.includes(square);
              const isLastMoveSquare =
                lastMove && (lastMove.from === square || lastMove.to === square);

              // Check indication on king
              const isCheckedKing =
                isCheck &&
                piece?.type === "k" &&
                piece?.color === chess.turn();

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                    isLight ? themeConfig.light : themeConfig.dark
                  } ${
                    isSelected ? "!bg-blue-500/50 ring-2 ring-blue-400 z-10" : ""
                  } ${
                    isLastMoveSquare && !isSelected ? "ring-2 ring-blue-400/50 bg-blue-500/20" : ""
                  } ${
                    isCheckedKing ? "!bg-red-600/70 ring-2 ring-red-500" : ""
                  }`}
                >
                  {/* File / Rank Coordinates on edges */}
                  {fileIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-bold select-none ${
                        isLight ? themeConfig.coordLight : themeConfig.coordDark
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rankIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-bold select-none ${
                        isLight ? themeConfig.coordLight : themeConfig.coordDark
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Legal Move Indicator */}
                  {isLegalTarget && (
                    <div
                      className={`absolute pointer-events-none rounded-full z-20 transition-all ${
                        piece
                          ? "w-full h-full border-4 border-blue-400/80 rounded-none bg-blue-500/20"
                          : "w-3 h-3 sm:w-3.5 sm:h-3.5 bg-blue-500/80"
                      }`}
                    />
                  )}

                  {/* 3D Piece */}
                  {piece && (
                    <div className="w-[84%] h-[84%] relative z-10">
                      <ChessPiece3D
                        type={piece.type as PieceType}
                        color={piece.color as PieceColor}
                        isDragging={isSelected}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard3D;
