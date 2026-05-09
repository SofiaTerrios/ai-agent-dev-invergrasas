"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setMessage("Ingresa un email para continuar.");
      return;
    }
    setMessage(
      "La recuperacion de contraseña aun no esta disponible en backend. Contacta al administrador.",
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1
          className="text-3xl text-[#0F6E2E]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-sm text-[#4E4E4E]">
          Te avisaremos cuando esta funcionalidad este activa.
        </p>
      </div>

      <Input
        id="forgot-email"
        name="forgot-email"
        type="email"
        autoComplete="email"
        label="Correo electronico"
        placeholder="usuario@empresa.com"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setMessage("");
        }}
      />

      {message ? (
        <p role="status" aria-live="polite" className="text-sm text-[#1B4D1E]">
          {message}
        </p>
      ) : null}

      <Button type="submit" variant="secondary">
        Solicitar recuperacion
      </Button>

      <p className="text-sm">
        <Link
          href="/login"
          className="font-medium text-[#0F6E2E] hover:text-[#1A8A3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]"
        >
          Volver a iniciar sesion
        </Link>
      </p>
    </form>
  );
}
