"use client";

import { CertificadoFormData } from "../hooks/useCertificadoForm";

interface StepResumenProps {
  formData: CertificadoFormData;
}

export default function StepResumen({ formData }: StepResumenProps) {
  const { tipo, empresa_cliente, nit_cliente, lote, peso_kg, fecha_vencimiento, parametros } =
    formData;

  const getLabel = (id: string) => {
    const labels: Record<string, string> = {
      acidez: "Acidez (%)",
      humedad: "Humedad (%)",
      indice_yodo: "Índice de Yodo (g I₂/100g)",
      peroxido: "Peróxido (meq O₂ Kg)",
      punto_nube: "Punto de Nube (°C)",
      color_amarillo: "Color Celda 5¼\" – Amarillo",
      color_rojo: "Color Celda 5¼\" – Rojo",
    };
    return labels[id] || id;
  };

  const displayValue = (val: string) => {
    return val.replace(".", ",");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#17251F]">Resumen del certificado</h2>
        <p className="mt-1 text-sm text-[#6B7F75]">
          Confirma que los datos ingresados sean correctos antes de generar el PDF
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-[#DDE8E2] bg-[#FAFCFB] p-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#7D8E86]">
            Información General
          </h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="font-bold text-[#486358]">Producto:</span>
            <span className="capitalize text-[#17251F]">{tipo}</span>

            <span className="font-bold text-[#486358]">Empresa:</span>
            <span className="text-[#17251F]">{empresa_cliente}</span>

            {nit_cliente && (
              <>
                <span className="font-bold text-[#486358]">NIT:</span>
                <span className="text-[#17251F]">{nit_cliente}</span>
              </>
            )}

            <span className="font-bold text-[#486358]">Lote:</span>
            <span className="text-[#17251F]">{lote}</span>

            {tipo === "rbd" && peso_kg && (
              <>
                <span className="font-bold text-[#486358]">Peso:</span>
                <span className="text-[#17251F]">{displayValue(peso_kg)} kg</span>
              </>
            )}

            <span className="font-bold text-[#486358]">Vencimiento:</span>
            <span className="text-[#17251F]">{fecha_vencimiento}</span>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-[#DDE8E2] bg-[#FAFCFB] p-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#7D8E86]">
            Parámetros Fisicoquímicos
          </h3>
          <div className="space-y-1">
            {Object.entries(parametros)
              .filter(([key, value]) => (tipo === "rbd" ? key !== "punto_nube" : true) && value)
              .map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-[#EEF3F0] py-1 text-sm">
                  <span className="font-bold text-[#486358]">{getLabel(key)}:</span>
                  <span className="text-[#17251F]">{displayValue(value as string)}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
