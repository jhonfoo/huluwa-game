"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface PresetProduct {
  id: string;
  title: string;
  price: number;
  images: string;
}

function getBjNow() {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return { dt: bj.toISOString().slice(0, 16), ss: String(bj.getUTCSeconds()).padStart(2, "0") };
}

export default function NewOrderPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<PresetProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [totalPrice, setTotalPrice] = useState<string>("");
  const [paymentMethod] = useState("银行卡");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [status, setStatus] = useState("pending");
  const [initBj] = useState(getBjNow);
  const [orderDateTime, setOrderDateTime] = useState(initBj.dt);
  const [orderSeconds, setOrderSeconds] = useState(initBj.ss);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/preset-products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const p = products.find((x) => x.id === productId);
    if (p) setTotalPrice(String(p.price));
  };

  const handlePriceChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    setTotalPrice(cleaned === "" ? "" : String(parseInt(cleaned, 10)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const ss = orderSeconds.padStart(2, "0").slice(0, 2);
      const createdAt = orderDateTime ? `${orderDateTime}:${ss}+08:00` : undefined;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          source: "manual",
          productId: selectedProductId || undefined,
          totalPrice: parseInt(totalPrice, 10) || 0,

          paymentMethod,
          paymentAccount,
          paymentName,
          status,
          createdAt,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "创建失败");
        return;
      }
      router.push("/dashboard/orders");
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">新建订单</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">选择商品</label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          >
            <option value="">-- 选择商品 --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.title} (¥{p.price})</option>
            ))}
          </select>
          {selectedProductId && (() => {
            const p = products.find((x) => x.id === selectedProductId);
            return p?.images ? (
              <div className="mt-2 w-24 aspect-square rounded overflow-hidden border border-gray-200">
                <img src={p.images} alt={p.title} className="w-full h-full object-cover" />
              </div>
            ) : null;
          })()}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">付款金额（元）</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="请输入整数金额"
            value={totalPrice}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">付款方式</label>
          <div className="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-700">银行卡</div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">收款账号</label>
          <input
            type="text"
            value={paymentAccount}
            onChange={(e) => setPaymentAccount(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">收款姓名</label>
          <input
            type="text"
            value={paymentName}
            onChange={(e) => setPaymentName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">订单状态</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          >
            <option value="pending">待确认</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">订单时间（北京时间）</label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={orderDateTime}
              onChange={(e) => setOrderDateTime(e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={59}
                value={orderSeconds}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setOrderSeconds(v);
                }}
                className="w-14 border rounded px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#07C160]"
                placeholder="秒"
              />
              <span className="text-sm text-gray-500">秒</span>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#07C160] text-white py-2 rounded font-bold text-sm hover:bg-[#06AD56] disabled:opacity-50"
        >
          {submitting ? "提交中..." : "提交订单"}
        </button>
      </form>
    </div>
  );
}
