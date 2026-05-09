"use client";

import { useState, useEffect, useCallback } from "react";
import OilDrop from "./OilDrop";

const HERO_SLIDES = [
  {
    id: 1,
    tag: "Aceite de Palma",
    headline: "La base de la industria alimentaria",
    sub: "Oleína de palma con estabilidad térmica superior para fritura industrial a gran escala.",
    accent: "#D4A017",
    bg: "from-[#0a3d1a] via-[#0F6E2E] to-[#1a5c10]",
    image: "/hero-bg.jpg",
    dropColor: "from-[#f8dd8a] via-[#d4a017] to-[#c86010]",
  },
  {
    id: 2,
    tag: "Aceite RBD",
    headline: "Refinado. Blanqueado. Perfecto.",
    sub: "Calidad certificada para aplicaciones alimentarias especializadas con trazabilidad completa.",
    accent: "#C86010",
    bg: "from-[#2a1a00] via-[#6b3a0a] to-[#3d2200]",
    image: "/hero-bg.jpg",
    dropColor: "from-[#fce97a] via-[#c8880a] to-[#a84800]",
  },
  {
    id: 3,
    tag: "Grasas Vegetales",
    headline: "Origen natural, rendimiento industrial",
    sub: "Grasas vegetales seleccionadas para la industria confitería, panadería y procesados.",
    accent: "#1A8A3A",
    bg: "from-[#041a0e] via-[#0a4d20] to-[#0d3318]",
    image: "/hero-bg.jpg",
    dropColor: "from-[#b8f0a0] via-[#2db84a] to-[#0f6e2e]",
  },
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (animating || idx === active) return;
    setActive(idx);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
    }, 700);
  }, [active, animating]);

  useEffect(() => {
    const t = setInterval(() => goTo((active + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [active, goTo]);

  const slide = HERO_SLIDES[active];

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "100vh" }}>
      {/* Background layers */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: i === active ? 1 : 0,
            backgroundImage: `url('${s.image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 1 }} />
        </div>
      ))}

      {/* Diagonal accent */}
      <div
        className="absolute -bottom-1 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom right, transparent 49%, #fff 50%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 flex items-center" style={{ minHeight: "100vh", zIndex: 2 }}>
        <div className="grid md:grid-cols-2 gap-12 items-center w-full py-24">
          <div>
            <div className="mb-4">
              <span
                key={`tag-${active}`}
                className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] text-[#D4A017] border border-[#D4A017]/30"
                style={{ animation: "fadeUp 0.6s ease both" }}
              >
                {slide.tag}
              </span>
            </div>

            <h1
              key={`h1-${active}`}
              className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
              style={{
                fontFamily: "'Playfair Display', serif",
                animation: "fadeUp 0.6s 0.1s ease both",
              }}
            >
              {slide.headline}
            </h1>

            <p
              key={`p-${active}`}
              className="text-lg text-white/70 max-w-md mb-10 leading-relaxed"
              style={{ animation: "fadeUp 0.6s 0.2s ease both" }}
            >
              {slide.sub}
            </p>

            <div
              key={`btns-${active}`}
              className="flex flex-wrap gap-4"
              style={{ animation: "fadeUp 0.6s 0.3s ease both" }}
            >
              <a
                href="#productos"
                className="px-8 py-3 rounded-full bg-[#D4A017] text-[#1a1a1a] font-bold text-sm hover:bg-[#C8880A] transition-colors"
              >
                Ver productos
              </a>
              <a
                href="#contacto"
                className="px-8 py-3 rounded-full border-2 border-white text-white font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Contactar
              </a>
            </div>

            <div className="flex gap-3 mt-12">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === active ? 28 : 8,
                    height: 8,
                    background: i === active ? "#D4A017" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Oil drop */}
          <div className="flex justify-center items-center relative">
            <div
              key={`drop-${active}`}
              className="relative"
              style={{ animation: "dropIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both, floatDrop 4s 0.7s ease-in-out infinite" }}
            >
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-40 scale-75"
                style={{ background: slide.accent }}
              />
              <OilDrop
                colors={[
                  slide.dropColor.includes("f8dd8a") ? "#f8dd8a" : slide.dropColor.includes("fce97a") ? "#fce97a" : "#c8f0a0",
                  slide.dropColor.includes("d4a017") ? "#d4a017" : slide.dropColor.includes("c8880a") ? "#c8880a" : "#3a9a20",
                  slide.dropColor.includes("c86010") ? "#c86010" : slide.dropColor.includes("a84800") ? "#a84800" : "#0f6e2e",
                ]}
                size={260}
              />
            </div>

            <div
              className="absolute top-8 -right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white text-sm"
              style={{ animation: "fadeUp 0.6s 0.5s ease both" }}
            >
              <div className="text-xs text-white/60 mb-1">Calidad</div>
              <div className="font-bold">INVIMA ✓</div>
            </div>

            <div
              className="absolute bottom-12 -left-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white text-sm"
              style={{ animation: "fadeUp 0.6s 0.6s ease both" }}
            >
              <div className="text-xs text-white/60 mb-1">Distribución</div>
              <div className="font-bold">Colombia 🇨🇴</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: scale(0.5) translateY(-40px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes floatDrop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
      `}</style>
    </section>
  );
}
