import sys
import os
import json
import traceback

from preprocess import preprocess
from ocr_engine import recognize
from parser import extract_records

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def process_image(image_path):
    filename = os.path.basename(image_path)
    try:
        img = preprocess(image_path)
        ocr_results = recognize(img)

        if not ocr_results:
            return [{"filename": filename, "status": "failed", "error": "OCR未识别到任何文字"}]

        records = extract_records(ocr_results)

        if not records:
            return [{"filename": filename, "status": "failed", "error": "未识别到任何订单记录"}]

        results = []
        for r in records:
            results.append({
                "filename": filename,
                "status": "ok" if not r["_warnings"] else "warning",
                "warnings": r["_warnings"],
                "时间": r["时间"],
                "付款金额": r["付款金额"],
                "状态": r["状态"],
                "付款人姓名": r["付款人姓名"],
            })
        return results

    except Exception as e:
        return [{"filename": filename, "status": "failed", "error": str(e)}]


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "用法: python3 process.py <图片路径1> [图片路径2] ..."}))
        sys.exit(1)

    all_records = []
    for image_path in sys.argv[1:]:
        if not os.path.isfile(image_path):
            all_records.append({"filename": os.path.basename(image_path), "status": "failed", "error": "文件不存在"})
            continue
        ext = os.path.splitext(image_path)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            all_records.append({"filename": os.path.basename(image_path), "status": "failed", "error": f"不支持的格式: {ext}"})
            continue
        all_records.extend(process_image(image_path))

    print(json.dumps(all_records, ensure_ascii=False))


if __name__ == "__main__":
    main()
