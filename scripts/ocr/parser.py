import re
from typing import List, Dict, Any


def group_by_rows(ocr_results: List[Dict[str, Any]], y_tolerance: int = 15) -> List[List[Dict]]:
    """按Y坐标分组，将同一行的文字块归为一组"""
    if not ocr_results:
        return []

    sorted_results = sorted(ocr_results, key=lambda x: x["center_y"])
    rows = []
    current_row = [sorted_results[0]]

    for item in sorted_results[1:]:
        current_row_y = sum(i["center_y"] for i in current_row) / len(current_row)
        if abs(item["center_y"] - current_row_y) <= y_tolerance:
            current_row.append(item)
        else:
            current_row.sort(key=lambda x: x["center_x"])
            rows.append(current_row)
            current_row = [item]

    if current_row:
        current_row.sort(key=lambda x: x["center_x"])
        rows.append(current_row)

    return rows


def desensitize_name(name: str) -> str:
    name = name.strip()
    if len(name) == 3:
        return name[0] + "*" + name[2]
    elif len(name) == 2:
        return name[0] + "*"
    return name


def desensitize_account(account: str) -> str:
    digits = re.sub(r'\D', '', account)
    if len(digits) >= 12:
        return digits[:8] + "****" + digits[12:]
    return account


TIME_RE = re.compile(r'\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}')
# 匹配金额：可选¥前缀，数字含小数点，要求行内有"付款金额"标签
AMOUNT_RE = re.compile(r'[¥￥]?\s*([\d,]+\.\d+)')


def extract_records(ocr_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """从订单列表截图的OCR结果中提取所有订单记录"""
    rows = group_by_rows(ocr_results)

    tagged = []
    for row in rows:
        full_text = " ".join(item["text"] for item in row)
        if TIME_RE.search(full_text):
            tagged.append(("time", full_text))
        elif "付款金额" in full_text or "已完成" in full_text or "已取消" in full_text:
            tagged.append(("amount_status", full_text))
        else:
            tagged.append(("other", full_text))

    records = []
    for i, (rtype, full_text) in enumerate(tagged):
        if rtype != "time":
            continue

        time_val = TIME_RE.search(full_text).group().strip()
        # 补全日期和时间之间缺失的空格，如 "2026-04-0809:02:51" → "2026-04-08 09:02:51"
        time_val = re.sub(r'(\d{4}-\d{2}-\d{2})(\d{2}:\d{2}:\d{2})', r'\1 \2', time_val)

        amount = None
        status = None
        for j in range(i - 1, max(i - 5, -1), -1):
            if tagged[j][0] == "amount_status":
                prev_text = tagged[j][1]
                m = AMOUNT_RE.search(prev_text)
                if m:
                    amount = m.group(1).replace(",", "")
                if "已完成" in prev_text:
                    status = "已完成"
                elif "已取消" in prev_text:
                    status = "已取消"
                break

        warnings = []
        if amount is None:
            warnings.append("付款金额未识别")
        if status is None:
            warnings.append("状态未识别")

        records.append({
            "时间": time_val,
            "付款金额": amount or "",
            "状态": status or "",
            "_warnings": warnings,
        })

    return records
