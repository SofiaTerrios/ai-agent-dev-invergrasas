"use client";

import { useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";

const CARDS = [
  {
    num: "01",
    label: "Empresa",
    title: "Quiénes somos",
    text: "Empresa colombiana con más de 15 años distribuyendo aceites y grasas comestibles para la industria alimentaria y cárnica, con presencia nacional y estándares de trazabilidad.",
    stat: { value: "15+", unit: "años de\nexperiencia" },
    variant: "main",
  },
  {
    num: "02",
    label: "Misión",
    title: "Misión",
    text: "Garantizar calidad, continuidad de suministro y documentación confiable para cada cliente, desde el primer pedido.",
    tag: "Calidad · Confianza",
    icon: "🎯",
    variant: "light",
    accent: "#D4A017",
    tagBg: "#FFF7E0",
    tagColor: "#854F0B",
  },
  {
    num: "03",
    label: "Visión",
    title: "Visión",
    text: "Ser el aliado estratégico número uno de la industria de aceites en Colombia con innovación digital y cobertura nacional.",
    tag: "Innovación · Nacional",
    icon: "🚀",
    variant: "dark",
    accent: "#C86010",
    tagBg: "rgba(200,96,16,0.15)",
    tagColor: "#EF9F27",
  },
] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function QuienesSomos() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24" style={{ background: "#F7F4EE" }}>
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p
            className="text-xs font-bold uppercase mb-3"
            style={{ letterSpacing: "0.25em", color: "#1A8A3A" }}
          >
            Nuestra empresa
          </p>
          <h2
            className="text-5xl text-[#1a1a1a] leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Quiénes <em className="not-italic" style={{ color: "#0F6E2E", fontStyle: "italic" }}>somos</em>
          </h2>
        </motion.div>

        {/* Grid asimétrico */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto auto",
          }}
        >
          {/* Panel principal — ocupa 2 filas */}
          <motion.div
            variants={cardVariants}
            className="relative flex flex-col justify-between overflow-hidden p-12"
            style={{
              gridRow: "1 / 3",
              background: "#0F6E2E",
              minHeight: 400,
            }}
          >
            {/* Número decorativo */}
            <span
              className="absolute bottom-6 right-6 select-none pointer-events-none"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 120,
                fontWeight: 700,
                color: "rgba(255,255,255,0.08)",
                lineHeight: 1,
              }}
            >
              01
            </span>

            <div>
              <p
                className="text-xs font-bold uppercase mb-5"
                style={{ letterSpacing: "0.2em", color: "rgba(255,255,255,0.45)" }}
              >
                01 — Empresa
              </p>
              <h3
                className="text-3xl text-white mb-5"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Quiénes somos
              </h3>
              {/* Divider dorado */}
              <div className="mb-6" style={{ width: 48, height: 2, background: "#D4A017" }} />
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", lineHeight: 1.85, maxWidth: 340 }}>
                Empresa colombiana con más de 15 años distribuyendo aceites y grasas comestibles
                para la industria alimentaria y cárnica, con presencia nacional y estándares de
                trazabilidad.
              </p>
            </div>

            {/* Stat */}
            <div className="flex items-baseline gap-2 mt-10">
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 56,
                  fontWeight: 700,
                  color: "#D4A017",
                  lineHeight: 1,
                }}
              >
                15+
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                años de<br />experiencia
              </span>
            </div>
          </motion.div>

          {/* Misión */}
          <motion.div
            variants={cardVariants}
            className="flex flex-col justify-between p-9"
            style={{
              background: "#fff",
              borderLeft: "3px solid #D4A017",
            }}
          >
            <div>
              <div
                className="flex items-center justify-center rounded-full mb-6"
                style={{ width: 40, height: 40, background: "#FFF7E0" }}
              >
                <span role="img" aria-label="Misión" style={{ fontSize: 18 }}>🎯</span>
              </div>
              <p
                className="text-xs font-bold uppercase mb-4"
                style={{ letterSpacing: "0.2em", color: "#D4A017" }}
              >
                02 — Misión
              </p>
              <h3
                className="text-2xl text-[#1a1a1a] mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Misión
              </h3>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8 }}>
                Garantizar calidad, continuidad de suministro y documentación confiable para cada
                cliente, desde el primer pedido.
              </p>
            </div>
            <span
              className="inline-block mt-6 text-xs font-bold uppercase"
              style={{
                padding: "4px 10px",
                background: "#FFF7E0",
                color: "#854F0B",
                borderRadius: 4,
                letterSpacing: "0.1em",
              }}
            >
              Calidad · Confianza
            </span>
          </motion.div>

          {/* Visión */}
          <motion.div
            variants={cardVariants}
            className="flex flex-col justify-between p-9"
            style={{
              background: "#1a1a1a",
              borderLeft: "3px solid #C86010",
            }}
          >
            <div>
              <div
                className="flex items-center justify-center rounded-full mb-6"
                style={{ width: 40, height: 40, background: "rgba(200,96,16,0.15)" }}
              >
                <span role="img" aria-label="Visión" style={{ fontSize: 18 }}>🚀</span>
              </div>
              <p
                className="text-xs font-bold uppercase mb-4"
                style={{ letterSpacing: "0.2em", color: "#C86010" }}
              >
                03 — Visión
              </p>
              <h3
                className="text-2xl mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: "#fff" }}
              >
                Visión
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
                Ser el aliado estratégico número uno de la industria de aceites en Colombia con
                innovación digital y cobertura nacional.
              </p>
            </div>
            <span
              className="inline-block mt-6 text-xs font-bold uppercase"
              style={{
                padding: "4px 10px",
                background: "rgba(200,96,16,0.15)",
                color: "#EF9F27",
                borderRadius: 4,
                letterSpacing: "0.1em",
              }}
            >
              Innovación · Nacional
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}