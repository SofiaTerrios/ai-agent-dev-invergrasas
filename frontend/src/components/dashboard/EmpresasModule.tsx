"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CreateEmpresaModal from "./modals/CreateEmpresaModal";
import EditEmpresaModal from "./modals/EditEmpresaModal";
import EmpresasTable from "./EmpresasTable";
import EmpresasCards from "./EmpresasCards";
import Button from "@/components/ui/Button";
import { graphqlRequest } from "@/lib/graphql";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import { getSession } from "@/lib/session";

export default function EmpresasModule() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | undefined>();
  const [error, setError] = useState<string>("");
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const token = session?.token;
  const user = session?.user;
  const isAdmin = user?.rol === "admin";

  // Redirect if not admin
  useEffect(() => {
    if (session && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
  }, [session, isAdmin, router]);

  // Load empresas
  const loadEmpresas = useCallback(async () => {
    if (!token) {
      setError("Token no disponible. Por favor, inicia sesión nuevamente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<{ empresas: Empresa[] }>(
        GET_EMPRESAS_QUERY,
        undefined,
        token
      );
      setEmpresas(data.empresas || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al cargar empresas";
      console.error("Error loading empresas:", errorMessage);
      
      if (errorMessage.includes("Invalid token") || errorMessage.includes("Unauthorized")) {
        setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (isAdmin && token) {
      loadEmpresas();
    }
  }, [isAdmin, token, loadEmpresas]);

  // Show loading while checking auth
  if (!session) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0F6E2E] border-t-transparent" />
          <span className="text-sm font-medium text-[#6B7F75]">Verificando acceso...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-[#F2C8BE] bg-[#FFF1EE] p-8">
        <p className="text-sm font-semibold text-[#C86010]">
          No tienes permisos para acceder a este módulo. Solo administradores pueden gestionar empresas.
        </p>
      </div>
    );
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    loadEmpresas();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedEmpresa(undefined);
    loadEmpresas();
  };

  const handleEdit = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setIsEditModalOpen(true);
  };

  const handleDelete = (empresa: Empresa) => {
    // TODO: Implement delete when backend mutation is available
    console.log("Delete feature coming soon for:", empresa.id);
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-[#F2C8BE] bg-[#FFF1EE] p-4">
          <p className="text-sm font-semibold text-[#C86010]">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDE8E2] pb-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">
            Empresas
          </h1>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Nueva Empresa
        </Button>
      </div>

      {/* Stats */}
      {!error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-lg border border-[#DDE8E2] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Total de Empresas
            </p>
            <p className="mt-3 text-3xl font-black text-[#17251F]">{empresas.length}</p>
          </article>

          <article className="rounded-lg border border-[#DDE8E2] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Activas
            </p>
            <p className="mt-3 text-3xl font-black text-[#0F6E2E]">
              {empresas.length}
            </p>
          </article>

          <article className="rounded-lg border border-[#DDE8E2] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Última actualización
            </p>
            <p className="mt-3 text-sm font-semibold text-[#17251F]">
              Hoy
            </p>
          </article>
        </div>
      )}

      {/* Error State with Retry */}
      {error && (
        <div className="rounded-lg border border-[#DDE8E2] bg-white p-8">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <p className="text-lg font-bold text-[#17251F]">Oops, algo salió mal</p>
            <p className="text-sm text-[#6B7F75]">{error}</p>
            <Button 
              onClick={() => loadEmpresas()}
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* Table / Cards */}
      {!error && (
        <>
          <EmpresasTable
            empresas={empresas}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
          <EmpresasCards
            empresas={empresas}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </>
      )}

      {/* Modals */}
      <CreateEmpresaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        token={token}
      />

      <EditEmpresaModal
        isOpen={isEditModalOpen}
        empresa={selectedEmpresa}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmpresa(undefined);
        }}
        onSuccess={handleEditSuccess}
        token={token}
      />
    </div>
  );
}
