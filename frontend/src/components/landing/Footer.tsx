"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import { usePathname } from "next/navigation";

const PRODUCTS = [
  { id: 1, name: "Oleína de Palma" },
  { id: 2, name: "Aceite RBD de Palma" },
  { id: 3, name: "Grasa Vegetal Hidrogenada" },
  { id: 4, name: "Oleína de Palma Super" },
  { id: 5, name: "Grasa Animal Refinada" },
];

export default function Footer() {
   const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    useEffect(() => {
      if (pathname.startsWith("/dashboard")) return;
      const onScroll = () => setScrolled(window.scrollY > 60);
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }, [pathname]);
  
    // No mostrar navbar en rutas de dashboard
    if (pathname.startsWith("/dashboard")) {
      return null;
    }
  return (
    <footer id="contacto" className="bg-[#0a2e12] text-white pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Logo />
              <span className="text-2xl text-[#D4A017] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Invergrasas
              </span>
            </div>
            <p className="text-white/60 text-sm leading-7 max-w-xs">
              Compra y venta de grasas animales y vegetales. Distribuidora líder en Colombia con cobertura nacional.
            </p>
          </div>

          <div>
            <p className="font-bold text-sm mb-4 tracking-widest uppercase text-[#D4A017]">Productos</p>
            <ul className="space-y-2 text-white/60 text-sm">
              {PRODUCTS.map((p) => (
                <li key={p.id}>
                  <a href="#productos" className="hover:text-[#D4A017] transition-colors">
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-bold text-sm mb-4 tracking-widest uppercase text-[#D4A017]">Contacto</p>
            <div className="space-y-2 text-white/60 text-sm">
              <p>📧 comercial@invergrasas.com</p>
              <p>📞 +57 300 000 0000</p>
              <p>📍 Bogotá, Colombia</p>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} Invergrasas · Todos los derechos reservados
        </div>
      </div>
    </footer>
  );
}
