import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: "手机号和密码不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 400 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "密码错误" }, { status: 400 });
    }

    const token = await signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: { id: user.id, phone: user.phone, nickname: user.nickname, role: user.role, balance: user.balance },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
