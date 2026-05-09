"use client";

interface CertificadoStepperProps {
  currentStep: number;
}

const steps = [
  "Tipo",
  "Cliente",
  "Lote",
  "Parámetros",
  "Vencimiento",
  "Resumen",
];

export default function CertificadoStepper({ currentStep }: CertificadoStepperProps) {
  return (
    <nav aria-label="Progreso del formulario" className="mb-10">
      <ol className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <li key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-[#1A8A3A] text-white ring-4 ring-[#F2FAF4]"
                    : isCompleted
                      ? "bg-[#DDE8E2] text-[#0F6E2E]"
                      : "bg-[#FAFCFB] text-[#7D8E86] border border-[#DDE8E2]"
                }`}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.103a.75.75 0 01.023 1.06l-8.47 8.47a.75.75 0 01-1.06 0l-3.97-3.97a.75.75 0 011.06-1.06l3.44 3.44 7.94-7.94a.75.75 0 011.06-.023z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={`hidden text-xs font-bold uppercase tracking-widest sm:block ${
                  isActive ? "text-[#1A8A3A]" : "text-[#7D8E86]"
                }`}
              >
                {label}
              </span>
              {index < steps.length - 1 && (
                <div className="hidden h-px w-4 bg-[#DDE8E2] sm:block" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
