import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const totalOrders = await prisma.order.count({
      where: { userId: payload.userId },
    });

    const completedOrders = await prisma.order.count({
      where: { userId: payload.userId, status: "completed" },
    });

    const revenueResult = await prisma.order.aggregate({
      where: { userId: payload.userId, status: "completed" },
      _sum: { totalPrice: true },
    });

    const totalRevenue = revenueResult._sum.totalPrice || 0;

    const transactionResult = await prisma.order.aggregate({
      where: { userId: payload.userId },
      _sum: { totalPrice: true },
    });

    const totalTransactionAmount = transactionResult._sum.totalPrice || 0;

    return NextResponse.json({ totalOrders, completedOrders, totalRevenue, totalTransactionAmount });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
