"use client";

import { useState } from "react";

export type CertificadoTipo = "oleina" | "rbd";

export interface ParametrosForm {
  acidez: string;
  humedad: string;
  indice_yodo: string;
  peroxido: string;
  punto_nube?: string;
  color_amarillo: string;
  color_rojo: string;
}

export interface CertificadoFormData {
  tipo: CertificadoTipo | null;
  empresa_cliente: string;
  nit_cliente: string;
  lote: string;
  peso_kg: string;
  fecha_vencimiento: string;
  parametros: ParametrosForm;
}

const initialParametros: ParametrosForm = {
  acidez: "",
  humedad: "",
  indice_yodo: "",
  peroxido: "",
  punto_nube: "",
  color_amarillo: "",
  color_rojo: "",
};

const initialData: CertificadoFormData = {
  tipo: null,
  empresa_cliente: "",
  nit_cliente: "",
  lote: "",
  peso_kg: "",
  fecha_vencimiento: "",
  parametros: initialParametros,
};

export function useCertificadoForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CertificadoFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (newData: Partial<CertificadoFormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
    // Clear errors when updating
    setErrors({});
  };

  const updateParametros = (newParametros: Partial<ParametrosForm>) => {
    setFormData((prev) => ({
      ...prev,
      parametros: { ...prev.parametros, ...newParametros },
    }));
    setErrors({});
  };

  const setTipo = (tipo: CertificadoTipo) => {
    setFormData((prev) => ({
      ...prev,
      tipo,
      // Reset parameters if type changes
      parametros: initialParametros,
    }));
    setErrors({});
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.tipo) newErrors.tipo = "Debes seleccionar un tipo de certificado";
    } else if (currentStep === 2) {
      if (!formData.empresa_cliente.trim())
        newErrors.empresa_cliente = "El nombre de la empresa es requerido";
    } else if (currentStep === 3) {
      if (!formData.lote.trim()) newErrors.lote = "El número de lote es requerido";
      if (formData.tipo === "rbd" && formData.peso_kg && isNaN(parseFloat(normalizeDecimal(formData.peso_kg)))) {
        newErrors.peso_kg = "Debe ser un valor numérico";
      }
    } else if (currentStep === 4) {
      const { acidez, humedad, indice_yodo, peroxido, color_amarillo, color_rojo, punto_nube } =
        formData.parametros;
      if (!acidez) newErrors.acidez = "Requerido";
      else if (isNaN(parseFloat(normalizeDecimal(acidez)))) newErrors.acidez = "Numérico";

      if (!humedad) newErrors.humedad = "Requerido";
      else if (isNaN(parseFloat(normalizeDecimal(humedad)))) newErrors.humedad = "Numérico";

      if (!indice_yodo) newErrors.indice_yodo = "Requerido";
      else if (isNaN(parseFloat(normalizeDecimal(indice_yodo)))) newErrors.indice_yodo = "Numérico";

      if (!peroxido) newErrors.peroxido = "Requerido";
      else if (isNaN(parseFloat(normalizeDecimal(peroxido)))) newErrors.peroxido = "Numérico";

      if (!color_amarillo) newErrors.color_amarillo = "Requerido";
      else if (isNaN(parseFloat(normalizeDecimal(color_amarillo)))) newErrors.color_amarillo = "Numérico";

      if (!color_rojo) newErrors.color_rojo = "Requerido";
      else if (isNaN(parseFloat(normalizeDecimal(color_rojo)))) newErrors.color_rojo = "Numérico";

      if (formData.tipo === "oleina") {
        if (!punto_nube) newErrors.punto_nube = "Requerido";
        else if (isNaN(parseFloat(normalizeDecimal(punto_nube)))) newErrors.punto_nube = "Numérico";
      }
    } else if (currentStep === 5) {
      if (!formData.fecha_vencimiento) {
        newErrors.fecha_vencimiento = "La fecha de vencimiento es requerida";
      } else {
        const selectedDate = new Date(formData.fecha_vencimiento);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          newErrors.fecha_vencimiento = "La fecha debe ser futura";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeDecimal = (value: string) => {
    return value.replace(",", ".");
  };

  const getApiPayload = () => {
    const payload = {
      tipo: formData.tipo,
      empresa_cliente: formData.empresa_cliente,
      nit_cliente: formData.nit_cliente || undefined,
      lote: formData.lote,
      peso_kg: formData.tipo === "rbd" && formData.peso_kg ? parseFloat(normalizeDecimal(formData.peso_kg)) : null,
      fecha_vencimiento: formData.fecha_vencimiento,
      parametros: {
        acidez: normalizeDecimal(formData.parametros.acidez),
        humedad: normalizeDecimal(formData.parametros.humedad),
        indice_yodo: normalizeDecimal(formData.parametros.indice_yodo),
        peroxido: normalizeDecimal(formData.parametros.peroxido),
        color_amarillo: normalizeDecimal(formData.parametros.color_amarillo),
        color_rojo: normalizeDecimal(formData.parametros.color_rojo),
      } as Record<string, string>,
    };

    if (formData.tipo === "oleina") {
      payload.parametros.punto_nube = normalizeDecimal(formData.parametros.punto_nube || "");
    }

    return payload;
  };

  return {
    step,
    formData,
    errors,
    setStep,
    updateFormData,
    updateParametros,
    setTipo,
    nextStep,
    prevStep,
    getApiPayload,
    validateStep,
  };
}
