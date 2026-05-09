import type { ReactNode } from "react";
import Link from "next/link";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7FBF4] to-[#F6F5E9] px-4 py-10">
      <div className="mx-auto w-full max-w-md pt-20">
        <Link
          href="/"
          className="mb-6 inline-block rounded-md text-lg font-semibold text-[#0F6E2E] transition hover:text-[#1A8A3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
        </Link>
        <div className="rounded-2xl border border-[#DFE9DF] bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
