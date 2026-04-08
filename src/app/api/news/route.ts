import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 10));

    const [total, news] = await Promise.all([
      prisma.news.count(),
      prisma.news.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ news, total, page, pageSize });
  } catch (error) {
    console.error("News GET error:", error);
    return NextResponse.json({ error: "获取资讯列表失败" }, { status: 500 });
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

    const { title, content, cover } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    const news = await prisma.news.create({
      data: { title, content: content || "", cover: cover || "" },
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error("News POST error:", error);
    return NextResponse.json({ error: "创建资讯失败" }, { status: 500 });
  }
}
