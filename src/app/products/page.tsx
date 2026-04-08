"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  images: string;
  sales: number;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  _count: { products: number };
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-400">加载中...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState(categoryId);
  const [products, setProducts] = useState<Product[]>([]);
  const [presetProducts, setPresetProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
    fetch("/api/preset-products")
      .then((r) => r.json())
      .then((d) => setPresetProducts(d.products || []));
  }, []);

  const fetchProducts = useCallback(
    async (p: number, catId: string, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), limit: String(limit) });
        if (catId) params.set("categoryId", catId);
        const res = await fetch(`/api/products?${params}`);
        const data = await res.json();
        setProducts((prev) => (append ? [...prev, ...(data.products || [])] : data.products || []));
        setTotal(data.total || 0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setPage(1);
    fetchProducts(1, activeCategoryId, false);
  }, [activeCategoryId, fetchProducts]);

  // 当前分类无商品时，随机展示4个预设商品
  const displayProducts = products.length > 0
    ? products
    : [...presetProducts].sort(() => Math.random() - 0.5).slice(0, 4);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next, activeCategoryId, true);
  };

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-gray-50">
      {/* 顶部标题 */}
      <div className="bg-white px-3 py-2 flex items-center border-b border-gray-100">
        <Link href="/" className="text-gray-500 text-sm mr-3">← 返回</Link>
        <span className="font-bold text-sm">全部商品</span>
      </div>

      {/* 分类横向滚动 */}
      <div className="bg-white overflow-x-auto whitespace-nowrap px-3 py-2 border-b border-gray-100">
        <button
          onClick={() => setActiveCategoryId("")}
          className={`inline-block px-3 py-1 rounded-full text-xs mr-2 ${
            activeCategoryId === ""
              ? "bg-[#07C160] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`inline-block px-3 py-1 rounded-full text-xs mr-2 ${
              activeCategoryId === cat.id
                ? "bg-[#07C160] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat.icon || "🎮"} {cat.name}
          </button>
        ))}
      </div>

      {/* 商品列表 */}
      <div className="p-2 grid grid-cols-2 gap-2">
        {displayProducts.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="bg-white border border-gray-100 rounded overflow-hidden"
          >
            <div className="aspect-square bg-gray-100 overflow-hidden">
              {p.images ? (
                <img src={p.images} alt={p.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🎮</div>
              )}
            </div>
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

      {displayProducts.length === 0 && !loading && (
        <div className="text-center text-gray-400 text-sm py-10">暂无商品</div>
      )}

      {/* 加载更多 */}
      {products.length < total && (
        <div className="px-4 py-3">
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full py-2 bg-[#07C160] text-white text-sm rounded disabled:opacity-50"
          >
            {loading ? "加载中..." : "加载更多"}
          </button>
        </div>
      )}

      {products.length > 0 && products.length >= total && (
        <div className="text-center text-gray-400 text-xs py-4">已加载全部商品</div>
      )}
    </div>
  );
}
