import ClientesModule from "@/components/dashboard/clientes/ClientesModule";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function ClientesPage() {
  return (
    <DashboardLayout>
      <ClientesModule />
    </DashboardLayout>
  );
}
