"use client";

import { CertificadoTipo } from "../hooks/useCertificadoForm";

interface StepTipoCertificadoProps {
  selected: CertificadoTipo | null;
  onSelect: (tipo: CertificadoTipo) => void;
  error?: string;
}

export default function StepTipoCertificado({
  selected,
  onSelect,
  error,
}: StepTipoCertificadoProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#17251F]">Tipo de certificado</h2>
        <p className="mt-1 text-sm text-[#6B7F75]">
          Selecciona el producto para el cual deseas generar el certificado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("oleina")}
          className={`group relative flex flex-col items-center justify-center rounded-xl border-2 p-8 transition-all hover:border-[#1A8A3A] hover:bg-[#F2FAF4] ${
            selected === "oleina"
              ? "border-[#1A8A3A] bg-[#F2FAF4] ring-2 ring-[#1A8A3A] ring-offset-2"
              : "border-[#DDE8E2] bg-white"
          }`}
        >
          <div className="mb-4 text-4xl">🟡</div>
          <h3 className="text-lg font-black text-[#17251F]">Oleína</h3>
          <p className="mt-1 text-sm font-medium text-[#6B7F75]">de Palma</p>
          {selected === "oleina" && (
            <div className="absolute top-3 right-3 text-[#1A8A3A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelect("rbd")}
          className={`group relative flex flex-col items-center justify-center rounded-xl border-2 p-8 transition-all hover:border-[#1A8A3A] hover:bg-[#F2FAF4] ${
            selected === "rbd"
              ? "border-[#1A8A3A] bg-[#F2FAF4] ring-2 ring-[#1A8A3A] ring-offset-2"
              : "border-[#DDE8E2] bg-white"
          }`}
        >
          <div className="mb-4 text-4xl">🟠</div>
          <h3 className="text-lg font-black text-[#17251F]">RBD</h3>
          <p className="mt-1 text-sm font-medium text-[#6B7F75]">Refinado</p>
          {selected === "rbd" && (
            <div className="absolute top-3 right-3 text-[#1A8A3A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </button>
      </div>

      {error && (
        <p className="text-center text-sm font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
