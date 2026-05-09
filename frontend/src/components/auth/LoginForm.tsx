"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import { saveSession, type SessionUser } from "@/lib/session";

type LoginValues = {
  email: string;
  password: string;
};

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      access_token
      user {
        id
        nombre
        email
        rol
      }
    }
  }
`;

function validate(values: LoginValues) {
  const errors: Partial<Record<keyof LoginValues, string>> = {};

  if (!values.email.trim()) {
    errors.email = "El email es obligatorio.";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Ingresa un email valido.";
  }

  if (!values.password.trim()) {
    errors.password = "La contraseña es obligatoria.";
  }

  return errors;
}

export default function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues, string>>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (field: keyof LoginValues, value: string) => {
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
    setSubmitError("");

    try {
      const payload = await graphqlRequest<{
        login: {
          access_token: string;
          user: SessionUser;
        };
      }>(LOGIN_MUTATION, { input: values });

      saveSession(payload.login.access_token, payload.login.user ?? {});
      router.push("/dashboard");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Error de red. Verifica tu conexion e intenta nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 " noValidate>
      <div>
        <h1
          className="text-3xl text-[#0F6E2E]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Iniciar sesion
        </h1>
        <p className="mt-1 text-sm text-[#4E4E4E]">
          Ingresa tus datos para acceder al portal.
        </p>
      </div>

      <FormError message={submitError} />

      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        label="Correo electronico"
        placeholder="usuario@empresa.com"
        value={values.email}
        onChange={(event) => onChange("email", event.target.value)}
        error={errors.email}
      />

      <Input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        label="Contraseña"
        placeholder="Tu contraseña"
        value={values.password}
        onChange={(event) => onChange("password", event.target.value)}
        error={errors.password}
      />

      <Button type="submit" isLoading={isLoading}>
        Ingresar
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="text-[#0F6E2E] hover:text-[#1A8A3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]"
        >
          Olvide mi contraseña
        </Link>
        <Link
          href="/register"
          className="text-[#0F6E2E] hover:text-[#1A8A3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]"
        >
          Crear cuenta
        </Link>
      </div>
    </form>
  );
}
