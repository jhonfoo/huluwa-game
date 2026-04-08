"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "概览", path: "/dashboard" },
  { label: "订单", path: "/dashboard/orders" },
  { label: "商品", path: "/dashboard/products" },
  { label: "设置", path: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="font-bold text-[#07C160]">卖家后台</span>
          <span className="text-sm text-gray-600">{user.nickname}</span>
          <button onClick={() => { logout(); router.replace("/login"); }} className="text-sm text-gray-400 hover:text-[#07C160]">
            退出登录
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="bg-white border-t sticky bottom-0">
        <div className="max-w-4xl mx-auto flex">
          {navItems.map((item) => {
            const active = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                  active ? "text-[#07C160] border-t-2 border-[#07C160]" : "text-gray-400"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
