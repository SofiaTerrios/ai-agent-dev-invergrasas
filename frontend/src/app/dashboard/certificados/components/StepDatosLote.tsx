"use client";

import Input from "@/components/ui/Input";
import { CertificadoTipo } from "../hooks/useCertificadoForm";

interface StepDatosLoteProps {
  tipo: CertificadoTipo | null;
  lote: string;
  peso_kg: string;
  onChange: (newData: { lote?: string; peso_kg?: string }) => void;
  errors: Record<string, string>;
}

export default function StepDatosLote({
  tipo,
  lote,
  peso_kg,
  onChange,
  errors,
}: StepDatosLoteProps) {
  const displayValue = (val: string) => {
    return val.replace(".", ",");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#17251F]">Datos del lote</h2>
        <p className="mt-1 text-sm text-[#6B7F75]">
          Información de trazabilidad del producto
        </p>
      </div>

      <div className="space-y-4">
        <Input
          id="lote"
          label="Número de lote"
          placeholder="Ej: 19-0426"
          value={lote}
          onChange={(e) => onChange({ lote: e.target.value })}
          error={errors.lote}
          required
        />

        {tipo === "rbd" && (
          <Input
            id="peso_kg"
            label="Peso (kg)"
            type="text"
            placeholder="Ej: 1200,50"
            value={displayValue(peso_kg)}
            onChange={(e) => onChange({ peso_kg: e.target.value })}
            error={errors.peso_kg}
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        )}
      </div>
    </div>
  );
}
