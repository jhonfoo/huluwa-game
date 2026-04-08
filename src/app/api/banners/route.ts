import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { sort: "asc" },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Banners GET error:", error);
    return NextResponse.json({ error: "获取轮播图失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const { image, link, sort, active } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "图片不能为空" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        image,
        link: link || "",
        sort: sort ?? 0,
        active: active ?? true,
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Banners POST error:", error);
    return NextResponse.json({ error: "创建轮播图失败" }, { status: 500 });
  }
}
