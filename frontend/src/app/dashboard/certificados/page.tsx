"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import { getSession } from "@/lib/session";
import { useCertificadoForm } from "./hooks/useCertificadoForm";
import CertificadoStepper from "./components/CertificadoStepper";
import StepTipoCertificado from "./components/StepTipoCertificado";
import StepDatosCliente from "./components/StepDatosCliente";
import StepDatosLote from "./components/StepDatosLote";
import StepParametros from "./components/StepParametros";
import StepFechaVencimiento from "./components/StepFechaVencimiento";
import StepResumen from "./components/StepResumen";
import { graphqlRequest } from "@/lib/graphql";
import { gql } from "@apollo/client";
import { print } from "graphql";

const CREATE_CERTIFICADO_MUTATION = gql`
  mutation CreateCertificado($input: CreateCertificadoInput!) {
    createCertificado(input: $input) {
      id
      archivo_url
    }
  }
`;

export default function CertificadosPage() {
  const router = useRouter();
  const {
    step,
    formData,
    errors,
    nextStep,
    prevStep,
    setTipo,
    updateFormData,
    updateParametros,
    getApiPayload,
  } = useCertificadoForm();

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; archivo_url: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setToken(session.token);
  }, [router]);


  const handleGenerate = async () => {
    if (!token) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const payload = getApiPayload();
      const data = await graphqlRequest<{ createCertificado: { id: string; archivo_url: string } }>(
        print(CREATE_CERTIFICADO_MUTATION),
        { input: payload },
        token
      );

      setSuccessData({ id: data.createCertificado.id, archivo_url: data.createCertificado.archivo_url });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepTipoCertificado
            selected={formData.tipo}
            onSelect={setTipo}
            error={errors.tipo}
          />
        );
      case 2:
        return (
          <StepDatosCliente
            empresa_cliente={formData.empresa_cliente}
            nit_cliente={formData.nit_cliente}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <StepDatosLote
            tipo={formData.tipo}
            lote={formData.lote}
            peso_kg={formData.peso_kg}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <StepParametros
            tipo={formData.tipo}
            parametros={formData.parametros}
            onChange={updateParametros}
            errors={errors}
          />
        );
      case 5:
        return (
          <StepFechaVencimiento
            fecha_vencimiento={formData.fecha_vencimiento}
            onChange={(fecha) => updateFormData({ fecha_vencimiento: fecha })}
            error={errors.fecha_vencimiento}
          />
        );
      case 6:
        return <StepResumen formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="border-b border-[#DDE8E2] pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">
            Operaciones
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">
            Generar <span className="text-[#0F6E2E]">Certificado</span>
          </h1>
        </div>

        {successData ? (
          <div className="rounded-2xl border border-[#DDE8E2] bg-white p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F2FAF4] text-[#1A8A3A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-10 w-10"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-black text-[#17251F]">
              Certificado generado con éxito
            </h2>
            <p className="mt-2 text-[#6B7F75]">
              El documento ha sido creado correctamente y está listo para descargar.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={successData.archivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1A8A3A] px-6 py-3 font-bold text-white transition hover:bg-[#0F6E2E] sm:w-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Descargar PDF
              </a>
              <Button variant="secondary" onClick={handleReset} className="sm:w-auto">
                Generar otro
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#DDE8E2] bg-white p-6 shadow-sm md:p-8">
            <CertificadoStepper currentStep={step} />

            <div className="mt-8 min-h-[300px]">{renderStep()}</div>

            {apiError && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {apiError}
              </div>
            )}

            <div className="mt-10 flex items-center justify-between border-t border-[#EEF3F0] pt-8">
              <Button
                variant="secondary"
                onClick={prevStep}
                className={`w-auto px-8 ${step === 1 ? "invisible" : ""}`}
                disabled={isLoading}
              >
                Anterior
              </Button>

              {step < 6 ? (
                <Button onClick={nextStep} className="w-auto px-8">
                  Siguiente
                </Button>
              ) : (
                <Button onClick={handleGenerate} isLoading={isLoading} className="w-auto px-8">
                  Generar Certificado PDF
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
