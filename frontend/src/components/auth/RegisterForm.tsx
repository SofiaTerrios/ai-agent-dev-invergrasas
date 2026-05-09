"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import { graphqlRequest } from "@/lib/graphql";
import { saveSession, type SessionUser } from "@/lib/session";

type RegisterValues = {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      id
      nombre
      email
      rol
    }
  }
`;

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

function validate(values: RegisterValues) {
  const errors: Partial<Record<keyof RegisterValues, string>> = {};

  if (!values.nombre.trim()) errors.nombre = "El nombre es obligatorio.";

  if (!values.email.trim()) {
    errors.email = "El email es obligatorio.";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = "Ingresa un email valido.";
  }

  if (!values.password.trim()) {
    errors.password = "La contraseña es obligatoria.";
  } else if (values.password.length < 6) {
    errors.password = "La contraseña debe tener al menos 6 caracteres.";
  }

  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = "Confirma tu contraseña.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

export default function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterValues>({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterValues, string>>
  >({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (field: keyof RegisterValues, value: string) => {
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
      await graphqlRequest(REGISTER_MUTATION, {
        input: {
          nombre: values.nombre,
          email: values.email,
          password: values.password,
        },
      });

      const payload = await graphqlRequest<{
        login: {
          access_token: string;
          user: SessionUser;
        };
      }>(LOGIN_MUTATION, {
        input: {
          email: values.email,
          password: values.password,
        },
      });

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
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1
          className="text-3xl text-[#0F6E2E]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Crear cuenta
        </h1>
        <p className="mt-1 text-sm text-[#4E4E4E]">
          Registra tu usuario para gestionar pedidos y clientes.
        </p>
      </div>

      <FormError message={submitError} />

      <Input
        id="nombre"
        name="nombre"
        type="text"
        autoComplete="name"
        label="Nombre completo"
        placeholder="Tu nombre"
        value={values.nombre}
        onChange={(event) => onChange("nombre", event.target.value)}
        error={errors.nombre}
      />

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
        autoComplete="new-password"
        label="Contraseña"
        placeholder="Minimo 6 caracteres"
        value={values.password}
        onChange={(event) => onChange("password", event.target.value)}
        error={errors.password}
      />

      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        value={values.confirmPassword}
        onChange={(event) => onChange("confirmPassword", event.target.value)}
        error={errors.confirmPassword}
      />

      <Button type="submit" isLoading={isLoading}>
        Registrarme
      </Button>

      <p className="text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-[#0F6E2E] hover:text-[#1A8A3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]"
        >
          Inicia sesion
        </Link>
      </p>
    </form>
  );
}
