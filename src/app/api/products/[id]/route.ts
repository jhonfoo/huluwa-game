import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: {
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    if (existing.sellerId !== payload.userId && payload.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json();
    const product = await prisma.product.update({ where: { id }, data: body });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product PUT error:", error);
    return NextResponse.json({ error: "更新商品失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    if (existing.sellerId !== payload.userId && payload.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json({ error: "删除商品失败" }, { status: 500 });
  }
}
