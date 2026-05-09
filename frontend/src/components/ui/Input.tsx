import type { InputHTMLAttributes } from "react";
import FormError from "./FormError";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
};

export default function Input({ id, label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[#1B4D1E]">
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border border-[#CFE0D2] bg-white px-3 py-2.5 text-[#3A3A3A] shadow-sm transition placeholder:text-[#7A7A7A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017] ${error ? "border-red-500" : ""} ${className ?? ""}`}
      />
      <FormError id={`${id}-error`} message={error} />
    </div>
  );
}
