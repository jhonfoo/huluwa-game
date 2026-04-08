"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function UserPage() {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();
  const [transactionAmount, setTransactionAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setTransactionAmount(d.totalTransactionAmount ?? 0));
  }, [token]);

  if (loading) return <div className="p-6 text-center text-gray-400">加载中...</div>;
  if (!user) return null;

  const menus = [
    { label: "我的订单", href: "/orders", icon: "📋" },
    { label: "我的收藏", href: "/favorites", icon: "❤️" },
    { label: "我要卖", href: "/sell", icon: "💰" },
    { label: "资金管理", href: "#", icon: "🏦" },
    { label: "行业资讯", href: "/news", icon: "📰" },
  ];

  if (user.role === "admin") {
    menus.push({ label: "管理后台", href: "/admin", icon: "⚙️" });
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 用户信息 */}
      <div className="bg-[#07C160] text-white p-6 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">👤</div>
          <div>
            <p className="text-lg font-bold">{user.nickname}</p>
            <p className="text-sm text-orange-100">{user.phone}</p>
          </div>
        </div>
        <div className="mt-4 bg-white/10 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">交易金额</span>
          <span className="text-xl font-bold">
            {transactionAmount === null ? "..." : `¥${transactionAmount.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="bg-white mt-2 divide-y divide-gray-100">
        {menus.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-gray-300 text-sm">›</span>
          </Link>
        ))}
      </div>

      {/* 退出登录 */}
      <div className="p-4 mt-4">
        <button
          onClick={handleLogout}
          className="w-full h-11 border border-gray-300 rounded text-sm text-gray-600 active:bg-gray-100"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
