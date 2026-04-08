import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateAdmin(req);
    if (!payload) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, nickname: true, phone: true } },
        items: { include: { product: { select: { title: true, images: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders GET error:", error);
    return NextResponse.json({ error: "获取订单失败" }, { status: 500 });
  }
}
