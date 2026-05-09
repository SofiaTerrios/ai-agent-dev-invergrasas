import type { ButtonHTMLAttributes, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  isLoading?: boolean;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#1A8A3A] text-white hover:bg-[#0F6E2E]",
  secondary:
    "bg-white text-[#0F6E2E] border border-[#1A8A3A] hover:bg-[#F2FAF4]",
};

export default function Button({
  children,
  isLoading = false,
  variant = "primary",
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017] disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className ?? ""}`}
    >
      {isLoading ? <LoadingSpinner /> : null}
      {children}
    </button>
  );
}
