"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ParsedRecord {
  时间: string;
  付款金额: number | string;
  状态: string;
  收款账号: string;
  收款姓名: string;
  filename?: string;
  status?: string;
  warnings?: string[];
  error?: string;
}

interface PresetProduct {
  id: string;
  title: string;
}

const STATUS_MAP: Record<string, string> = {
  已完成: "completed",
  已取消: "cancelled",
};

type ImportMode = "excel" | "image";

export default function ImportOrdersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<ImportMode>("image");
  const [products, setProducts] = useState<PresetProduct[]>([]);
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/preset-products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, []);

  async function handleExcelFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setError("");
    setRecords([]);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/orders/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "解析失败"); return; }
      setRecords(data.records);
    } catch {
      setError("网络错误");
    } finally {
      setParsing(false);
    }
  }

  async function handleImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setParsing(true);
    setError("");
    setRecords([]);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    try {
      const res = await fetch("/api/orders/ocr", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "识别失败"); return; }
      const ocrRecords: ParsedRecord[] = (data.records || [])
        .filter((r: ParsedRecord) => r.status !== "failed")
        .map((r: ParsedRecord) => ({
          ...r,
          付款金额: Number(r.付款金额) || 0,
        }))
        .filter((r: ParsedRecord) => Number(r.付款金额) > 0);

      const failedCount = (data.records || []).filter((r: ParsedRecord) => r.status === "failed").length;
      if (failedCount > 0 && ocrRecords.length > 0) {
        setError(`${failedCount} 张图片识别失败，已跳过`);
      } else if (ocrRecords.length === 0) {
        setError("未识别到有效订单记录");
      }
      setRecords(ocrRecords);
    } catch {
      setError("网络错误");
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm() {
    if (!records.length || !products.length) return;
    setSubmitting(true);
    setProgress({ done: 0, total: records.length });

    const batchRecords = records.map((r) => ({
      时间: String(r.时间 || ""),
      付款金额: Number(r.付款金额) || 0,
      状态: String(r.状态 || "已完成"),
      收款账号: r.收款账号 || account,
      收款姓名: r.收款姓名 || name,
      productId: products[Math.floor(Math.random() * products.length)].id,
    }));

    try {
      const res = await fetch("/api/orders/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ records: batchRecords }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "批量创建失败");
        setSubmitting(false);
        return;
      }
      setProgress({ done: data.created, total: data.total });
      if (data.failed > 0) {
        setError(`${data.created} 条创建成功，${data.failed} 条失败`);
      }
    } catch {
      setError("网络错误");
    }

    setSubmitting(false);
    if (!error) {
      router.push("/dashboard/orders");
    }
  }

  const validRecords = records.filter((r) => Number(r.付款金额) > 0);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">批量导入订单</h2>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode("image"); setRecords([]); setError(""); }}
          className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
            mode === "image"
              ? "bg-[#07C160] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          截图识别
        </button>
        <button
          onClick={() => { setMode("excel"); setRecords([]); setError(""); }}
          className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
            mode === "excel"
              ? "bg-[#07C160] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Excel 导入
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
        {mode === "excel" ? (
          <div>
            <label className="block text-sm text-gray-600 mb-2">上传识图导出的 Excel 文件（.xlsx）</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelFile}
              disabled={parsing || submitting}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#07C160] file:text-white hover:file:bg-[#06AD56]"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-2">上传转账截图（支持多张）</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFiles}
                disabled={parsing || submitting}
                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#07C160] file:text-white hover:file:bg-[#06AD56]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">收款账号</label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="输入收款账号"
                  className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">收款姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入收款姓名"
                  className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          </>
        )}
        {parsing && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="animate-spin h-4 w-4 text-[#07C160]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {mode === "image" ? "正在识别截图，请稍候..." : "解析中..."}
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {validRecords.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <p className="text-sm text-gray-500 mb-3">
              共识别到{" "}
              <span className="font-bold text-[#07C160]">{validRecords.length}</span>{" "}
              条有效记录，确认后批量创建订单
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400">
                    <th className="text-left py-2 pr-4 font-normal">时间</th>
                    <th className="text-right py-2 pr-4 font-normal">金额</th>
                    <th className="text-left py-2 pr-4 font-normal">状态</th>
                    {mode === "excel" && (
                      <>
                        <th className="text-left py-2 pr-4 font-normal">收款账号</th>
                        <th className="text-left py-2 font-normal">收款姓名</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {validRecords.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{r.时间}</td>
                      <td className="py-2 pr-4 text-right text-[#07C160] font-medium">¥{r.付款金额}</td>
                      <td className="py-2 pr-4">
                        <span className={r.状态 === "已完成" ? "text-green-600" : "text-gray-400"}>
                          {r.状态 || "已完成"}
                        </span>
                      </td>
                      {mode === "excel" && (
                        <>
                          <td className="py-2 pr-4 text-gray-600">{r.收款账号}</td>
                          <td className="py-2 text-gray-600">{r.收款姓名}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={submitting || !products.length}
            className="w-full bg-[#07C160] text-white py-2.5 rounded font-bold text-sm hover:bg-[#06AD56] disabled:opacity-50"
          >
            {submitting
              ? `导入中... (${progress.done}/${progress.total})`
              : `确认导入 ${validRecords.length} 条订单`}
          </button>
        </>
      )}
    </div>
  );
}
