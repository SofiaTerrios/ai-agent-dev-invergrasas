"use client";

import { useEffect, useState } from "react";

type HeroSlide = {
  id: number;
  tag: string;
  title: string;
  description: string;
  accent: string;
  gradient: string;
};

const SLIDES: HeroSlide[] = [
  {
    id: 1,
    tag: "Operación",
    title: "Control diario de pedidos y despachos",
    description: "Supervisa entregas activas y detecta cuellos de botella en segundos.",
    accent: "#D4A017",
    gradient: "from-[#0a3d1a] via-[#0F6E2E] to-[#1a5c10]",
  },
  {
    id: 2,
    tag: "Comercial",
    title: "Ventas por cliente y producto",
    description: "Consulta tendencias de RBD, Oleína y empaques para decisiones más rápidas.",
    accent: "#C86010",
    gradient: "from-[#2a1a00] via-[#6b3a0a] to-[#3d2200]",
  },
  {
    id: 3,
    tag: "Planeación",
    title: "Inventario y entregas sincronizados",
    description: "Prioriza pedidos por fecha y minimiza retrasos en la operación diaria.",
    accent: "#1A8A3A",
    gradient: "from-[#041a0e] via-[#0a4d20] to-[#0d3318]",
  },
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = SLIDES[active];

  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${slide.gradient} p-7 md:p-10`}>
      <div className="relative z-10 max-w-3xl">
        <span
          className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white"
          style={{ borderColor: slide.accent }}
        >
          {slide.tag}
        </span>
        <h1
          className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {slide.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 md:text-base">
          {slide.description}
        </p>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {SLIDES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir al slide ${index + 1}`}
              onClick={() => setActive(index)}
              className="h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                width: active === index ? 28 : 10,
                backgroundColor: active === index ? slide.accent : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
        <div className="text-xs font-medium text-white/80">Resumen operativo en tiempo real</div>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white blur-3xl" />
        <div className="absolute -bottom-8 left-1/2 h-40 w-40 rounded-full bg-white blur-3xl" />
      </div>
    </section>
  );
}
