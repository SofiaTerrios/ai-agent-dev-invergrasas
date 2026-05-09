"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
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
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "transparent" : "white",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        padding: scrolled ? "12px 0" : "20px 0",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.jpg" alt="Invergrasas" width={40} height={40} />
          <span className="text-xl font-bold text-[#D4A017]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Invergrasas
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Inicio", "Quiénes somos", "Productos", "Contacto"].map((link) => (
            <a
              key={link}
              href={link === "Productos" ? "#productos" : link === "Contacto" ? "#contacto" : "#"}
              className="text-sm font-medium text-black hover:text-[#D4A017] transition-colors"
            >
              {link}
            </a>
          ))}
        
          <Link
            href="/login"
            className="px-5 py-2 rounded-full bg-[#D4A017] text-[#1a1a1a] text-sm font-bold hover:bg-[#C8880A] transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </nav>
  );
}
