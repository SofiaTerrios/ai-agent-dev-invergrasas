"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CreateClienteModal from "./modals/CreateClienteModal";
import EditClienteModal from "./modals/EditClienteModal";
import ClientesTable from "./ClientesTable";
import ClientesCards from "./ClientesCards";
import Button from "@/components/ui/Button";
import { graphqlRequest } from "@/lib/graphql";
import {
  GET_CLIENTES_QUERY,
  DELETE_CLIENTE_MUTATION,
  type Cliente,
} from "@/graphql/clientes";
import { getSession } from "@/lib/session";

export default function ClientesModule() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();
  const [error, setError] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<Cliente | null>(null);
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

  // Load clientes
  const loadClientes = useCallback(async () => {
    if (!token) {
      setError("Token no disponible. Por favor, inicia sesión nuevamente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<{ clientes: Cliente[] }>(
        GET_CLIENTES_QUERY,
        undefined,
        token
      );
      setClientes(data.clientes || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al cargar clientes";
      console.error("Error loading clientes:", errorMessage);

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
      loadClientes();
    }
  }, [isAdmin, token, loadClientes]);

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
          No tienes permisos para acceder a este módulo. Solo administradores pueden gestionar clientes.
        </p>
      </div>
    );
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    loadClientes();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedCliente(undefined);
    loadClientes();
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsEditModalOpen(true);
  };

  const handleDelete = (cliente: Cliente) => {
    setDeleteConfirm(cliente);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !token) return;

    try {
      await graphqlRequest(
        DELETE_CLIENTE_MUTATION,
        { id: deleteConfirm.id },
        token
      );
      setClientes((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting cliente:", error);
      setError(error instanceof Error ? error.message : "Error al eliminar cliente");
    }
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
            Clientes
          </h1>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Nuevo Cliente
        </Button>
      </div>

      {/* Stats */}
      {!error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-lg border border-[#DDE8E2] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Total de Clientes
            </p>
            <p className="mt-3 text-3xl font-black text-[#17251F]">{clientes.length}</p>
          </article>

          <article className="rounded-lg border border-[#DDE8E2] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]">
              Activos
            </p>
            <p className="mt-3 text-3xl font-black text-[#0F6E2E]">
              {clientes.length}
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
              onClick={() => loadClientes()}
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
          <ClientesTable
            clientes={clientes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
          <ClientesCards
            clientes={clientes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </>
      )}

      {/* Modals */}
      <CreateClienteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        token={token}
      />

      <EditClienteModal
        isOpen={isEditModalOpen}
        cliente={selectedCliente}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCliente(undefined);
        }}
        onSuccess={handleEditSuccess}
        token={token}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#17251F]/50"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg border border-[#DDE8E2] bg-white shadow-lg">
              <div className="border-b border-[#DDE8E2] px-6 py-4">
                <h2 className="text-lg font-bold text-[#17251F]">
                  Confirmar eliminación
                </h2>
              </div>

              <div className="px-6 py-4">
                <p className="text-sm text-[#6B7F75]">
                  ¿Estás seguro de que deseas eliminar el cliente{" "}
                  <strong>{deleteConfirm.nombre}</strong>?
                </p>
                <p className="mt-2 text-xs text-[#83948D]">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex gap-3 border-t border-[#DDE8E2] px-6 py-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={confirmDelete}
                  className="bg-[#D63A2F] hover:bg-[#B82E25]"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
