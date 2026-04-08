"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface OrderItem {
  id: string;
  product: { title: string };
  price: number;
}

interface Order {
  id: string;
  orderNo: string;
  totalPrice: number;
  status: string;
  buyerInfo: string | null;
  paymentMethod: string | null;
  paymentAccount: string | null;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "待确认", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
  paid: { label: "已付款", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "已发货", color: "bg-purple-100 text-purple-700" },
  refunded: { label: "已退款", color: "bg-red-100 text-red-700" },
};

const FILTER_OPTIONS = [
  { value: "orderNo", label: "订单号" },
  { value: "paymentMethod", label: "收款方式" },
  { value: "paymentAccount", label: "收款账号" },
];

export default function OrdersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 筛选条件从 URL 读取
  const filterBy = searchParams.get("filterBy") || "orderNo";
  const keyword = searchParams.get("keyword") || "";

  // 输入框本地状态（未提交前不影响 URL）
  const [inputFilterBy, setInputFilterBy] = useState(filterBy);
  const [inputKeyword, setInputKeyword] = useState(keyword);

  const fetchOrders = useCallback(() => {
    if (!token) return;
    setLoading(true);
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
      .then((data) => {
        setOrders(data.orders || []);
        setSelected(new Set());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  const allSelected = orders.length > 0 && selected.size === orders.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExport() {
    if (selected.size === 0) return;
    const ids = Array.from(selected).join(",");
    router.push(`/dashboard/orders/print?ids=${ids}`);
  }

  const hasFilter = !!keyword;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">订单列表</h2>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/orders/import")}
            className="border border-[#07C160] text-[#07C160] text-sm px-4 py-2 rounded hover:bg-green-50"
          >
            批量导入
          </button>
          <button
            onClick={() => router.push("/dashboard/orders/new")}
            className="bg-[#07C160] text-white text-sm px-4 py-2 rounded hover:bg-[#06AD56]"
          >
            + 新建订单
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow-sm px-4 py-3 mb-4 space-y-2">
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

      {loading ? (
        <p className="text-center py-8 text-gray-400">加载中...</p>
      ) : orders.length === 0 ? (
        <p className="text-center py-8 text-gray-400">
          {hasFilter ? "没有符合条件的订单" : "暂无订单"}
        </p>
      ) : (
        <>
          {/* 选择工具栏 */}
          <div className="flex items-center justify-between mb-3 bg-white rounded-lg px-4 py-2.5 shadow-sm">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 accent-[#07C160]"
              />
              全选（{selected.size}/{orders.length}）
            </label>
            <button
              onClick={handleExport}
              disabled={selected.size === 0}
              className={`text-sm px-4 py-1.5 rounded font-medium transition-colors ${
                selected.size > 0
                  ? "bg-[#07C160] text-white hover:bg-[#06AD56]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              导出选中 PDF{selected.size > 0 ? `（${selected.size}）` : ""}
            </button>
          </div>

          <div className="space-y-3">
            {orders.map((order) => {
              const sc = statusConfig[order.status] || { label: order.status, color: "bg-gray-100 text-gray-500" };
              const productName = order.items?.[0]?.product?.title || "未知商品";
              const isChecked = selected.has(order.id);
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-lg shadow p-4 transition-colors ${isChecked ? "ring-1 ring-[#07C160]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(order.id)}
                      className="mt-1 w-4 h-4 accent-[#07C160] shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{productName}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="text-[#07C160] font-bold text-base">¥{order.totalPrice}</span>
                          {order.paymentMethod && <span>付款: {order.paymentMethod}</span>}
                          {order.paymentAccount && <span className="text-gray-400">{order.paymentAccount}</span>}
                          <span className={`px-2 py-0.5 rounded-full text-xs ${sc.color}`}>{sc.label}</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">{new Date(order.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/dashboard/orders/${order.id}/edit`)}
                        className="text-xs text-[#07C160] border border-[#07C160] px-3 py-1 rounded hover:bg-green-50 ml-2 shrink-0"
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
