import React from "react";

export type PieceType = "p" | "r" | "n" | "b" | "q" | "k";
export type PieceColor = "w" | "b";

interface ChessPiece3DProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
  isDragging?: boolean;
}

export const ChessPiece3D: React.FC<ChessPiece3DProps> = ({
  type,
  color,
  className = "",
  isDragging = false,
}) => {
  const isWhite = color === "w";

  // White pieces: pure ivory / white porcelain with soft specular shine & subtle drop shadow
  // Black pieces: obsidian / polished onyx with rim light highlights
  const filterId = isWhite ? "white-piece-3d" : "black-piece-3d";
  const primaryGrad = isWhite ? "url(#grad-white-3d)" : "url(#grad-black-3d)";
  const strokeColor = isWhite ? "#94a3b8" : "#09090b";
  const highlightColor = isWhite ? "#ffffff" : "#475569";

  const renderPath = () => {
    switch (type) {
      case "p": // Pawn
        return (
          <g transform="translate(10, 8) scale(0.8)">
            {/* Base */}
            <path
              d="M20 78 C25 76 55 76 60 78 C65 83 15 83 20 78 Z"
              fill={primaryGrad}
              stroke={strokeColor}
              strokeWidth="2"
            />
            <path
              d="M24 72 C30 70 50 70 56 72 L60 78 L20 78 Z"
              fill={primaryGrad}
              stroke={strokeColor}
              strokeWidth="1.5"
            />
            {/* Body */}
            <path
              d="M34 42 C30 55 25 66 24 72 L56 72 C55 66 50 55 46 42 Z"
              fill={primaryGrad}
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Collar */}
            <ellipse cx="40" cy="42" rx="14" ry="4" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Head */}
            <circle cx="40" cy="26" r="14" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            {/* 3D Specular Highlight */}
            <circle cx="36" cy="22" r="4.5" fill={highlightColor} opacity={isWhite ? "0.6" : "0.35"} />
          </g>
        );

      case "r": // Rook
        return (
          <g transform="translate(10, 8) scale(0.8)">
            {/* Base */}
            <path d="M16 80 C24 77 56 77 64 80 L66 84 L14 84 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            <path d="M22 72 L58 72 L64 80 L16 80 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Body */}
            <path d="M26 34 L54 34 L57 72 L23 72 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            {/* Neck */}
            <rect x="20" y="30" width="40" height="5" rx="2" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Battlements */}
            <path
              d="M18 16 L26 16 L26 24 L34 24 L34 16 L46 16 L46 24 L54 24 L54 16 L62 16 L62 30 L18 30 Z"
              fill={primaryGrad}
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Specular Highlight */}
            <rect x="28" y="36" width="6" height="32" rx="3" fill={highlightColor} opacity={isWhite ? "0.45" : "0.25"} />
          </g>
        );

      case "n": // Knight
        return (
          <g transform="translate(10, 8) scale(0.8)">
            {/* Base */}
            <path d="M16 80 C24 77 56 77 64 80 L66 84 L14 84 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            <path d="M22 72 L58 72 L64 80 L16 80 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Horse Head Silhouette */}
            <path
              d="M24 72 C22 55 18 42 22 32 C26 22 34 14 44 14 C48 14 50 16 52 18 C56 16 58 12 60 14 C62 16 60 22 58 26 C64 30 66 38 64 42 C60 44 54 42 50 38 L48 44 C42 48 38 58 38 72 Z"
              fill={primaryGrad}
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Muzzle / Chest contour */}
            <path d="M22 32 C30 34 38 30 44 26" fill="none" stroke={strokeColor} strokeWidth="2" />
            {/* Eye */}
            <circle cx="34" cy="24" r="2.5" fill={strokeColor} />
            {/* Mane Highlights */}
            <path d="M52 24 C50 34 44 48 42 58" fill="none" stroke={highlightColor} strokeWidth="3" opacity={isWhite ? "0.6" : "0.3"} strokeLinecap="round" />
          </g>
        );

      case "b": // Bishop
        return (
          <g transform="translate(10, 8) scale(0.8)">
            {/* Base */}
            <path d="M18 80 C26 77 54 77 62 80 L64 84 L16 84 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            <path d="M24 72 L56 72 L62 80 L18 80 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Stem */}
            <path d="M30 42 C26 54 24 64 24 72 L56 72 C56 64 54 54 50 42 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            <ellipse cx="40" cy="42" rx="15" ry="4" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Mitre (Head) */}
            <path
              d="M26 36 C24 24 32 14 40 10 C48 14 56 24 54 36 C50 42 30 42 26 36 Z"
              fill={primaryGrad}
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Mitre cut-slit */}
            <path d="M38 18 L48 28" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
            {/* Cross / Top Orb */}
            <circle cx="40" cy="9" r="3.5" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            <circle cx="37" cy="26" r="4" fill={highlightColor} opacity={isWhite ? "0.5" : "0.3"} />
          </g>
        );

      case "q": // Queen
        return (
          <g transform="translate(10, 8) scale(0.8)">
            {/* Base */}
            <path d="M16 80 C24 77 56 77 64 80 L66 84 L14 84 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            <path d="M22 72 L58 72 L64 80 L16 80 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Waist */}
            <path d="M28 38 C24 52 22 64 22 72 L58 72 C58 64 56 52 52 38 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            <ellipse cx="40" cy="38" rx="18" ry="4" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Crown Spikes */}
            <path
              d="M18 20 L28 36 L40 18 L52 36 L62 20 L58 38 L22 38 Z"
              fill={primaryGrad}
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Crown jewels */}
            <circle cx="18" cy="18" r="3" fill={primaryGrad} stroke={strokeColor} strokeWidth="1" />
            <circle cx="40" cy="16" r="3.5" fill={primaryGrad} stroke={strokeColor} strokeWidth="1" />
            <circle cx="62" cy="18" r="3" fill={primaryGrad} stroke={strokeColor} strokeWidth="1" />
            {/* Shimmer */}
            <ellipse cx="36" cy="52" rx="4" ry="14" fill={highlightColor} opacity={isWhite ? "0.5" : "0.25"} />
          </g>
        );

      case "k": // King
        return (
          <g transform="translate(10, 8) scale(0.8)">
            {/* Base */}
            <path d="M14 80 C22 77 58 77 66 80 L68 84 L12 84 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            <path d="M20 72 L60 72 L66 80 L14 80 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Waist */}
            <path d="M28 36 C24 50 22 64 20 72 L60 72 C58 64 56 50 52 36 Z" fill={primaryGrad} stroke={strokeColor} strokeWidth="2" />
            <ellipse cx="40" cy="36" rx="19" ry="4" fill={primaryGrad} stroke={strokeColor} strokeWidth="1.5" />
            {/* Arched Crown */}
            <path
              d="M22 36 C20 22 32 18 40 18 C48 18 60 22 58 36 Z"
              fill={primaryGrad}
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Regal Cross */}
            <path d="M40 8 L40 18 M35 12 L45 12" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx="36" cy="27" r="4.5" fill={highlightColor} opacity={isWhite ? "0.55" : "0.3"} />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative select-none flex items-center justify-center transition-transform duration-150 ${
        isDragging ? "scale-115 -translate-y-2 drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)]" : "hover:scale-105"
      } ${className}`}
    >
      <svg
        viewBox="0 0 80 80"
        className="w-full h-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.4)]"
      >
        <defs>
          {/* White Piece 3D Gradient */}
          <linearGradient id="grad-white-3d" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#f8fafc" />
            <stop offset="80%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Black Piece 3D Gradient */}
          <linearGradient id="grad-black-3d" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="35%" stopColor="#1e293b" />
            <stop offset="75%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Piece Drop Shadow Filter */}
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.5" />
          </filter>
        </defs>

        {renderPath()}
      </svg>
    </div>
  );
};

export default ChessPiece3D;
