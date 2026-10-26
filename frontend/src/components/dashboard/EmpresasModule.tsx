"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CreateEmpresaModal from "./modals/CreateEmpresaModal";
import EditEmpresaModal from "./modals/EditEmpresaModal";
import EmpresasTable from "./EmpresasTable";
import EmpresasCards from "./EmpresasCards";
import Button from "@/components/ui/Button";
import {
  connectionNodes,
  graphqlRequest,
  PAGE_SIZE,
  type Connection,
  type PageInfo,
} from "@/lib/graphql";
import { GET_EMPRESAS_QUERY, type Empresa } from "@/graphql/empresas";
import { getSession } from "@/lib/session";
import { puede } from "@/lib/permisos";

export default function EmpresasModule() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ endCursor: null, hasNextPage: false });
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
  const isAdmin = puede(user?.rol, "empresas", "editar");
  const puedeCrear = puede(user?.rol, "empresas", "crear");

  // Redirect if the role cannot manage empresas
  useEffect(() => {
    if (session && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
  }, [session, isAdmin, router]);

  // Loads the first page, or appends the next one when `after` is given.
  // State is only set in promise callbacks, so it can run from an effect.
  const fetchEmpresas = useCallback(
    (after?: string) =>
      graphqlRequest<{ empresas: Connection<Empresa> }>(
        GET_EMPRESAS_QUERY,
        { first: PAGE_SIZE, after },
        token,
      )
        .then((data) => {
          const page = connectionNodes(data.empresas);
          setEmpresas((prev) => (after ? [...prev, ...page] : page));
          setPageInfo(data.empresas.pageInfo);
          setTotalCount(data.empresas.totalCount);
        })
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : "Error al cargar empresas";
          console.error("Error loading empresas:", errorMessage);
      
          if (errorMessage.includes("Invalid token") || errorMessage.includes("Unauthorized")) {
            setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
            setTimeout(() => router.push("/login"), 2000);
          } else {
            setError(errorMessage);
          }
        })
        .finally(() => {
          setIsLoading(false);
          setIsLoadingMore(false);
        }),
    [token, router],
  );

  const loadEmpresas = (after?: string) => {
    if (!token) {
      setError("Token no disponible. Por favor, inicia sesión nuevamente.");
      setIsLoading(false);
      return;
    }
    if (after) setIsLoadingMore(true);
    else setIsLoading(true);
    setError("");
    void fetchEmpresas(after);
  };

  useEffect(() => {
    if (isAdmin && token) {
      void fetchEmpresas();
    }
  }, [isAdmin, token, fetchEmpresas]);

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
        {puedeCrear && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            + Nueva Empresa
          </Button>
        )}
      </div>

      {/* Stats */}
      {!error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-lg border border-[#DDE8E2] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Total de Empresas
            </p>
            <p className="mt-3 text-3xl font-black text-[#17251F]">{totalCount}</p>
          </article>

          <article className="rounded-lg border border-[#DDE8E2] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Activas
            </p>
            <p className="mt-3 text-3xl font-black text-[#0F6E2E]">
              {totalCount}
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
          {pageInfo.hasNextPage && !isLoading && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => loadEmpresas(pageInfo.endCursor ?? undefined)}
                isLoading={isLoadingMore}
                className="w-auto px-8"
              >
                Cargar más ({empresas.length} de {totalCount})
              </Button>
            </div>
          )}
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
