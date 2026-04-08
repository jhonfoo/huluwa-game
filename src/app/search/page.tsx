"use client";
import { useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  images: string;
  sales: number;
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProducts(data.products || []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-gray-50">
      {/* 搜索栏 */}
      <form onSubmit={doSearch} className="bg-white px-3 py-2 flex items-center gap-2 border-b border-gray-100">
        <Link href="/" className="text-gray-500 text-sm shrink-0">← 返回</Link>
        <input
          autoFocus
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索游戏商品..."
          className="flex-1 bg-gray-100 rounded px-3 py-1.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#07C160] text-white text-sm px-3 py-1.5 rounded shrink-0"
        >
          搜索
        </button>
      </form>

      {/* 搜索结果 */}
      {loading && (
        <div className="text-center text-gray-400 text-sm py-10">搜索中...</div>
      )}

      {!loading && searched && products.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-10">暂无搜索结果</div>
      )}

      {products.length > 0 && (
        <div className="p-2 grid grid-cols-2 gap-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="bg-white border border-gray-100 rounded overflow-hidden"
            >
              <div className="h-36 bg-gray-100 flex items-center justify-center text-4xl">🎮</div>
              <div className="p-2">
                <p className="text-xs line-clamp-2 h-8">{p.title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[#07C160] text-xs">¥</span>
                  <span className="text-[#07C160] font-bold text-sm">{p.price}</span>
                  {p.originalPrice > p.price && (
                    <span className="text-gray-400 text-xs line-through">¥{p.originalPrice}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{p.sales}人付款</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
