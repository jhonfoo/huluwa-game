import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    const where: Record<string, unknown> = { status: "approved" };
    if (categoryId) where.categoryId = categoryId;
    if (search) where.title = { contains: search };

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "sales") orderBy = { sales: "desc" };
    else if (sort === "price") orderBy = { price: "asc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          seller: { select: { id: true, nickname: true, avatar: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "获取商品列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, price, originalPrice, images, categoryId, gameServer, gameAccount, stock } = body;

    if (!title || !price || !categoryId) {
      return NextResponse.json({ error: "标题、价格和分类不能为空" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price,
        originalPrice: originalPrice || 0,
        images: images || "",
        categoryId,
        sellerId: payload.userId,
        status: "pending",
        gameServer: gameServer || "",
        gameAccount: gameAccount || "",
        stock: stock ?? 1,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: "创建商品失败" }, { status: 500 });
  }
}
