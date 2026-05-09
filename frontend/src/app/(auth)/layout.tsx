import type { ReactNode } from "react";
import AuthLayout from "@/components/layouts/AuthLayout";

type Props = {
  children: ReactNode;
};

export default function AuthGroupLayout({ children }: Props) {
  return <AuthLayout>{children}</AuthLayout>;
}
