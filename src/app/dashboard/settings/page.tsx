"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { token, user, login } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (password && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password && password.length < 6) {
      setError("密码至少6位");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = {};
      if (nickname !== user?.nickname) body.nickname = nickname;
      if (password) body.password = password;

      if (Object.keys(body).length === 0) {
        setError("没有要更新的内容");
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新失败");
        return;
      }
      // Update local auth state with new nickname
      if (token && data.user) {
        login(token, { ...user!, nickname: data.user.nickname });
      }
      setMsg("更新成功");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">个人设置</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 space-y-4 max-w-md">
        <div>
          <label className="block text-sm text-gray-600 mb-1">昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">新密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="不修改请留空"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">确认密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {msg && <p className="text-green-500 text-sm">{msg}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#07C160] text-white py-2 rounded font-bold text-sm hover:bg-[#06AD56] disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存设置"}
        </button>
      </form>
    </div>
  );
}
