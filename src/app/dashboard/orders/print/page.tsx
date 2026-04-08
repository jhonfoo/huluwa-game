"use client";
import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

interface OrderItem {
  product: { title: string } | null;
  snapshot?: string;
}
interface Order {
  id: string;
  orderNo: string;
  totalPrice: number;
  status: string;
  buyerInfo: string | null;
  paymentMethod: string | null;
  paymentAccount: string | null;
  paymentName: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  completed: { label: "已完成", bg: "#dcfce7", color: "#15803d" },
  pending:   { label: "待确认", bg: "#fef9c3", color: "#854d0e" },
  cancelled: { label: "已取消", bg: "#f3f4f6", color: "#374151" },
  paid:      { label: "已付款", bg: "#dbeafe", color: "#1d4ed8" },
  shipped:   { label: "已发货", bg: "#ede9fe", color: "#7c3aed" },
};

function getProductName(order: Order): string {
  const fromProduct = order.items?.[0]?.product?.title;
  if (fromProduct) return fromProduct;
  const snapshot = order.items?.[0]?.snapshot;
  if (snapshot) {
    try { return JSON.parse(snapshot).title || "—"; } catch { /* ignore */ }
  }
  return "—";
}

function toBjTime(utcStr: string): string {
  return new Date(utcStr).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });
}

/** 生成完全独立的打印 HTML，所有样式内联，不依赖任何外部 CSS */
function buildPrintHtml(orders: Order[], nickname: string, phone: string, exportTime: string): string {
  const statusMap: Record<string, { label: string; bg: string; color: string }> = {
    completed: { label: "已完成", bg: "#dcfce7", color: "#15803d" },
    pending:   { label: "待确认", bg: "#fef9c3", color: "#854d0e" },
    cancelled: { label: "已取消", bg: "#f3f4f6", color: "#374151" },
    paid:      { label: "已付款", bg: "#dbeafe", color: "#1d4ed8" },
    shipped:   { label: "已发货", bg: "#ede9fe", color: "#7c3aed" },
  };

  const totalAmount = orders.reduce((s, o) => s + o.totalPrice, 0);
  const completedCount = orders.filter(o => o.status === "completed").length;
  const pendingCount = orders.filter(o => o.status === "pending").length;

  const rows = orders.map((o, i) => {
    const productName = getProductName(o);
    const st = statusMap[o.status] ?? { label: o.status, bg: "#f3f4f6", color: "#374151" };
    const rowBg = i % 2 === 1 ? "#f9fafb" : "#fff";
    return `
      <tr style="background:${rowBg};border-bottom:1px solid #e5e7eb;">
        <td style="padding:7px 6px;text-align:center;color:#111;font-size:11px;">${i + 1}</td>
        <td style="padding:7px 6px;font-family:monospace;font-size:10px;color:#111;word-break:break-all;">${o.orderNo}</td>
        <td style="padding:7px 6px;color:#111;font-size:11px;word-break:break-all;">${productName}</td>
        <td style="padding:7px 6px;color:#111;font-size:11px;word-break:break-all;">${o.buyerInfo || "—"}</td>
        <td style="padding:7px 6px;color:#111;font-size:11px;">${o.paymentMethod || "—"}</td>
        <td style="padding:7px 6px;color:#111;font-size:11px;word-break:break-all;">${o.paymentAccount || "—"}</td>
        <td style="padding:7px 6px;color:#111;font-size:11px;">${o.paymentName || "—"}</td>
        <td style="padding:7px 6px;color:#07C160;font-size:11px;font-weight:700;">¥${o.totalPrice}</td>
        <td style="padding:7px 6px;">
          <span style="display:inline-block;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600;background:${st.bg};color:${st.color};">${st.label}</span>
        </td>
        <td style="padding:7px 6px;color:#111;font-size:10px;">${toBjTime(o.createdAt)}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>订单明细报表</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;
    background: #f3f4f6;
    color: #111;
  }
  .doc {
    background: #fff;
    width: 297mm;
    min-height: 210mm;
    margin: 24px auto 40px;
    padding: 12mm 14mm 10mm;
    box-shadow: 0 4px 24px rgba(0,0,0,.12);
  }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: #fff !important; }
    .doc { width: 100% !important; margin: 0 !important; padding: 8mm 10mm !important; box-shadow: none !important; }
    @page { size: A4 landscape; margin: 8mm; }
  }
</style>
</head>
<body>
<div class="doc">

  <!-- 头部 -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:12px;border-bottom:2.5px solid #07C160;margin-bottom:14px;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:40px;height:40px;background:#07C160;border-radius:10px;display:flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-size:22px;">🎮</span>
      </div>
      <div>
        <div style="font-size:17px;font-weight:700;color:#07C160;">葫芦娃游戏交易平台</div>
        <div style="font-size:10.5px;color:#374151;margin-top:2px;">安全便捷的游戏虚拟物品交易平台</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:20px;font-weight:700;color:#111;letter-spacing:4px;">订单明细报表</div>
      <div style="font-size:10.5px;color:#374151;margin-top:4px;">导出时间：${exportTime}</div>
    </div>
  </div>

  <!-- 卖家信息 -->
  <div style="display:flex;gap:24px;margin-bottom:12px;font-size:12px;color:#111;">
    <span>卖家：<strong>${nickname || "—"}</strong></span>
    <span>账号：<strong>${phone || "—"}</strong></span>
    <span>导出笔数：<strong>${orders.length} 笔</strong></span>
  </div>

  ${orders.length === 0 ? `<div style="text-align:center;padding:40px 0;color:#374151;font-size:13px;">暂无订单数据</div>` : `
  <!-- 表格 -->
  <table style="width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;">
    <colgroup>
      <col style="width:3%"/>
      <col style="width:15%"/>
      <col style="width:16%"/>
      <col style="width:13%"/>
      <col style="width:9%"/>
      <col style="width:13%"/>
      <col style="width:8%"/>
      <col style="width:8%"/>
      <col style="width:7%"/>
      <col style="width:8%"/>
    </colgroup>
    <thead>
      <tr style="background:#07C160;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">序号</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">订单号</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">商品名称</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">买家信息</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">付款方式</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">收款账号</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">收款姓名</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">成交金额</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">状态</th>
        <th style="padding:8px 6px;text-align:left;font-weight:600;color:#fff;overflow:hidden;">下单时间</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <!-- 汇总 -->
  <div style="background:#f0fdf4;border-top:2px solid #07C160;padding:9px 10px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
    <div style="display:flex;gap:20px;font-size:12px;color:#111;">
      <span>共 <strong>${orders.length}</strong> 笔</span>
      <span>已完成：<strong style="color:#07C160;">${completedCount}</strong> 笔</span>
      <span>待确认：<strong style="color:#854d0e;">${pendingCount}</strong> 笔</span>
    </div>
    <div style="font-size:15px;font-weight:700;color:#07C160;">合计金额：¥${totalAmount.toFixed(2)}</div>
  </div>
  `}

  <!-- 页脚 -->
  <div style="margin-top:16px;padding-top:9px;border-top:1px solid #e5e7eb;font-size:10px;color:#374151;text-align:center;">
    ※ 本报表由葫芦娃游戏交易平台系统自动生成，数据截止至导出时间，仅供内部记录使用
  </div>

</div>
</body>
</html>`;
}

function PrintContent() {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const exportTime = new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });

  useEffect(() => {
    if (!token) return;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const all: Order[] = d.orders || [];
        if (idsParam) {
          const ids = new Set(idsParam.split(","));
          setOrders(all.filter(o => ids.has(o.id)));
        } else {
          setOrders(all);
        }
      })
      .finally(() => setLoading(false));
  }, [token, idsParam]);

  function handlePrint() {
    if (!token) return;
    const ids = idsParam || "";
    const url = `/api/print-orders?ids=${encodeURIComponent(ids)}&t=${encodeURIComponent(token)}`;
    window.open(url, "_blank");
  }

  const totalAmount = orders.reduce((s, o) => s + o.totalPrice, 0);
  const completedCount = orders.filter(o => o.status === "completed").length;
  const pendingCount = orders.filter(o => o.status === "pending").length;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", color:"#374151" }}>
      加载中...
    </div>
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @media screen {
          html, body { max-width: none !important; width: 100% !important; padding: 0 !important; }
          body { background: #f3f4f6 !important; font-family: "PingFang SC","Microsoft YaHei",Arial,sans-serif; }
          .print-root { position: fixed; inset: 0; overflow-y: auto; background: #f3f4f6; z-index: 9999; }
        }
        .toolbar {
          position: sticky; top: 0; height: 52px; background: #fff;
          border-bottom: 1px solid #e5e7eb; display: flex; align-items: center;
          justify-content: space-between; padding: 0 24px; z-index: 200;
          box-shadow: 0 1px 4px rgba(0,0,0,.08);
        }
        .doc {
          background: #fff; width: 297mm; min-height: 210mm;
          margin: 24px auto 40px; padding: 12mm 14mm 10mm;
          box-shadow: 0 4px 24px rgba(0,0,0,.12);
          font-family: "PingFang SC","Microsoft YaHei",Arial,sans-serif;
        }
        .doc-header { display:flex; align-items:flex-start; justify-content:space-between; padding-bottom:12px; border-bottom:2.5px solid #07C160; margin-bottom:14px; }
        .logo-row { display:flex; align-items:center; gap:12px; }
        .logo-icon { width:40px; height:40px; background:#07C160; border-radius:10px; display:flex; align-items:center; justify-content:center; }
        .logo-text h1 { font-size:17px; font-weight:700; color:#07C160; }
        .logo-text p  { font-size:10.5px; color:#374151; margin-top:2px; }
        .report-title { text-align:right; }
        .report-title h2 { font-size:20px; font-weight:700; color:#111; letter-spacing:4px; }
        .report-title p  { font-size:10.5px; color:#374151; margin-top:4px; }
        .meta { display:flex; gap:24px; margin-bottom:12px; font-size:12px; color:#111; }
        table { width:100%; border-collapse:collapse; font-size:11px; table-layout:fixed; }
        thead tr { background:#07C160; }
        thead th { padding:8px 6px; text-align:left; font-weight:600; color:#fff; overflow:hidden; word-break:break-all; }
        tbody tr:nth-child(even) { background:#f9fafb; }
        tbody tr { border-bottom:1px solid #e5e7eb; }
        tbody td { padding:7px 6px; color:#111; vertical-align:middle; overflow:hidden; word-break:break-all; }
        .summary { background:#f0fdf4; border-top:2px solid #07C160; padding:9px 10px; display:flex; justify-content:space-between; align-items:center; }
        .summary-left { display:flex; gap:20px; font-size:12px; color:#111; }
        .summary-right { font-size:15px; font-weight:700; color:#07C160; }
        .footer { margin-top:16px; padding-top:9px; border-top:1px solid #e5e7eb; font-size:10px; color:#374151; text-align:center; }
        .badge { display:inline-block; padding:2px 7px; border-radius:20px; font-size:10px; font-weight:600; white-space:nowrap; }
        .mono { font-family:monospace; font-size:10px; color:#111; }
        .amt { color:#07C160; font-weight:700; }
      `}</style>

      <div className="print-root">
        <div className="toolbar">
          <button onClick={() => router.back()} style={{ fontSize:13, color:"#374151", cursor:"pointer", border:"none", background:"none" }}>
            ← 返回
          </button>
          <span style={{ fontSize:14, fontWeight:600, color:"#111" }}>
            订单明细报表 · 共 {orders.length} 笔（预览）
          </span>
          <button
            onClick={handlePrint}
            style={{ background:"#07C160", color:"#fff", border:"none", borderRadius:6, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer" }}
          >
            打印 / 导出 PDF
          </button>
        </div>

        <div className="doc">
          <div className="doc-header">
            <div className="logo-row">
              <div className="logo-icon"><span style={{ color:"#fff", fontSize:22 }}>🎮</span></div>
              <div className="logo-text">
                <h1>葫芦娃游戏交易平台</h1>
                <p>安全便捷的游戏虚拟物品交易平台</p>
              </div>
            </div>
            <div className="report-title">
              <h2>订单明细报表</h2>
              <p>导出时间：{exportTime}</p>
            </div>
          </div>

          <div className="meta">
            <span>卖家：<strong>{user?.nickname || "—"}</strong></span>
            <span>账号：<strong>{user?.phone || "—"}</strong></span>
            <span>导出笔数：<strong>{orders.length} 笔</strong></span>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#374151" }}>暂无订单数据</div>
          ) : (
            <>
              <table>
                <colgroup>
                  <col style={{ width:"3%" }} />
                  <col style={{ width:"15%" }} />
                  <col style={{ width:"16%" }} />
                  <col style={{ width:"13%" }} />
                  <col style={{ width:"9%" }} />
                  <col style={{ width:"13%" }} />
                  <col style={{ width:"8%" }} />
                  <col style={{ width:"8%" }} />
                  <col style={{ width:"7%" }} />
                  <col style={{ width:"8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>序号</th><th>订单号</th><th>商品名称</th><th>买家信息</th>
                    <th>付款方式</th><th>收款账号</th><th>收款姓名</th>
                    <th>成交金额</th><th>状态</th><th>下单时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => {
                    const productName = getProductName(o);
                    const st = STATUS[o.status] ?? { label: o.status, bg:"#f3f4f6", color:"#374151" };
                    return (
                      <tr key={o.id}>
                        <td style={{ textAlign:"center" }}>{i + 1}</td>
                        <td className="mono">{o.orderNo}</td>
                        <td>{productName}</td>
                        <td>{o.buyerInfo || "—"}</td>
                        <td>{o.paymentMethod || "—"}</td>
                        <td>{o.paymentAccount || "—"}</td>
                        <td>{o.paymentName || "—"}</td>
                        <td className="amt">¥{o.totalPrice}</td>
                        <td><span className="badge" style={{ background:st.bg, color:st.color }}>{st.label}</span></td>
                        <td>{toBjTime(o.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="summary">
                <div className="summary-left">
                  <span>共 <strong>{orders.length}</strong> 笔</span>
                  <span>已完成：<strong style={{ color:"#07C160" }}>{completedCount}</strong> 笔</span>
                  <span>待确认：<strong style={{ color:"#854d0e" }}>{pendingCount}</strong> 笔</span>
                </div>
                <div className="summary-right">合计金额：¥{totalAmount.toFixed(2)}</div>
              </div>
            </>
          )}

          <div className="footer">
            ※ 本报表由葫芦娃游戏交易平台系统自动生成，数据截止至导出时间，仅供内部记录使用
          </div>
        </div>
      </div>
    </>
  );
}

export default function PrintOrdersPage() {
  return (
    <Suspense fallback={<div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",color:"#374151" }}>加载中...</div>}>
      <PrintContent />
    </Suspense>
  );
}
