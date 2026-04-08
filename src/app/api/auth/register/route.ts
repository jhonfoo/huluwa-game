import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const payload = await verifyToken(authHeader.slice(7));
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { phone, password, nickname } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: "手机号和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "该手机号已注册" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        nickname: nickname || `用户${phone.slice(-4)}`,
      },
    });

    const token = await signToken({ userId: user.id, role: user.role });

    return NextResponse.json({
      token,
      user: { id: user.id, phone: user.phone, nickname: user.nickname, role: user.role },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
