"use client";

import Navbar from "@/components/landing/Navbar";
import HeroSlider from "@/components/landing/HeroSlider";
import StatsBar from "@/components/landing/StatsBar";
import QuienesSomos from "@/components/landing/QuienesSomos";
import Cualidades from "@/components/landing/Cualidades";
import ProductCarousel from "@/components/landing/ProductCarousel";
import Footer from "@/components/landing/Footer";

export default function InverGrasasLanding() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[#3A3A3A]">
        <Navbar />
        <HeroSlider />
        <StatsBar />
        <QuienesSomos />
        <Cualidades />
        <ProductCarousel />
      </div>
    </>
  );
}
