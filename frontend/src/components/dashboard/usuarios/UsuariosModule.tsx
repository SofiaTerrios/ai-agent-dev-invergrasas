"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormError from "@/components/ui/FormError";
import {
  connectionNodes,
  graphqlRequest,
  PAGE_SIZE,
  type Connection,
  type PageInfo,
} from "@/lib/graphql";
import { getSession } from "@/lib/session";
import { puede, rolLabel } from "@/lib/permisos";
import {
  DESACTIVAR_USUARIO_MUTATION,
  GET_USUARIOS_QUERY,
  REACTIVAR_USUARIO_MUTATION,
  RESTABLECER_PASSWORD_MUTATION,
  type Usuario,
} from "@/graphql/usuarios";
import UsuarioFormModal from "./UsuarioFormModal";

type Dialog =
  | { tipo: "form"; usuario?: Usuario }
  | { tipo: "estado"; usuario: Usuario }
  | { tipo: "password"; usuario: Usuario }
  | null;

const th = "px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-[#7D8E86]";
const actionClass = "text-xs font-semibold hover:underline disabled:opacity-50";

function EstadoBadge({ usuario }: { usuario: Usuario }) {
  return usuario.activo ? (
    <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[11px] font-semibold text-[#0F6E56]">
      Activo
    </span>
  ) : (
    <span className="rounded-full bg-[#FFF1EE] px-2 py-0.5 text-[11px] font-semibold text-[#C86010]">
      Desactivado
    </span>
  );
}

export default function UsuariosModule() {
  const router = useRouter();
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const token = session?.token;
  const puedeGestionar = puede(session?.user.rol, "usuarios", "gestionar");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ endCursor: null, hasNextPage: false });
  const [totalCount, setTotalCount] = useState(0);
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogError, setDialogError] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");

  useEffect(() => {
    if (session && !puedeGestionar) router.replace("/dashboard");
  }, [session, puedeGestionar, router]);

  // Loads the first page, or appends the next one when `after` is given.
  const fetchUsuarios = useCallback(
    (after?: string) =>
      graphqlRequest<{ usuarios: Connection<Usuario> }>(
        GET_USUARIOS_QUERY,
        { first: PAGE_SIZE, after, incluirInactivos },
        token,
      )
        .then((data) => {
          const page = connectionNodes(data.usuarios);
          setUsuarios((prev) => (after ? [...prev, ...page] : page));
          setPageInfo(data.usuarios.pageInfo);
          setTotalCount(data.usuarios.totalCount);
          setError("");
        })
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Error al cargar usuarios"),
        )
        .finally(() => {
          setIsLoading(false);
          setIsLoadingMore(false);
        }),
    [token, incluirInactivos],
  );

  useEffect(() => {
    if (puedeGestionar && token) void fetchUsuarios();
  }, [puedeGestionar, token, fetchUsuarios]);

  const reload = () => {
    setIsLoading(true);
    void fetchUsuarios();
  };

  const closeDialog = () => {
    setDialog(null);
    setDialogError("");
    setNuevaPassword("");
  };

  const runDialogAction = async (action: () => Promise<unknown>) => {
    setDialogLoading(true);
    setDialogError("");
    try {
      await action();
      closeDialog();
      reload();
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setDialogLoading(false);
    }
  };

  if (!session) return null;

  if (!puedeGestionar) {
    return (
      <div className="rounded-lg border border-[#F2C8BE] bg-[#FFF1EE] p-8">
        <p className="text-sm font-semibold text-[#C86010]">
          No tienes permisos para acceder a este módulo. Solo el Super Administrador gestiona
          usuarios.
        </p>
      </div>
    );
  }

  const acciones = (usuario: Usuario) => {
    const esUnoMismo = usuario.id === session.user.id;
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={`${actionClass} text-[#0F6E2E]`}
          onClick={() => setDialog({ tipo: "form", usuario })}
        >
          Editar
        </button>
        <button
          type="button"
          className={`${actionClass} text-[#2F6FB0]`}
          onClick={() => setDialog({ tipo: "password", usuario })}
        >
          Contraseña
        </button>
        <button
          type="button"
          className={`${actionClass} ${usuario.activo ? "text-[#D63A2F]" : "text-[#0F6E2E]"}`}
          onClick={() => setDialog({ tipo: "estado", usuario })}
          disabled={esUnoMismo && usuario.activo}
          title={esUnoMismo && usuario.activo ? "No puedes desactivar tu propio usuario" : undefined}
        >
          {usuario.activo ? "Desactivar" : "Reactivar"}
        </button>
      </div>
    );
  };

  const empresasLabel = (usuario: Usuario) =>
    usuario.empresas.map((empresa) => empresa.razon_social).join(", ") || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#DDE8E2] pb-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17251F] md:text-4xl">
            Usuarios
          </h1>
        </div>
        <div className="md:w-48">
          <Button onClick={() => setDialog({ tipo: "form" })}>+ Nuevo usuario</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6B7F75]">
          {totalCount} {incluirInactivos ? "usuarios en total" : "usuarios activos"}
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#17251F]">
          <input
            type="checkbox"
            checked={incluirInactivos}
            onChange={(e) => {
              setIsLoading(true);
              setIncluirInactivos(e.target.checked);
            }}
            className="h-4 w-4 accent-[#0F6E2E]"
          />
          Mostrar desactivados
        </label>
      </div>

      {error ? (
        <div className="rounded-lg border border-[#F2C8BE] bg-[#FFF1EE] p-4">
          <p className="text-sm font-semibold text-[#C86010]">{error}</p>
        </div>
      ) : isLoading ? (
        <p className="py-12 text-center text-sm font-medium text-[#6B7F75]">Cargando usuarios...</p>
      ) : usuarios.length === 0 ? (
        <p className="rounded-lg border border-[#DDE8E2] bg-white py-12 text-center text-sm text-[#6B7F75]">
          No hay usuarios para mostrar.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-[#DDE8E2] bg-white md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#DDE8E2] bg-[#F8FBF9]">
                  <th className={th}>Usuario</th>
                  <th className={th}>Rol</th>
                  <th className={th}>Empresas</th>
                  <th className={th}>Estado</th>
                  <th className={th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-[#DDE8E2] last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#17251F]">{usuario.nombre}</p>
                      <p className="text-xs text-[#6B7F75]">{usuario.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#345247]">{rolLabel(usuario.rol)}</td>
                    <td className="max-w-[240px] px-4 py-3 text-sm text-[#6B7F75]">
                      {empresasLabel(usuario)}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge usuario={usuario} />
                    </td>
                    <td className="px-4 py-3">{acciones(usuario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {usuarios.map((usuario) => (
              <article
                key={usuario.id}
                className="space-y-2 rounded-lg border border-[#DDE8E2] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#17251F]">{usuario.nombre}</p>
                    <p className="truncate text-xs text-[#6B7F75]">{usuario.email}</p>
                  </div>
                  <EstadoBadge usuario={usuario} />
                </div>
                <p className="text-xs text-[#345247]">
                  {rolLabel(usuario.rol)} · {empresasLabel(usuario)}
                </p>
                {acciones(usuario)}
              </article>
            ))}
          </div>

          {pageInfo.hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                className="w-auto px-8"
                isLoading={isLoadingMore}
                onClick={() => {
                  setIsLoadingMore(true);
                  void fetchUsuarios(pageInfo.endCursor ?? undefined);
                }}
              >
                Cargar más ({usuarios.length} de {totalCount})
              </Button>
            </div>
          )}
        </>
      )}

      {dialog?.tipo === "form" && (
        <UsuarioFormModal
          key={dialog.usuario?.id ?? "nuevo"}
          usuario={dialog.usuario}
          token={token}
          onClose={closeDialog}
          onSuccess={() => {
            closeDialog();
            reload();
          }}
        />
      )}

      {(dialog?.tipo === "estado" || dialog?.tipo === "password") && (
        <>
          <div className="fixed inset-0 z-40 bg-[#17251F]/50" onClick={closeDialog} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-4 rounded-lg border border-[#DDE8E2] bg-white p-6 shadow-lg">
              {dialog.tipo === "estado" ? (
                <>
                  <h2 className="text-lg font-bold text-[#17251F]">
                    {dialog.usuario.activo ? "Desactivar usuario" : "Reactivar usuario"}
                  </h2>
                  <p className="text-sm text-[#6B7F75]">
                    {dialog.usuario.activo
                      ? `${dialog.usuario.nombre} no podrá iniciar sesión. Sus registros se conservan.`
                      : `${dialog.usuario.nombre} podrá volver a iniciar sesión.`}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-[#17251F]">Restablecer contraseña</h2>
                  <p className="text-sm text-[#6B7F75]">
                    {dialog.usuario.nombre} deberá cambiarla al ingresar.
                  </p>
                  <Input
                    id="nueva-password"
                    type="text"
                    autoComplete="off"
                    label="Contraseña temporal"
                    placeholder="Mínimo 6 caracteres"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                  />
                </>
              )}
              <FormError message={dialogError} />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={closeDialog} disabled={dialogLoading}>
                  Cancelar
                </Button>
                <Button
                  isLoading={dialogLoading}
                  disabled={dialog.tipo === "password" && nuevaPassword.length < 6}
                  onClick={() => {
                    const { usuario } = dialog;
                    void runDialogAction(() =>
                      dialog.tipo === "password"
                        ? graphqlRequest(
                            RESTABLECER_PASSWORD_MUTATION,
                            { id: usuario.id, password: nuevaPassword },
                            token,
                          )
                        : graphqlRequest(
                            usuario.activo
                              ? DESACTIVAR_USUARIO_MUTATION
                              : REACTIVAR_USUARIO_MUTATION,
                            { id: usuario.id },
                            token,
                          ),
                    );
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
