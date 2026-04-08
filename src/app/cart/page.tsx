"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    images: string;
  };
}

export default function CartPage() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/cart", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(d.cartItems || []))
      .finally(() => setFetching(false));
  }, [token]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const totalPrice = items
    .filter((i) => selectedIds.has(i.id))
    .reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handleDelete = async (id: string) => {
    await fetch(`/api/cart?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCheckout = async () => {
    if (selectedIds.size === 0) return;
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cartItemIds: Array.from(selectedIds) }),
    });
    if (res.ok) {
      router.push("/orders");
    }
  };

  if (loading || fetching)
    return <div className="p-6 text-center text-gray-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 text-center font-bold border-b border-gray-100">
        购物车
      </div>

      {items.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">购物车是空的</div>
      ) : (
        <>
          <div className="divide-y divide-gray-100 bg-white mt-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="w-5 h-5 accent-[#07C160] shrink-0"
                />
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                  {item.product.images ? (
                    <img src={item.product.images} alt={item.product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{item.product.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[#07C160] font-bold text-sm">
                      ¥{item.product.price}
                    </span>
                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-gray-400 shrink-0 px-2 py-1"
                >
                  删除
                </button>
              </div>
            ))}
          </div>

          {/* 底部结算栏 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center px-4 h-14">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={items.length > 0 && selectedIds.size === items.length}
                onChange={toggleAll}
                className="w-5 h-5 accent-[#07C160]"
              />
              全选
            </label>
            <div className="flex-1 text-right mr-3">
              <span className="text-sm">合计：</span>
              <span className="text-[#07C160] font-bold">¥{totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={selectedIds.size === 0}
              className="bg-[#07C160] text-white text-sm font-bold px-6 h-9 rounded disabled:opacity-50"
            >
              结算({selectedIds.size})
            </button>
          </div>
        </>
      )}
    </div>
  );
}
