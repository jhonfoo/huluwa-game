import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { preset: true },
      select: {
        id: true, title: true, price: true, images: true,
        sales: true, views: true,
        seller: { select: { nickname: true } },
      },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Preset products GET error:", error);
    return NextResponse.json({ error: "获取预设商品失败" }, { status: 500 });
  }
}
