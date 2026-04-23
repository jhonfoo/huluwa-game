"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  paymentMethod: string | null;
  paymentAccount: string | null;
  buyerInfo: string | null;
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

const FILTER_OPTIONS = [
  { value: "orderNo", label: "订单号" },
  { value: "paymentMethod", label: "收款方式" },
  { value: "paymentAccount", label: "收款账号" },
];

function OrdersContent() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  // 筛选条件从 URL 读取
  const filterBy = searchParams.get("filterBy") || "orderNo";
  const keyword = searchParams.get("keyword") || "";

  // 输入框本地状态（未提交前不影响 URL）
  const [inputFilterBy, setInputFilterBy] = useState(filterBy);
  const [inputKeyword, setInputKeyword] = useState(keyword);

  const fetchOrders = useCallback(() => {
    if (!token) return;
    setFetching(true);
    const params = new URLSearchParams();
    if (keyword) {
      params.set("filterBy", filterBy);
      params.set("keyword", keyword);
    }
    const qs = params.toString();
    fetch(`/api/orders${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setFetching(false));
  }, [token, filterBy, keyword]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  function handleSearch() {
    const params = new URLSearchParams(searchParams.toString());
    if (inputKeyword.trim()) {
      params.set("filterBy", inputFilterBy);
      params.set("keyword", inputKeyword.trim());
    } else {
      params.delete("filterBy");
      params.delete("keyword");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleReset() {
    setInputFilterBy("orderNo");
    setInputKeyword("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filterBy");
    params.delete("keyword");
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilter = !!keyword;

  if (loading)
    return <div className="p-6 text-center text-gray-400">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 text-center font-bold border-b border-gray-100">
        我的订单
      </div>

      {/* 筛选栏 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={inputFilterBy}
            onChange={(e) => { setInputFilterBy(e.target.value); setInputKeyword(""); }}
            className="text-sm border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-gray-50 focus:outline-none focus:border-[#07C160] flex-shrink-0"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="输入关键词搜索..."
            className="text-sm border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-gray-50 focus:outline-none focus:border-[#07C160] flex-1 min-w-0"
          />
          <button
            onClick={handleSearch}
            className="text-sm bg-[#07C160] text-white px-3 py-1.5 rounded hover:bg-[#06AD56] flex-shrink-0"
          >
            搜索
          </button>
          {hasFilter && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-400 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 flex-shrink-0"
            >
              重置
            </button>
          )}
        </div>
        {hasFilter && (
          <p className="text-xs text-[#07C160]">
            已筛选：{FILTER_OPTIONS.find((o) => o.value === filterBy)?.label} 含「{keyword}」
          </p>
        )}
      </div>

      {fetching ? (
        <div className="p-6 text-center text-gray-400">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          {hasFilter ? "没有符合条件的订单" : "暂无订单"}
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block bg-white p-4 active:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">订单号：{order.orderNo}</span>
                <span className={`text-xs font-medium ${STATUS_COLORS[order.status] || "text-gray-500"}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

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

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400 space-y-0.5">
                  <p>{new Date(order.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
                  {order.buyerInfo && <p>付款人: {order.buyerInfo}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">
                    付款金额：<span className="text-[#07C160] font-bold">¥{order.totalPrice}</span>
                  </span>
                  {order.status === "pending" && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="text-xs border border-gray-300 rounded px-3 py-1 text-gray-500 active:bg-gray-50"
                    >
                      取消订单
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400">加载中...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
