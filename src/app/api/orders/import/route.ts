import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "未上传文件" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const records = rows
      .map((row) => ({
        时间: String(row["时间"] || ""),
        付款金额: Number(row["付款金额"]) || 0,
        状态: String(row["状态"] || ""),
        收款账号: String(row["收款账号"] || ""),
        收款姓名: String(row["收款姓名"] || ""),
      }))
      .filter((r) => r.付款金额 > 0 && r.时间);

    return NextResponse.json({ records });
  } catch (e) {
    console.error("Import parse error:", e);
    return NextResponse.json({ error: "文件解析失败" }, { status: 500 });
  }
}
