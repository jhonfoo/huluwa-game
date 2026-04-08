"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[#07C160] text-white h-12 flex items-center px-3 max-w-[600px] mx-auto">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <img src="/logo.svg" alt="葫芦娃游戏" className="w-7 h-8" />
        <span className="font-bold text-sm">葫芦娃游戏</span>
      </Link>

      <Link href={user ? "/user" : "/login"} className="shrink-0">
        <span className="text-xl">👤</span>
      </Link>
    </header>
  );
}
