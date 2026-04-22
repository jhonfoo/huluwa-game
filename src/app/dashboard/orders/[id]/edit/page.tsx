"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface PresetProduct {
  id: string;
  title: string;
  price: number;
}

function utcToBjLocal(utcStr: string): { dt: string; ss: string } {
  const d = new Date(utcStr);
  const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return { dt: bj.toISOString().slice(0, 16), ss: String(bj.getUTCSeconds()).padStart(2, "0") };
}

const PAYMENT_METHODS = ["银行卡", "微信", "支付宝", "其他"];

export default function EditOrderPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [products, setProducts] = useState<PresetProduct[]>([]);
  const [totalPrice, setTotalPrice] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [buyerInfo, setBuyerInfo] = useState("");
  const [status, setStatus] = useState("pending");
  const [orderDateTime, setOrderDateTime] = useState("");
  const [orderSeconds, setOrderSeconds] = useState("00");
  const [productId, setProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/preset-products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token || !orderId) return;
    fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const o = data.order;
        if (o) {
          setTotalPrice(o.totalPrice ? String(Math.round(o.totalPrice)) : "");
          setPaymentMethod(o.paymentMethod || "");
          setPaymentAccount(o.paymentAccount || "");
          setPaymentName(o.paymentName || "");
          setBuyerInfo(o.buyerInfo || "");
          setStatus(o.status || "pending");
          if (o.items?.[0]?.product) {
            setProductId(o.items[0].productId || o.items[0].product?.id || null);
          }
          if (o.createdAt) {
            const { dt, ss } = utcToBjLocal(o.createdAt);
            setOrderDateTime(dt);
            setOrderSeconds(ss);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const ss = orderSeconds.padStart(2, "0").slice(0, 2);
      const createdAt = orderDateTime ? `${orderDateTime}:${ss}+08:00` : undefined;
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          totalPrice: parseInt(totalPrice, 10) || 0,
          productId,
          paymentMethod,
          paymentAccount,
          paymentName,
          buyerInfo: buyerInfo.trim() || null,
          status,
          createdAt,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "更新失败");
        return;
      }
      router.push("/dashboard/orders");
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center py-8 text-gray-400">加载中...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">编辑订单</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">付款金额（元）</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="请输入整数金额"
            value={totalPrice}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9]/g, "");
              setTotalPrice(cleaned === "" ? "" : String(parseInt(cleaned, 10)));
            }}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">付款方式</label>
          <select
            value={PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : (paymentMethod ? "__custom__" : "")}
            onChange={(e) => {
              if (e.target.value !== "__custom__") setPaymentMethod(e.target.value);
            }}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#07C160]"
          >
            <option value="">-- 请选择 --</option>
            <option value="银行卡">银行卡</option>
            <option value="微信">微信</option>
            <option value="支付宝">支付宝</option>
            <option value="其他">其他</option>
            {paymentMethod && !PAYMENT_METHODS.includes(paymentMethod) && (
              <option value="__custom__">{paymentMethod}（原值）</option>
            )}
          </select>
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
          <label className="block text-sm text-gray-600 mb-1">付款人姓名<span className="text-gray-400 text-xs ml-1">（可选）</span></label>
          <input
            type="text"
            value={buyerInfo}
            onChange={(e) => setBuyerInfo(e.target.value)}
            placeholder="如：赵*龙"
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
          {submitting ? "更新中..." : "更新订单"}
        </button>
      </form>
    </div>
  );
}
