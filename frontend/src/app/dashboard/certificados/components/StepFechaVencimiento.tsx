"use client";

import Input from "@/components/ui/Input";

interface StepFechaVencimientoProps {
  fecha_vencimiento: string;
  onChange: (fecha: string) => void;
  error?: string;
}

export default function StepFechaVencimiento({
  fecha_vencimiento,
  onChange,
  error,
}: StepFechaVencimientoProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#17251F]">Fecha de vencimiento</h2>
        <p className="mt-1 text-sm text-[#6B7F75]">
          Indica la fecha de expiración del producto
        </p>
      </div>

      <div className="mx-auto max-w-sm">
        <Input
          id="fecha_vencimiento"
          label="Fecha de vencimiento del producto"
          type="date"
          value={fecha_vencimiento}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          required
          min={new Date().toISOString().split("T")[0]}
        />
      </div>
    </div>
  );
}
