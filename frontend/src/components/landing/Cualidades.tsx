"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const CUALIDADES = [
  {
    num: "01",
    icon: "ti-leaf",
    title: "100% Natural",
    desc: "Sin aditivos artificiales ni conservantes en nuestros aceites de origen vegetal.",
    iconBg: "#EAF3DE",
    iconColor: "#3B6D11",
  },
  {
    num: "02",
    icon: "ti-rosette-discount-check",
    title: "Cert. INVIMA",
    desc: "Todos nuestros productos cuentan con registro sanitario vigente.",
    iconBg: "#EAF3DE",
    iconColor: "#3B6D11",
  },
  {
    num: "03",
    icon: "ti-truck-delivery",
    title: "Entrega puntual",
    desc: "Logística directa desde planta hacia tu operación, sin intermediarios.",
    iconBg: "#FFF7E0",
    iconColor: "#854F0B",
  },
  {
    num: "04",
    icon: "ti-file-check",
    title: "Docs. digital",
    desc: "Certificados y facturas automatizadas. Sin papel, sin demoras.",
    iconBg: "#FFF7E0",
    iconColor: "#854F0B",
  },
];

const rowVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Cualidades() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-14"
        >
          <p
            className="text-xs font-bold uppercase mb-3"
            style={{ letterSpacing: "0.25em", color: "#1A8A3A" }}
          >
            Por qué elegirnos
          </p>
          <h2
            className="text-5xl leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}
          >
            Cualidades que nos{" "}
            <em style={{ fontStyle: "italic", color: "#0F6E2E" }}>diferencian</em>
          </h2>
        </motion.div>

        {/* Feature rows */}
        <div ref={ref}>
          {CUALIDADES.map((q, i) => (
            <motion.div
              key={q.title}
              custom={i}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="group flex items-center border-t border-[#EBEBEB] py-8 last:border-b cursor-default transition-colors duration-200 hover:bg-[#FAFDF7]"
            >
              {/* Número */}
              <span
                className="w-14 flex-shrink-0 pt-1 text-xs font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#C8DCBA",
                  letterSpacing: "0.15em",
                }}
              >
                {q.num}
              </span>

              {/* Línea divisora vertical */}
              <div
                className="self-stretch w-px mx-7 flex-shrink-0 transition-colors duration-200"
                style={{ background: "#EBEBEB" }}
                // Se pinta de verde en hover — necesita JS o CSS trick
              />

              {/* Ícono */}
              <div
                className="w-13 h-13 rounded-xl flex items-center justify-center flex-shrink-0 mr-6 transition-transform duration-300 group-hover:scale-110"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: q.iconBg,
                }}
              >
                <i
                  className={`ti ${q.icon}`}
                  style={{ fontSize: 24, color: q.iconColor }}
                  aria-hidden="true"
                />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[17px] font-bold text-[#1a1a1a] mb-1"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {q.title}
                </p>
                <p className="text-sm text-[#777] leading-relaxed max-w-lg">
                  {q.desc}
                </p>
              </div>

              {/* Flecha */}
              <span
                className="ml-5 text-lg flex-shrink-0 text-[#D4D0C8] transition-all duration-200 group-hover:text-[#0F6E2E] group-hover:translate-x-1"
              >
                →
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}