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

    const { searchParams } = req.nextUrl;
    const filterBy = searchParams.get("filterBy") || "";
    const keyword = searchParams.get("keyword") || "";

    const where: Record<string, unknown> = { userId: payload.userId };
    if (filterBy && keyword) {
      if (filterBy === "orderNo") where.orderNo = { contains: keyword };
      else if (filterBy === "paymentMethod") where.paymentMethod = { contains: keyword };
      else if (filterBy === "paymentAccount") where.paymentAccount = { contains: keyword };
      else if (filterBy === "buyerInfo") where.buyerInfo = { contains: keyword };
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "获取订单列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await req.json();

    // Support manual order creation (from seller dashboard)
    if (body.source === "manual" || body.totalPrice !== undefined) {
      const {
        totalPrice,
        source,
        buyerInfo,
        paymentMethod,
        paymentAccount,
        paymentName,
        status,
        note,
        productId,
        createdAt: createdAtRaw,
      } = body;

      if (totalPrice === undefined) {
        return NextResponse.json({ error: "金额不能为空" }, { status: 400 });
      }

      const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      // 用前端传入的时间（北京时间 ISO 字符串），没传则用当前时间
      const createdAt = createdAtRaw ? new Date(createdAtRaw) : new Date();

      const orderData: Record<string, unknown> = {
        orderNo,
        userId: payload.userId,
        totalPrice: Number(totalPrice),
        status: status || "pending",
        remark: note || "",
        source: source || "manual",
        buyerInfo: buyerInfo || null,
        paymentMethod: paymentMethod || null,
        paymentAccount: paymentAccount || null,
        paymentName: paymentName || null,
        createdAt,
      };

      // If a productId is provided, create an order item
      if (productId) {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (product) {
          (orderData as Record<string, unknown>).items = {
            create: [{
              productId: product.id,
              quantity: 1,
              price: Number(totalPrice),
              snapshot: JSON.stringify({ title: product.title, images: product.images, price: product.price }),
            }],
          };
        }
      }

      const order = await prisma.order.create({
        data: orderData as Parameters<typeof prisma.order.create>[0]["data"],
        include: { items: { include: { product: true } } },
      });

      return NextResponse.json({ order });
    }

    // Original cart-based order creation
    const { cartItemIds, remark } = body;
    if (!cartItemIds?.length) {
      return NextResponse.json({ error: "请选择购物车商品" }, { status: 400 });
    }

    const cartItems: Array<{
      id: string;
      productId: string;
      quantity: number;
      product: { id: string; title: string; images: string; price: number };
    }> = await prisma.cartItem.findMany({
      where: { id: { in: cartItemIds }, userId: payload.userId },
      include: { product: true },
    });

    if (cartItems.length !== cartItemIds.length) {
      return NextResponse.json({ error: "部分购物车项不存在" }, { status: 400 });
    }

    const totalPrice = cartItems.reduce(
      (sum, ci) => sum + ci.product.price * ci.quantity,
      0
    );

    const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNo,
          userId: payload.userId,
          totalPrice,
          remark: remark || "",
          items: {
            create: cartItems.map((ci) => ({
              productId: ci.productId,
              quantity: ci.quantity,
              price: ci.product.price,
              snapshot: JSON.stringify({
                title: ci.product.title,
                images: ci.product.images,
                price: ci.product.price,
              }),
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const ci of cartItems) {
        await tx.product.update({
          where: { id: ci.productId },
          data: { sales: { increment: ci.quantity } },
        });
      }

      await tx.cartItem.deleteMany({
        where: { id: { in: cartItemIds } },
      });

      return created;
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}
