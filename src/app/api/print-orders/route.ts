import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function esc(s: string | null | undefined): string {
  if (!s) return "—";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toBjTime(utcStr: string): string {
  return new Date(utcStr).toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  completed: { label: "已完成", bg: "#dcfce7", color: "#15803d" },
  pending:   { label: "待确认", bg: "#fef9c3", color: "#854d0e" },
  cancelled: { label: "已取消", bg: "#f3f4f6", color: "#374151" },
  paid:      { label: "已付款", bg: "#dbeafe", color: "#1d4ed8" },
  shipped:   { label: "已发货", bg: "#ede9fe", color: "#7c3aed" },
};

export async function GET(req: NextRequest) {
  try {
    // 验证 token（从 query param t= 或 Authorization header）
    const t = req.nextUrl.searchParams.get("t");
    const authHeader = req.headers.get("authorization");
    const rawToken = t || authHeader?.replace("Bearer ", "") || "";
    const payload = await verifyToken(rawToken);
    if (!payload) {
      return new NextResponse("未授权，请重新登录后再试", { status: 401 });
    }

    const idsParam = req.nextUrl.searchParams.get("ids");

    // 拉取该卖家的订单
    const where: Record<string, unknown> = { userId: payload.userId };
    if (idsParam) {
      where.id = { in: idsParam.split(",").filter(Boolean) };
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { nickname: true, phone: true },
    });

    const exportTime = new Date().toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour12: false,
    });

    const totalAmount = orders.reduce((s, o) => s + o.totalPrice, 0);
    const completedCount = orders.filter(o => o.status === "completed").length;
    const pendingCount = orders.filter(o => o.status === "pending").length;

    const rows = orders.map((o, i) => {
      // 商品名称：优先关联商品，其次 snapshot
      let productName = "—";
      const item = o.items?.[0];
      if (item?.product?.title) {
        productName = item.product.title;
      } else if (item?.snapshot) {
        try { productName = (JSON.parse(item.snapshot as string).title) || "—"; } catch { /* noop */ }
      }

      const st = STATUS_MAP[o.status] ?? { label: o.status, bg: "#f3f4f6", color: "#374151" };
      const rowBg = i % 2 === 1 ? "#f9fafb" : "#ffffff";

      return `
        <tr style="background:${rowBg};border-bottom:1px solid #e5e7eb;">
          <td style="padding:7px 6px;text-align:center;color:#111;font-size:11px;">${i + 1}</td>
          <td style="padding:7px 6px;font-family:monospace;font-size:10px;color:#111;word-break:break-all;">${esc(o.orderNo)}</td>
          <td style="padding:7px 6px;color:#111;font-size:11px;word-break:break-all;">${esc(productName)}</td>
          <td style="padding:7px 6px;color:#111;font-size:11px;word-break:break-all;">${esc(o.buyerInfo)}</td>
          <td style="padding:7px 6px;color:#111;font-size:11px;">${esc(o.paymentMethod)}</td>
          <td style="padding:7px 6px;color:#111;font-size:11px;word-break:break-all;">${esc(o.paymentAccount)}</td>
          <td style="padding:7px 6px;color:#111;font-size:11px;">${esc(o.paymentName)}</td>
          <td style="padding:7px 6px;color:#07C160;font-size:11px;font-weight:700;">¥${o.totalPrice}</td>
          <td style="padding:7px 6px;">
            <span style="display:inline-block;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600;
              background:${st.bg};color:${st.color};
              -webkit-print-color-adjust:exact;print-color-adjust:exact;">${st.label}</span>
          </td>
          <td style="padding:7px 6px;color:#111;font-size:10px;">${toBjTime(o.createdAt.toISOString())}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>订单明细报表 — 葫芦娃游戏交易平台</title>
  <style>
    *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
    html,body {
      font-family:"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif;
      background:#f3f4f6; color:#111;
    }
    .toolbar {
      position:sticky; top:0; height:52px; background:#fff;
      border-bottom:1px solid #e5e7eb; display:flex; align-items:center;
      justify-content:space-between; padding:0 24px; z-index:100;
      box-shadow:0 1px 4px rgba(0,0,0,.08);
    }
    .btn-print {
      background:#07C160; color:#fff; border:none; border-radius:6px;
      padding:8px 20px; font-size:13px; font-weight:600; cursor:pointer;
    }
    .btn-print:hover { background:#06AD56; }
    .doc {
      background:#fff; width:297mm; min-height:210mm;
      margin:24px auto 40px; padding:12mm 14mm 10mm;
      box-shadow:0 4px 24px rgba(0,0,0,.12);
    }
    .doc-header {
      display:flex; align-items:flex-start; justify-content:space-between;
      padding-bottom:12px; border-bottom:2.5px solid #07C160; margin-bottom:14px;
    }
    .logo-row { display:flex; align-items:center; gap:12px; }
    .logo-icon {
      width:40px; height:40px; background:#07C160; border-radius:10px;
      display:flex; align-items:center; justify-content:center;
      -webkit-print-color-adjust:exact; print-color-adjust:exact;
    }
    .logo-icon span { color:#fff; font-size:22px; line-height:1; }
    .logo-text .name { font-size:17px; font-weight:700; color:#07C160; }
    .logo-text .sub  { font-size:10.5px; color:#374151; margin-top:2px; }
    .report-title { text-align:right; }
    .report-title h2 { font-size:20px; font-weight:700; color:#111; letter-spacing:4px; }
    .report-title .ts { font-size:10.5px; color:#374151; margin-top:4px; }
    .meta { display:flex; gap:24px; margin-bottom:12px; font-size:12px; color:#111; }
    table {
      width:100%; border-collapse:collapse;
      font-size:11px; table-layout:fixed;
    }
    thead tr {
      background:#07C160;
      -webkit-print-color-adjust:exact; print-color-adjust:exact;
    }
    thead th {
      padding:8px 6px; text-align:left; font-weight:600; color:#fff;
      overflow:hidden; word-break:break-all;
    }
    .summary {
      background:#f0fdf4; border-top:2px solid #07C160; padding:9px 10px;
      display:flex; justify-content:space-between; align-items:center;
      -webkit-print-color-adjust:exact; print-color-adjust:exact;
    }
    .summary-l { display:flex; gap:20px; font-size:12px; color:#111; }
    .summary-r { font-size:15px; font-weight:700; color:#07C160; }
    .footer {
      margin-top:16px; padding-top:9px; border-top:1px solid #e5e7eb;
      font-size:10px; color:#374151; text-align:center;
    }
    @media print {
      *,*::before,*::after {
        -webkit-print-color-adjust:exact !important;
        print-color-adjust:exact !important;
      }
      html,body { background:#fff !important; }
      .toolbar { display:none !important; }
      .doc {
        width:100% !important; margin:0 !important;
        padding:8mm 10mm !important; box-shadow:none !important;
        min-height:unset !important;
      }
      @page { size:A4 landscape; margin:8mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.close()" style="font-size:13px;color:#374151;cursor:pointer;border:none;background:none;">✕ 关闭</button>
    <span style="font-size:14px;font-weight:600;color:#111;">订单明细报表 · 共 ${orders.length} 笔</span>
    <button class="btn-print" onclick="window.print()">打印 / 导出 PDF</button>
  </div>

  <div class="doc">
    <div class="doc-header">
      <div class="logo-row">
        <div class="logo-icon"><span>🎮</span></div>
        <div class="logo-text">
          <div class="name">葫芦娃游戏交易平台</div>
          <div class="sub">安全便捷的游戏虚拟物品交易平台</div>
        </div>
      </div>
      <div class="report-title">
        <h2>订单明细报表</h2>
        <div class="ts">导出时间：${exportTime}</div>
      </div>
    </div>

    <div class="meta">
      <span>卖家：<strong>${esc(user?.nickname)}</strong></span>
      <span>账号：<strong>${esc(user?.phone)}</strong></span>
      <span>导出笔数：<strong>${orders.length} 笔</strong></span>
    </div>

    ${orders.length === 0 ? `<div style="text-align:center;padding:40px 0;color:#374151;font-size:13px;">暂无订单数据</div>` : `
    <table>
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
        <tr>
          <th>序号</th><th>订单号</th><th>商品名称</th><th>付款人</th>
          <th>付款方式</th><th>收款账号</th><th>收款姓名</th>
          <th>成交金额</th><th>状态</th><th>下单时间</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="summary">
      <div class="summary-l">
        <span>共 <strong>${orders.length}</strong> 笔</span>
        <span>已完成：<strong style="color:#07C160;">${completedCount}</strong> 笔</span>
        <span>待确认：<strong style="color:#854d0e;">${pendingCount}</strong> 笔</span>
      </div>
      <div class="summary-r">合计金额：¥${totalAmount.toFixed(2)}</div>
    </div>
    `}

    <div class="footer">※ 本报表由葫芦娃游戏交易平台系统自动生成，数据截止至导出时间，仅供内部记录使用</div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("print-orders error:", error);
    return new NextResponse("服务器错误，请稍后重试", { status: 500 });
  }
}
