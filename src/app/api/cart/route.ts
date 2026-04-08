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

    const items = await prisma.cartItem.findMany({
      where: { userId: payload.userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "获取购物车失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { productId, quantity } = await req.json();
    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: payload.userId, productId } },
      update: { quantity },
      create: { userId: payload.userId, productId, quantity },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "添加购物车失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const cartItemId = req.nextUrl.searchParams.get("cartItemId");
    if (!cartItemId) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item || item.userId !== payload.userId) {
      return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "删除购物车项失败" }, { status: 500 });
  }
}
