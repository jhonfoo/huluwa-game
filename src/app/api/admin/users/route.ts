import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";

async function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateAdmin(req);
    if (!payload) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const users = await prisma.user.findMany({
      where: { role: "user" },
      select: { id: true, nickname: true, phone: true, active: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticateAdmin(req);
    if (!payload) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { phone, password, nickname } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: "手机号和密码不能为空" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: "该手机号已存在" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        nickname: nickname || `用户${phone.slice(-4)}`,
        role: "user",
      },
    });

    return NextResponse.json({
      user: { id: user.id, phone: user.phone, nickname: user.nickname, role: user.role, active: user.active },
    });
  } catch (error) {
    console.error("Admin users POST error:", error);
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
  }
}
