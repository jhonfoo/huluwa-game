import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

interface OrderRecord {
  时间: string;
  付款金额: number;
  状态: string;
  收款账号: string;
  收款姓名: string;
  付款人姓名?: string;
  productId: string;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer "))
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const { records } = (await req.json()) as { records: OrderRecord[] };
    if (!records?.length)
      return NextResponse.json({ error: "没有订单数据" }, { status: 400 });

    const STATUS_MAP: Record<string, string> = {
      已完成: "completed",
      已取消: "cancelled",
    };

    const productIds = [...new Set(records.map((r) => r.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let created = 0;
    let failed = 0;

    for (const r of records) {
      try {
        const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const createdAt = r.时间
          ? new Date(r.时间.replace(" ", "T") + "+08:00")
          : new Date();
        const product = productMap.get(r.productId);

        const orderData: Record<string, unknown> = {
          orderNo,
          userId: payload.userId,
          totalPrice: Number(r.付款金额),
          status: STATUS_MAP[r.状态] || "completed",
          source: "import",
          paymentMethod: "银行卡",
          paymentAccount: r.收款账号 || null,
          paymentName: r.收款姓名 || null,
          buyerInfo: r.付款人姓名 || null,
          createdAt,
        };

        if (product) {
          const quantity = product.price > 0 ? Math.max(Math.floor(Number(r.付款金额) / product.price), 1) : 1;
          orderData.items = {
            create: [
              {
                productId: product.id,
                quantity,
                price: Number(r.付款金额),
                snapshot: JSON.stringify({
                  title: product.title,
                  images: product.images,
                  price: product.price,
                }),
              },
            ],
          };
        }

        await prisma.order.create({
          data: orderData as Parameters<typeof prisma.order.create>[0]["data"],
        });
        created++;
      } catch (e) {
        console.error("Batch create single order error:", e);
        failed++;
      }
    }

    return NextResponse.json({ created, failed, total: records.length });
  } catch (e) {
    console.error("Batch create error:", e);
    return NextResponse.json({ error: "批量创建失败" }, { status: 500 });
  }
}
