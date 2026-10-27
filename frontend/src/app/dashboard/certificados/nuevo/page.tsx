import { Suspense } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import NuevoCertificado from "../components/NuevoCertificado";

export default function NuevoCertificadoPage() {
  return (
    <DashboardLayout>
      {/* NuevoCertificado reads ?reemplaza= with useSearchParams */}
      <Suspense fallback={null}>
        <NuevoCertificado />
      </Suspense>
    </DashboardLayout>
  );
}
