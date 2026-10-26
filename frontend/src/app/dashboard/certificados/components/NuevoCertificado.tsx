"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { getSession } from "@/lib/session";
import { puede } from "@/lib/permisos";
import {
  useCertificadoForm,
  type CertificadoFormData,
  type ParametrosForm,
} from "../hooks/useCertificadoForm";
import CertificadoStepper from "./CertificadoStepper";
import StepTipoCertificado from "./StepTipoCertificado";
import StepDatosCliente from "./StepDatosCliente";
import StepDatosLote from "./StepDatosLote";
import StepParametros from "./StepParametros";
import StepFechaVencimiento from "./StepFechaVencimiento";
import StepResumen from "./StepResumen";
import { graphqlRequest } from "@/lib/graphql";
import { downloadAuthenticatedFile } from "@/lib/api";
import { print } from "graphql";
import {
  CREATE_CERTIFICADO_MUTATION,
  GET_CERTIFICADO_QUERY,
  GET_FIRMANTE_QUERY,
  type CertificadoDetalle,
  type Firmante,
} from "@/graphql/certificados";

// Form data of an anulado certificado, to correct it (IG-22)
function desdeCertificado(certificado: CertificadoDetalle): CertificadoFormData {
  const parametros = Object.fromEntries(
    certificado.parametros
      .filter((p) => p.clave)
      .map((p) => [p.clave, p.valor]),
  ) as Partial<ParametrosForm>;
  const vence = certificado.fecha_vencimiento.slice(0, 10);
  return {
    tipo: certificado.tipo,
    empresa_id: certificado.empresa_id ?? "",
    cliente_id: certificado.cliente_id ?? "",
    empresa_cliente: certificado.empresa_cliente,
    nit_cliente: certificado.nit_cliente ?? "",
    lote: certificado.lote,
    peso_kg: certificado.peso_kg != null ? String(certificado.peso_kg).replace(".", ",") : "",
    // A past date has to be chosen again
    fecha_vencimiento: new Date(vence) > new Date() ? vence : "",
    parametros: {
      acidez: parametros.acidez ?? "",
      humedad: parametros.humedad ?? "",
      indice_yodo: parametros.indice_yodo ?? "",
      peroxido: parametros.peroxido ?? "",
      punto_nube: parametros.punto_nube ?? "",
      color_amarillo: parametros.color_amarillo ?? "",
      color_rojo: parametros.color_rojo ?? "",
    },
  };
}

export default function NuevoCertificado() {
  const router = useRouter();
  const reemplazaId = useSearchParams().get("reemplaza");
  const {
    step,
    formData,
    errors,
    nextStep,
    prevStep,
    setTipo,
    updateFormData,
    updateParametros,
    loadFormData,
    getApiPayload,
  } = useCertificadoForm();

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; archivo_url: string } | null>(null);
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const token = session?.token ?? null;
  const puedeGenerar = puede(session?.user.rol, "certificados", "escribir");
  // undefined while loading
  const [firmante, setFirmante] = useState<Firmante | null | undefined>(undefined);
  const [reemplazado, setReemplazado] = useState<CertificadoDetalle | null>(null);

  useEffect(() => {
    if (!session) router.push("/login");
    else if (!puedeGenerar) router.replace("/dashboard/certificados");
  }, [session, puedeGenerar, router]);

  useEffect(() => {
    if (!token) return;
    graphqlRequest<{ firmanteCertificados: Firmante | null }>(GET_FIRMANTE_QUERY, {}, token)
      .then((data) => setFirmante(data.firmanteCertificados))
      .catch(() => setFirmante(null));
  }, [token]);

  useEffect(() => {
    if (!token || !reemplazaId) return;
    graphqlRequest<{ certificado: CertificadoDetalle }>(
      GET_CERTIFICADO_QUERY,
      { id: reemplazaId },
      token,
    )
      .then(({ certificado }) => {
        setReemplazado(certificado);
        loadFormData(desdeCertificado(certificado));
      })
      .catch((err: unknown) =>
        setApiError(err instanceof Error ? err.message : "No se pudo cargar el certificado"),
      );
  }, [token, reemplazaId, loadFormData]);


  const handleGenerate = async () => {
    if (!token) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const payload = {
        ...getApiPayload(),
        ...(reemplazado ? { reemplaza_id: reemplazado.id } : {}),
      };
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

  const handleDownload = async () => {
    if (!token || !successData) return;
    setApiError(null);
    try {
      await downloadAuthenticatedFile(
        successData.archivo_url,
        token,
        `certificado-${successData.id}.pdf`,
      );
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleReset = () => {
    window.location.assign("/dashboard/certificados/nuevo");
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
            token={token}
            empresa_id={formData.empresa_id}
            cliente_id={formData.cliente_id}
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
        return (
          <>
            <StepResumen formData={formData} />
            {firmante && (
              <p className="mt-4 text-center text-sm text-[#6B7F75]">
                Firma: <strong className="text-[#17251F]">{firmante.nombre}</strong>
              </p>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="border-b border-[#DDE8E2] pb-6">
          <Link
            href="/dashboard/certificados"
            className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86] hover:text-[#0F6E2E]"
          >
            ← Certificados
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">
            {reemplazaId ? "Corregir" : "Generar"}{" "}
            <span className="text-[#0F6E2E]">Certificado</span>
          </h1>
        </div>

        {reemplazado && !successData && (
          <div className="rounded-lg border border-[#F2C8BE] bg-[#FFF8F1] p-4 text-sm text-[#8A4B0F]">
            Corrige los datos del certificado anulado del lote <strong>{reemplazado.lote}</strong>{" "}
            ({reemplazado.empresa_cliente}). El nuevo certificado quedará enlazado al anulado.
          </div>
        )}

        {firmante === null && !successData && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            No hay firmante de certificados configurada. Pide al Super Administrador que la asigne
            en Certificados antes de generar.
          </div>
        )}

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
              <button
                type="button"
                onClick={handleDownload}
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
              </button>
              <Button variant="secondary" onClick={handleReset} className="sm:w-auto">
                Generar otro
              </Button>
            </div>
            {apiError && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {apiError}
              </div>
            )}
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
  );
}
