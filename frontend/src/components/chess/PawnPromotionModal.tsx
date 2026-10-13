import React from "react";
import ChessPiece3D, { PieceType, PieceColor } from "./ChessPiece3D";

interface PawnPromotionModalProps {
  open: boolean;
  color: PieceColor;
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
  onCancel: () => void;
}

export const PawnPromotionModal: React.FC<PawnPromotionModalProps> = ({
  open,
  color,
  onSelect,
  onCancel,
}) => {
  if (!open) return null;

  const pieces: { type: "q" | "r" | "b" | "n"; label: string }[] = [
    { type: "q", label: "Queen" },
    { type: "r", label: "Rook" },
    { type: "b", label: "Bishop" },
    { type: "n", label: "Knight" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75" onClick={onCancel} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 max-w-sm w-full text-center">
        <h3 className="text-lg font-semibold text-white mb-1">Promote Pawn</h3>
        <p className="text-xs text-zinc-400 mb-6">Choose a piece to replace your promoted pawn</p>

        <div className="grid grid-cols-4 gap-3">
          {pieces.map((p) => (
            <button
              key={p.type}
              type="button"
              onClick={() => onSelect(p.type)}
              className="p-3 bg-zinc-800/80 hover:bg-blue-600/15 border border-zinc-700/60 hover:border-blue-500 rounded-xl flex flex-col items-center gap-2 transition-colors hover:ring-1 hover:ring-blue-500"
            >
              <div className="w-12 h-12">
                <ChessPiece3D type={p.type as PieceType} color={color} />
              </div>
              <span className="text-xs font-semibold text-zinc-200">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PawnPromotionModal;
