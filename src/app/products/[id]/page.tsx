"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  description: string;
  images: string;
  sales: number;
  views: number;
  gameServer: string;
  category: { id: string; name: string };
  seller: { id: string; nickname: string; avatar: string };
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) setProduct(d.product);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const getToken = () => localStorage.getItem("token");

  const addToCart = async () => {
    const token = getToken();
    if (!token) {
      alert("请先登录");
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      alert("已加入购物车");
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const buyNow = async () => {
    const token = getToken();
    if (!token) {
      alert("请先登录");
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      router.push("/cart");
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  const toggleFavorite = async () => {
    const token = getToken();
    if (!token) {
      alert("请先登录");
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      setFavorited(data.favorited);
      alert(data.favorited ? "已收藏" : "已取消收藏");
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        加载中...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[600px] mx-auto min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-sm gap-3">
        商品不存在
        <button onClick={() => router.back()} className="text-[#07C160] text-sm">返回</button>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto min-h-screen bg-gray-50 pb-20">
      {/* 顶部返回 */}
      <div className="bg-white px-3 py-2 flex items-center border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-500 text-sm mr-3">← 返回</button>
        <span className="font-bold text-sm">商品详情</span>
      </div>

      {/* 商品图片 */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {product.images ? (
          <img src={product.images} alt={product.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🎮</div>
        )}
      </div>

      {/* 价格区域 */}
      <div className="bg-white p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[#07C160] text-lg">¥</span>
          <span className="text-[#07C160] font-bold text-2xl">{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-gray-400 text-sm line-through">¥{product.originalPrice}</span>
          )}
        </div>
        <h1 className="text-sm font-medium mt-2 leading-5">{product.title}</h1>
        <div className="flex gap-4 text-xs text-gray-400 mt-2">
          <span>{product.sales}人付款</span>
          <span>{product.views}次浏览</span>
        </div>
      </div>

      {/* 商品信息 */}
      <div className="bg-white mt-2 p-3 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-50">
          <span className="text-gray-400">分类</span>
          <span>{product.category?.name}</span>
        </div>
        {product.gameServer && (
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-400">游戏区服</span>
            <span>{product.gameServer}</span>
          </div>
        )}
        <div className="flex justify-between py-2 border-b border-gray-50">
          <span className="text-gray-400">卖家</span>
          <span>{product.seller?.nickname || "匿名卖家"}</span>
        </div>
      </div>

      {/* 商品描述 */}
      {product.description && (
        <div className="bg-white mt-2 p-3">
          <p className="text-xs text-gray-500 font-bold mb-2">商品描述</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-5">{product.description}</p>
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-[600px] mx-auto flex items-center px-3 py-2 gap-2">
          <button
            onClick={toggleFavorite}
            className="flex flex-col items-center justify-center w-14 text-xs text-gray-500"
          >
            <span className="text-lg">{favorited ? "❤️" : "🤍"}</span>
            <span>收藏</span>
          </button>
          <button
            onClick={addToCart}
            className="flex-1 py-2 bg-[#07C160] text-white text-sm rounded"
          >
            加入购物车
          </button>
          <button
            onClick={buyNow}
            className="flex-1 py-2 bg-[#07C160] text-white text-sm rounded"
          >
            立即购买
          </button>
        </div>
      </div>
    </div>
  );
}
