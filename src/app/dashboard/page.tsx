"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ totalOrders: 0, completedOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-center py-8 text-gray-400">加载中...</p>;

  const cards = [
    { label: "总订单数", value: stats.totalOrders },
    { label: "已完成订单", value: stats.completedOrders },
    { label: "总收入", value: `¥${stats.totalRevenue.toFixed(2)}` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 text-sm mb-2">{c.label}</p>
          <p className="text-2xl font-bold text-[#07C160]">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
