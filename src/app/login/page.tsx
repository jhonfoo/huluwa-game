"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      login(data.token, data.user);
      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch { setError("网络错误"); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-xl font-bold text-center mb-6">登录</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="tel" placeholder="手机号" value={phone} onChange={e => setPhone(e.target.value)}
          className="w-full h-11 border border-gray-300 rounded px-3 text-sm" />
        <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full h-11 border border-gray-300 rounded px-3 text-sm" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-11 bg-[#07C160] text-white rounded font-bold text-sm disabled:opacity-50">
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        请联系管理员获取账号
      </p>
    </div>
  );
}
