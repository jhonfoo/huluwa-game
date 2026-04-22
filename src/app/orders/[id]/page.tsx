"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { title: string; images?: string };
}

interface Order {
  id: string;
  orderNo: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  remark: string | null;
  source: string | null;
  buyerInfo: string | null;
  paymentMethod: string | null;
  paymentAccount: string | null;
  paymentName: string | null;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待付款",
  paid: "已付款",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-[#07C160]",
  paid: "text-blue-500",
  shipped: "text-green-500",
  completed: "text-gray-500",
  cancelled: "text-gray-400",
  refunded: "text-red-500",
};

export default function OrderDetailPage() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.order) setOrder(d.order);
        else setError(d.error || "获取订单失败");
      })
      .catch(() => setError("网络错误"))
      .finally(() => setFetching(false));
  }, [token, id]);

  if (loading || fetching)
    return <div className="p-6 text-center text-gray-400">加载中...</div>;

  if (error)
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400 text-sm">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-[#07C160] text-sm">
          返回
        </button>
      </div>
    );

  if (!order) return null;

  const rows = [
    { label: "订单号", value: order.orderNo },
    { label: "状态", value: STATUS_LABELS[order.status] || order.status, color: STATUS_COLORS[order.status] },
    { label: "创建时间", value: new Date(order.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) },

    ...(order.paymentMethod ? [{ label: "收款方式", value: order.paymentMethod }] : []),
    ...(order.paymentAccount ? [{ label: "收款账号", value: order.paymentAccount }] : []),
    ...(order.paymentName ? [{ label: "收款姓名", value: order.paymentName }] : []),
    ...(order.buyerInfo ? [{ label: "付款人姓名", value: order.buyerInfo }] : []),
    ...(order.remark ? [{ label: "备注", value: order.remark }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-500 text-lg">‹</button>
        <span className="font-bold text-sm flex-1 text-center mr-6">订单详情</span>
      </div>

      {/* 状态横幅 */}
      <div className="bg-[#07C160] text-white px-4 py-5">
        <p className={`text-lg font-bold ${order.status === "completed" ? "text-white" : "text-white"}`}>
          {STATUS_LABELS[order.status] || order.status}
        </p>
        <p className="text-xs text-orange-100 mt-1">订单号：{order.orderNo}</p>
      </div>

      {/* 商品列表 */}
      <div className="bg-white mt-2 px-4 py-3">
        <p className="text-xs text-gray-400 mb-2">商品信息</p>
        <div className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2">
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {item.product?.images ? (
                  <img src={item.product.images} alt={item.product.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                ) : null}
                <span className={`text-xl ${item.product?.images ? 'hidden' : ''}`}>🎮</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-1">{item.product.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-[#07C160]">¥{item.price}</span>
                  <span className="text-xs text-gray-400">x{item.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {order.items.length === 0 && (
          <p className="text-xs text-gray-400 py-2">无商品明细</p>
        )}
      </div>

      {/* 订单信息 */}
      <div className="bg-white mt-2 px-4 py-3">
        <p className="text-xs text-gray-400 mb-2">订单信息</p>
        <div className="divide-y divide-gray-50">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between py-2.5 gap-4">
              <span className="text-xs text-gray-400 shrink-0">{row.label}</span>
              <span className={`text-xs text-right break-all ${row.color || "text-gray-700"}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 合计 */}
      <div className="bg-white mt-2 px-4 py-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">付款金额</span>
        <span className="text-lg font-bold text-[#07C160]">¥{order.totalPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}
