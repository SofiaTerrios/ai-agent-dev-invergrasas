"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import { getSession, updateSessionUser } from "@/lib/session";
import { CHANGE_PASSWORD_MUTATION } from "@/graphql/usuarios";

type Values = {
  actual: string;
  nueva: string;
  confirmacion: string;
};

function validate(values: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!values.actual) errors.actual = "Ingresa tu contraseña actual.";
  if (values.nueva.length < 6) {
    errors.nueva = "La nueva contraseña debe tener mínimo 6 caracteres.";
  } else if (values.nueva === values.actual) {
    errors.nueva = "Debe ser distinta de la actual.";
  }
  if (values.confirmacion !== values.nueva) {
    errors.confirmacion = "Las contraseñas no coinciden.";
  }
  return errors;
}

export default function ChangePasswordForm() {
  const router = useRouter();
  const [session] = useState(() =>
    typeof window === "undefined" ? null : getSession(),
  );
  const [values, setValues] = useState<Values>({ actual: "", nueva: "", confirmacion: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const obligatorio = Boolean(session?.user.debe_cambiar_password);

  useEffect(() => {
    if (!session) router.replace("/login");
  }, [session, router]);

  const onChange = (field: keyof Values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      await graphqlRequest(
        CHANGE_PASSWORD_MUTATION,
        { input: { password_actual: values.actual, password_nueva: values.nueva } },
        session?.token,
      );
      updateSessionUser({ debe_cambiar_password: false });
      router.replace("/dashboard");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1
          className="text-3xl text-[#0F6E2E]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Cambiar contraseña
        </h1>
        <p className="mt-1 text-sm text-[#4E4E4E]">
          {obligatorio
            ? "Por seguridad, define una contraseña propia antes de continuar."
            : "Define una nueva contraseña para tu cuenta."}
        </p>
      </div>

      <FormError message={submitError} />

      <Input
        id="actual"
        type="password"
        autoComplete="current-password"
        label={obligatorio ? "Contraseña temporal" : "Contraseña actual"}
        value={values.actual}
        onChange={(event) => onChange("actual", event.target.value)}
        error={errors.actual}
      />
      <Input
        id="nueva"
        type="password"
        autoComplete="new-password"
        label="Nueva contraseña"
        placeholder="Mínimo 6 caracteres"
        value={values.nueva}
        onChange={(event) => onChange("nueva", event.target.value)}
        error={errors.nueva}
      />
      <Input
        id="confirmacion"
        type="password"
        autoComplete="new-password"
        label="Confirmar nueva contraseña"
        value={values.confirmacion}
        onChange={(event) => onChange("confirmacion", event.target.value)}
        error={errors.confirmacion}
      />

      <Button type="submit" isLoading={isLoading}>
        Guardar contraseña
      </Button>
    </form>
  );
}
