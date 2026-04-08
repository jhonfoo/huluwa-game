"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/products", label: "分类", icon: "📂" },
  { href: "/sell", label: "代售", icon: "💰" },
  { href: "/cart", label: "购物车", icon: "🛒" },
  { href: "/user", label: "我的", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-[600px] mx-auto">
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className={`flex flex-col items-center justify-center w-full h-full text-xs ${active ? "text-[#07C160]" : "text-gray-500"}`}>
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
