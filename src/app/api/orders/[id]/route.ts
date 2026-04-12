import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.slice(7));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.userId !== payload.userId && payload.role !== "admin") {
      return NextResponse.json({ error: "无权查看" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json({ error: "获取订单详情失败" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.userId !== payload.userId && payload.role !== "admin") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.remark !== undefined) updateData.remark = body.remark;
    if (body.totalPrice !== undefined) updateData.totalPrice = Number(body.totalPrice);
    if (body.source !== undefined) updateData.source = body.source;
    if (body.buyerInfo !== undefined) updateData.buyerInfo = body.buyerInfo;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.paymentAccount !== undefined) updateData.paymentAccount = body.paymentAccount;
    if (body.paymentName !== undefined) updateData.paymentName = body.paymentName;
    if (body.createdAt !== undefined) updateData.createdAt = new Date(body.createdAt);

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: { include: { product: true } } },
    });

    if (body.totalPrice !== undefined && body.productId) {
      const product = await prisma.product.findUnique({ where: { id: body.productId } });
      if (product && product.price > 0) {
        const quantity = Math.floor(Number(body.totalPrice) / product.price);
        await prisma.orderItem.updateMany({
          where: { orderId: id, productId: body.productId },
          data: { quantity: Math.max(quantity, 1), price: Number(body.totalPrice) },
        });
      }
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Order PUT error:", error);
    return NextResponse.json({ error: "更新订单失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.userId !== payload.userId && payload.role !== "admin") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order DELETE error:", error);
    return NextResponse.json({ error: "删除订单失败" }, { status: 500 });
  }
}
