import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const news = await prisma.news.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error("News detail GET error:", error);
    return NextResponse.json({ error: "资讯不存在" }, { status: 404 });
  }
}
