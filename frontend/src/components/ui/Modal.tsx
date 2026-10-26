"use client";

import type { ReactNode } from "react";

type Props = {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
  ancho?: "md" | "lg" | "2xl";
};

const ANCHOS = { md: "max-w-md", lg: "max-w-lg", "2xl": "max-w-2xl" };

export default function Modal({ titulo, onClose, children, ancho = "lg" }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-[#17251F]/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          className={`w-full ${ANCHOS[ancho]} max-h-[90vh] overflow-y-auto rounded-lg border border-[#DDE8E2] bg-white shadow-lg`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DDE8E2] bg-white px-6 py-4">
            <h2 className="text-lg font-bold text-[#17251F]">{titulo}</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7F75] hover:bg-[#F1F6F3]"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </>
  );
}
