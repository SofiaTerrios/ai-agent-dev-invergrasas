"use client";

import Input from "@/components/ui/Input";
import { CertificadoTipo, ParametrosForm } from "../hooks/useCertificadoForm";

interface StepParametrosProps {
  tipo: CertificadoTipo | null;
  parametros: ParametrosForm;
  onChange: (newParametros: Partial<ParametrosForm>) => void;
  errors: Record<string, string>;
}

export default function StepParametros({
  tipo,
  parametros,
  onChange,
  errors,
}: StepParametrosProps) {
  const fields = [
    { id: "acidez", label: "Acidez (%)", placeholder: "Ej: 0,07" },
    { id: "humedad", label: "Humedad (%)", placeholder: "Ej: 0,06" },
    { id: "indice_yodo", label: "Índice de Yodo (g I₂/100g)", placeholder: "Ej: 61,458" },
    { id: "peroxido", label: "Peróxido (meq O₂ Kg)", placeholder: "Ej: 0,30" },
    ...(tipo === "oleina"
      ? [{ id: "punto_nube", label: "Punto de Nube (°C)", placeholder: "Ej: 5,9" }]
      : []),
    { id: "color_amarillo", label: "Color Celda 5¼\" – Amarillo", placeholder: "Ej: 40,0" },
    { id: "color_rojo", label: "Color Celda 5¼\" – Rojo", placeholder: "Ej: 3,0" },
  ];

  const displayValue = (val: string) => {
    return val.replace(".", ",");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#17251F]">Especificaciones fisicoquímicas</h2>
        <p className="mt-1 text-sm text-[#6B7F75]">
          Ingresa los valores obtenidos en el análisis de laboratorio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
        {fields.map((field) => (
          <Input
            key={field.id}
            id={field.id}
            label={field.label}
            placeholder={field.placeholder}
            value={displayValue(parametros[field.id as keyof ParametrosForm] || "")}
            onChange={(e) => onChange({ [field.id]: e.target.value })}
            error={errors[field.id]}
            required
          />
        ))}
      </div>
    </div>
  );
}
