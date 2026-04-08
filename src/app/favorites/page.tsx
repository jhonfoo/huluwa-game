"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string;
  };
}

export default function FavoritesPage() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/favorites", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setFavorites(d.favorites || []))
      .finally(() => setFetching(false));
  }, [token]);

  const handleRemove = async (productId: string) => {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      setFavorites((prev) => prev.filter((f) => f.product.id !== productId));
    }
  };

  if (loading || fetching)
    return <div className="p-6 text-center text-gray-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 text-center font-bold border-b border-gray-100">
        我的收藏
      </div>

      {favorites.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">暂无收藏</div>
      ) : (
        <div className="p-2 grid grid-cols-2 gap-2 mt-2">
          {favorites.map((fav) => (
            <div key={fav.id} className="bg-white rounded overflow-hidden border border-gray-100">
              <Link href={`/products/${fav.product.id}`}>
                <div className="h-36 bg-gray-100 flex items-center justify-center text-4xl">
                  🎮
                </div>
                <div className="p-2">
                  <p className="text-xs line-clamp-2 h-8">{fav.product.title}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[#07C160] text-xs">¥</span>
                    <span className="text-[#07C160] font-bold text-sm">
                      {fav.product.price}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="px-2 pb-2">
                <button
                  onClick={() => handleRemove(fav.product.id)}
                  className="w-full text-xs text-gray-400 border border-gray-200 rounded py-1 active:bg-gray-50"
                >
                  取消收藏
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
