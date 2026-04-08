import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.slice(7));
}

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json({ error: "获取收藏列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId: payload.userId, productId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.favorite.create({
      data: { userId: payload.userId, productId },
    });

    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json({ error: "操作收藏失败" }, { status: 500 });
  }
}
