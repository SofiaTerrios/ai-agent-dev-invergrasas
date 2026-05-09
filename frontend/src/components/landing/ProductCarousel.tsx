"use client";

import { useState, useRef, MouseEvent } from "react";
import OilDrop from "./OilDrop";

const PRODUCTS = [
  {
    id: 1,
    name: "Oleína de Palma",
    tag: "Fritura industrial",
    desc: "Fracción líquida de aceite de palma con alto contenido de ácidos grasos insaturados. Ideal para frituras continuas, resistente a la oxidación.",
    specs: ["Punto de humo: 235°C", "Índice de yodo: 56–62", "Color Lovibond: 3R max"],
    color: "from-[#f8dd8a] via-[#d4a017] to-[#c86010]",
    badge: "#D4A017",
  },
  {
    id: 2,
    name: "Aceite RBD de Palma",
    tag: "Uso alimentario",
    desc: "Aceite refinado, blanqueado y desodorizado. Neutro en sabor y olor, con excelentes propiedades para margarinas y shortenings.",
    specs: ["Humedad: ≤0.1%", "Acidez libre: ≤0.1%", "Peróxidos: ≤2 meq/kg"],
    color: "from-[#fce97a] via-[#c8880a] to-[#a84800]",
    badge: "#C86010",
  },
];

export default function ProductCarousel() {
  const [active, setActive] = useState(0);
  const dragStart = useRef<number | null>(null);

  const prev = () => setActive((a) => (a - 1 + PRODUCTS.length) % PRODUCTS.length);
  const next = () => setActive((a) => (a + 1) % PRODUCTS.length);

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    dragStart.current = e.clientX;
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (dragStart.current !== null && Math.abs(e.clientX - dragStart.current) > 5) {
      e.currentTarget.dataset.dragging = "true";
    }
  };

  const onMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const diff = e.clientX - dragStart.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0) next();
      else prev();
    }
    dragStart.current = null;
  };

  const p = PRODUCTS[active];

  return (
    <section id="productos" className="py-24 bg-[#F9F6F0]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-[#1A8A3A] uppercase mb-3">Portafolio</p>
          <h2 className="text-5xl text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Nuestros productos
          </h2>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-3 justify-center mb-10 flex-wrap">
          {PRODUCTS.map((prod, i) => (
            <button
              key={prod.id}
              onClick={() => setActive(i)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300"
              style={{
                background: i === active ? prod.badge : "transparent",
                color: i === active ? "#fff" : "#666",
                border: `2px solid ${i === active ? prod.badge : "#ddd"}`,
              }}
            >
              {prod.name}
            </button>
          ))}
        </div>

        {/* Main card */}
        <div
          className="select-none cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => {
            dragStart.current = null;
          }}
        >
          <div
            key={active}
            className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl"
            style={{ animation: "slideInCard 0.5s cubic-bezier(0.25,1,0.5,1) both" }}
          >
            {/* Visual side */}
            <div
              className={`relative flex items-center justify-center p-12 bg-gradient-to-br ${p.color}`}
              style={{ minHeight: 380 }}
            >
              <div style={{ animation: "dropIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                <OilDrop
                  colors={[
                    p.color.includes("f8dd8a") ? "#f8dd8a" : p.color.includes("fce97a") ? "#fce97a" : p.color.includes("c8f0a0") ? "#c8f0a0" : p.color.includes("fce197") ? "#fce197" : "#f0d8b8",
                    p.color.includes("d4a017") ? "#d4a017" : p.color.includes("c8880a") ? "#c8880a" : p.color.includes("3a9a20") ? "#3a9a20" : p.color.includes("e0a820") ? "#e0a820" : "#c09060",
                    p.color.includes("c86010") ? "#c86010" : p.color.includes("a84800") ? "#a84800" : p.color.includes("0f6e2e") ? "#0f6e2e" : p.color.includes("b87010") ? "#b87010" : "#806040",
                  ]}
                  size={220}
                />
              </div>
              <div
                className="absolute top-6 left-6 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
              >
                {p.tag}
              </div>

              {/* Nav arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all text-lg"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all text-lg"
              >
                ›
              </button>
            </div>

            {/* Info side */}
            <div className="bg-white p-10 flex flex-col justify-center">
              <div
                className="text-xs font-bold tracking-[0.2em] uppercase mb-3"
                style={{ color: p.badge }}
              >
                {p.tag}
              </div>
              <h3
                className="text-4xl mb-4 text-[#1a1a1a]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {p.name}
              </h3>
              <p className="text-[#666] leading-7 mb-6 text-[15px]">{p.desc}</p>

              <div className="mb-8">
                <p className="text-xs font-bold tracking-widest uppercase text-[#999] mb-3">Especificaciones técnicas</p>
                <div className="space-y-2">
                  {p.specs.map((sp) => (
                    <div key={sp} className="flex items-center gap-2 text-sm text-[#444]">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.badge }} />
                      {sp}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href="#contacto"
                  className="px-6 py-3 rounded-full font-bold text-sm text-white transition-transform hover:scale-105"
                  style={{ background: p.badge }}
                >
                  Solicitar muestra
                </a>
                <a
                  href="#contacto"
                  className="px-6 py-3 rounded-full font-bold text-sm border-2 transition-all hover:bg-gray-50"
                  style={{ borderColor: p.badge, color: p.badge }}
                >
                  Ficha técnica
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {PRODUCTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="rounded-full transition-all"
              style={{
                width: i === active ? 28 : 8,
                height: 8,
                background: i === active ? "#0F6E2E" : "#ccc",
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes slideInCard {
            from { opacity: 0; transform: translateX(40px) scale(0.97); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }
          @keyframes dropIn {
            from { opacity: 0; transform: scale(0.4) translateY(-30px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </section>
  );
}
