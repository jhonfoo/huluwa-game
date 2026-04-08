import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "approved", isDiscount: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Discount products error:", error);
    return NextResponse.json({ error: "获取折扣商品失败" }, { status: 500 });
  }
}
