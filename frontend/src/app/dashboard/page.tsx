import OrdersTable from "@/components/dashboard/OrdersTable";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const metrics = [
  { title: "Pedidos activos", value: "42", icon: "▤", accent: "#0F6E2E" },
  { title: "Clientes", value: "18", icon: "◎", accent: "#1A8A3A" },
  { title: "Toneladas programadas", value: "18.4k", icon: "▥", accent: "#D4A017" },
  { title: "Entregas a tiempo", value: "96%", icon: "↗", accent: "#2F80ED" },
  { title: "Alertas de operacion", value: "3", icon: "!", accent: "#C86010" },
  { title: "Usuarios asociados", value: "56", icon: "◌", accent: "#8A4FD6" },
  { title: "Ordenes del mes", value: "27", icon: "□", accent: "#0C9EBD" },
  { title: "Ingresos estimados", value: "$2.6M", icon: "$", accent: "#B85E12" },
];

const activityItems = [
  {
    title: "Pedido #PED-230 actualizado",
    detail: "Cliente: Alimentos del Norte · Cantidad: 1.200 kg",
    time: "Hace 5 min",
  },
  {
    title: "Despacho confirmado",
    detail: "Ruta Medellin a Bogota cerrada correctamente",
    time: "Hace 24 min",
  },
  {
    title: "Nuevo pedido registrado",
    detail: "Producto Oleina · Empaque Caneca",
    time: "Hace 53 min",
  },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="border-b border-[#DDE8E2] pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7D8E86]">
                Panel de insights
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-[#17251F] md:text-6xl">
                Pulso de la <span className="text-[#0F6E2E]">operacion</span>
              </h1>
            </div>
            <div className="rounded-md border border-[#DDE8E2] bg-white px-4 py-3 text-sm font-semibold text-[#486358]">
              Equipo Comercial
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.title}
              className="min-h-40 border border-[#DDE8E2] bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7D8E86]">
                  {metric.title}
                </p>
                <span className="text-xl font-bold" style={{ color: metric.accent }}>
                  {metric.icon}
                </span>
              </div>
              <p className="mt-7 text-5xl font-black tracking-tight text-[#17251F]">
                {metric.value}
              </p>
              <p className="mt-6 text-sm font-medium text-[#6B7F75]">- Sin variacion</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
          <div id="pedidos" className="min-w-0">
            <OrdersTable />
          </div>

          <aside id="actividad" className="border border-[#DDE8E2] bg-white p-6 shadow-sm">
            <div className="mb-5 border-b border-[#EEF3F0] pb-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7D8E86]">
                Actividad reciente
              </p>
            </div>
            <ul className="space-y-4" aria-label="Actividad reciente">
              {activityItems.map((activity) => (
                <li key={activity.title} className="border border-[#EEF3F0] bg-[#FAFCFB] p-4">
                  <p className="text-sm font-bold text-[#244136]">{activity.title}</p>
                  <p className="mt-1 text-sm text-[#63766D]">{activity.detail}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8A9A93]">{activity.time}</p>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section id="reportes" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="min-h-72 border border-[#DDE8E2] bg-white shadow-sm">
            <div className="border-b border-[#EEF3F0] p-5">
              <p className="border-l-4 border-[#0F6E2E] pl-3 text-xs font-black uppercase tracking-[0.22em] text-[#7D8E86]">
                Crecimiento de clientes
              </p>
            </div>
            <div className="grid h-56 place-items-center p-6 text-sm text-[#7D8E86]">
              Grafica de crecimiento
            </div>
          </article>
          <article className="min-h-72 border border-[#DDE8E2] bg-white shadow-sm">
            <div className="border-b border-[#EEF3F0] p-5">
              <p className="border-l-4 border-[#2F80ED] pl-3 text-xs font-black uppercase tracking-[0.22em] text-[#7D8E86]">
                Ordenes por periodo
              </p>
            </div>
            <div className="grid h-56 place-items-center p-6 text-sm text-[#7D8E86]">
              Grafica de ordenes
            </div>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}
