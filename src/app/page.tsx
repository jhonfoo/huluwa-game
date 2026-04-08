"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  images: string;
  sales: number;
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  _count: { products: number };
}

interface News {
  id: string;
  title: string;
  cover: string;
  views: number;
  updatedAt: string;
}

const SECTION_CATEGORIES = ["金币中心", "手机游戏", "网络游戏", "官方回收"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomePage() {
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [presetProducts, setPresetProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products/hot").then(r => r.json()).then(d => setHotProducts(d.products || []));
    fetch("/api/products/discount").then(r => r.json()).then(d => setDiscountProducts(d.products || []));
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
    fetch("/api/news?limit=3").then(r => r.json()).then(d => setNews(d.news || []));
    fetch("/api/preset-products").then(r => r.json()).then(d => setPresetProducts(d.products || []));
  }, []);

  return (
    <div>
      {/* Banner 区域 */}
      <div
        className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #05a352 0%, #07C160 50%, #3dd68c 100%)" }}
      >
        {/* 装饰圆 */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10" style={{ background: "#fff" }} />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-10" style={{ background: "#fff" }} />
        <div className="absolute top-4 right-16 w-10 h-10 rounded-full opacity-10" style={{ background: "#fff" }} />

        {/* 内容 */}
        <div className="relative px-5 pt-6 pb-8">
          {/* Logo 行 */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow">
              <img src="/logo.svg" alt="葫芦娃游戏" className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight tracking-wide">葫芦娃游戏</p>
              <p className="text-white/70 text-xs">交易平台</p>
            </div>
          </div>

          {/* 标语 */}
          <p className="text-white/90 text-sm mb-4">安全交易 · 放心买卖 · 极速到账</p>

          {/* 标签 */}
          <div className="flex gap-2">
            {["官方认证", "极速交易", "安全保障"].map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-white/90 border border-white/20">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 底部波浪 */}
        <svg viewBox="0 0 375 28" className="w-full block" style={{ marginBottom: -1 }} preserveAspectRatio="none">
          <path d="M0,14 C60,28 120,0 187,14 C254,28 314,0 375,14 L375,28 L0,28 Z" fill="#f3f4f6" />
        </svg>
      </div>

      {/* 快捷入口 */}
      <div className="bg-gray-100 pb-2">
        <div className="bg-white py-4 grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { href: "/products", icon: "📂", label: "全部分类" },
            { href: "/orders", icon: "📋", label: "我的订单" },
            { href: "/user", icon: "👤", label: "个人中心" },
            { href: "/favorites", icon: "❤️", label: "我的收藏" },
            { href: "/news", icon: "📰", label: "行业资讯" },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 游戏类别 */}
      <SectionTitle title="游戏类别" />
      <div className="bg-white py-3 grid grid-cols-4 gap-2 text-center text-sm">
        {categories.map(cat => (
          <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="flex flex-col items-center gap-1">
            <span className="text-3xl">{cat.icon || "🎮"}</span>
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>

      {/* 热卖品 */}
      <HotProducts />

      {/* 四大分类随机展示 */}
      {presetProducts.length > 0 && SECTION_CATEGORIES.map(catName => (
        <CategorySection key={catName} title={catName} products={presetProducts} />
      ))}

      {/* 限时折扣 */}
      {discountProducts.length > 0 && (
        <>
          <SectionTitle title="限时折扣" />
          <ProductGrid products={discountProducts} />
        </>
      )}

      {/* 热销排行 */}
      {hotProducts.length > 0 && (
        <>
          <SectionTitle title="热销排行" />
          <ProductGrid products={hotProducts} />
        </>
      )}

      {/* 行业资讯 */}
      {news.length > 0 && (
        <>
          <SectionTitle title="行业资讯" />
          <div className="bg-white">
            {news.map(item => (
              <Link key={item.id} href={`/news/${item.id}`} className="flex p-3 border-b border-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">浏览：{item.views}次</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategorySection({ title, products }: { title: string; products: Product[] }) {
  const [picked] = useState<Product[]>(() => shuffle(products).slice(0, 4));
  return (
    <>
      <SectionTitle title={title} />
      <div className="bg-white px-2 pb-2 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {picked.map(p => (
            <Link key={p.id} href={`/products/${p.id}`} className="w-32 border border-gray-100 rounded overflow-hidden shrink-0">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {p.images ? (
                  <img src={p.images} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img src="/logo.svg" alt="logo" className="w-12 h-12 opacity-30" />
                  </div>
                )}
              </div>
              <div className="p-1.5">
                <p className="text-xs line-clamp-2 h-7 leading-3.5">{p.title}</p>
                <p className="text-[#07C160] font-bold text-xs mt-1">¥{p.price}</p>
                <p className="text-gray-400 text-xs">{p.sales}人付款</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function HotProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    fetch("/api/preset-products")
      .then(r => r.json())
      .then(d => setProducts(d.products || []));
  }, []);
  if (products.length === 0) return null;
  return (
    <>
      <SectionTitle title="热卖品" />
      <ProductGrid products={products} />
    </>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="bg-white mt-2 border-t border-b border-gray-200 h-9 flex items-center px-3">
      <span className="border-l-3 border-[#07C160] pl-2 font-bold text-sm text-gray-600">{title}</span>
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="bg-white p-2 grid grid-cols-2 gap-2">
      {products.map(p => (
        <Link key={p.id} href={`/products/${p.id}`} className="border border-gray-100 rounded overflow-hidden">
          <div className="aspect-square bg-gray-100 overflow-hidden">
            {p.images ? (
              <img src={p.images} alt={p.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src=''; (e.target as HTMLImageElement).style.display='none'; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img src="/logo.svg" alt="logo" className="w-12 h-12 opacity-30" />
              </div>
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
  );
}
