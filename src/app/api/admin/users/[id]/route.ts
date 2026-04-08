import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateAdmin(req);
    if (!payload) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { id } = await params;
    const orderCount = await prisma.order.count({ where: { userId: id } });
    if (orderCount > 0) {
      return NextResponse.json({ error: "该用户有订单记录，无法删除" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user DELETE error:", error);
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await authenticateAdmin(req);
    if (!payload) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { active: !user.active },
    });

    return NextResponse.json({
      user: { id: updated.id, phone: updated.phone, nickname: updated.nickname, active: updated.active },
    });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 });
  }
}
