"use client";

import Counter from "./Counter";

export default function StatsBar() {
  const stats = [
    { n: 15, s: "+", label: "años de experiencia" },
    { n: 500, s: "+", label: "clientes activos" },
    { n: 12, s: "k+", label: "toneladas mensuales" },
    { n: 100, s: "%", label: "trazabilidad" },
  ];

  return (
    <div className="bg-white-70 py-10">
      <div className="mx-auto max-w-6xl px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-4xl font-black text-[#D4A017]" style={{ fontFamily: "'Playfair Display', serif" }}>
              <Counter end={s.n} suffix={s.s} />
            </div>
            <div className="text-white/70 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
