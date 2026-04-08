import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const payload = await verifyToken(authHeader.slice(7));
    if (!payload) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { nickname, password } = await req.json();
    const data: Record<string, string> = {};

    if (nickname !== undefined) data.nickname = nickname;
    if (password) data.password = await hashPassword(password);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: payload.userId },
      data,
    });

    return NextResponse.json({
      user: { id: updated.id, phone: updated.phone, nickname: updated.nickname, role: updated.role },
    });
  } catch (error) {
    console.error("Users me PATCH error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
