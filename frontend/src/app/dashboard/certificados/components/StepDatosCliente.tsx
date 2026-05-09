"use client";

import Input from "@/components/ui/Input";

interface StepDatosClienteProps {
  empresa_cliente: string;
  nit_cliente: string;
  onChange: (newData: { empresa_cliente?: string; nit_cliente?: string }) => void;
  errors: Record<string, string>;
}

export default function StepDatosCliente({
  empresa_cliente,
  nit_cliente,
  onChange,
  errors,
}: StepDatosClienteProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#17251F]">Datos del cliente</h2>
        <p className="mt-1 text-sm text-[#6B7F75]">
          Ingresa la información de la empresa destinataria
        </p>
      </div>

      <div className="space-y-4">
        <Input
          id="empresa_cliente"
          label="Nombre de la empresa"
          placeholder="Ej: Alimentos S.A.S."
          value={empresa_cliente}
          onChange={(e) => onChange({ empresa_cliente: e.target.value })}
          error={errors.empresa_cliente}
          required
        />

        <Input
          id="nit_cliente"
          label="NIT (opcional)"
          placeholder="Ej: 900.123.456-7"
          value={nit_cliente}
          onChange={(e) => onChange({ nit_cliente: e.target.value })}
          error={errors.nit_cliente}
        />
      </div>
    </div>
  );
}
