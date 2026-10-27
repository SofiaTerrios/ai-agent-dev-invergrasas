import { redirect } from "next/navigation";

// Pedidos became movimientos de entrega (IG-39): old links land on Entregas
export default function PedidosPage() {
  redirect("/dashboard/entregas");
}
