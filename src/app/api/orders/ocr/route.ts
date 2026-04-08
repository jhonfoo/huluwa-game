import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { execFile } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".bmp", ".webp"]);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer "))
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  let tmpDir = "";
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length)
      return NextResponse.json({ error: "未上传图片" }, { status: 400 });

    // 保存图片到临时目录
    tmpDir = join(process.cwd(), "tmp", `ocr-${randomUUID()}`);
    await mkdir(tmpDir, { recursive: true });

    const imagePaths: string[] = [];
    for (const file of files) {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) continue;
      const filePath = join(tmpDir, `${randomUUID()}${ext}`);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      imagePaths.push(filePath);
    }

    if (!imagePaths.length)
      return NextResponse.json({ error: "没有有效的图片文件" }, { status: 400 });

    // 调用 Python OCR 脚本
    const scriptPath = join(process.cwd(), "scripts", "ocr", "process.py");
    const result = await new Promise<string>((resolve, reject) => {
      execFile(
        "python3",
        [scriptPath, ...imagePaths],
        { timeout: 120000, maxBuffer: 10 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            console.error("OCR stderr:", stderr);
            reject(new Error(stderr || error.message));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    const records = JSON.parse(result);
    return NextResponse.json({ records });
  } catch (e) {
    console.error("OCR error:", e);
    const msg = e instanceof Error ? e.message : "识别失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (tmpDir) {
      rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
