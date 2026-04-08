"use client";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </AuthProvider>
  );
}
