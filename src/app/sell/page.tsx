"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Category {
  id: string;
  name: string;
}

export default function SellPage() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    gameServer: "",
    gameAccount: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "发布失败");
        return;
      }
      router.push("/user");
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 text-center font-bold border-b border-gray-100">
        发布商品
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">商品标题</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="请输入商品标题"
            className="w-full h-11 border border-gray-300 rounded px-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">商品描述</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            placeholder="请详细描述商品信息"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">价格（元）</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={handleChange}
            required
            placeholder="0.00"
            className="w-full h-11 border border-gray-300 rounded px-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">商品分类</label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            required
            className="w-full h-11 border border-gray-300 rounded px-3 text-sm bg-white"
          >
            <option value="">请选择分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">游戏区服</label>
          <input
            name="gameServer"
            value={form.gameServer}
            onChange={handleChange}
            placeholder="请输入游戏区服"
            className="w-full h-11 border border-gray-300 rounded px-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">游戏账号</label>
          <input
            name="gameAccount"
            value={form.gameAccount}
            onChange={handleChange}
            placeholder="请输入游戏账号"
            className="w-full h-11 border border-gray-300 rounded px-3 text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 bg-[#07C160] text-white rounded font-bold text-sm disabled:opacity-50"
        >
          {submitting ? "发布中..." : "立即发布"}
        </button>
      </form>
    </div>
  );
}
