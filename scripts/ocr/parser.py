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
    if len(name) < 2:
        return name
    if len(name) == 2:
        return name[0] + "*"
    return name[0] + "*" * (len(name) - 2) + name[-1]


def desensitize_account(account: str) -> str:
    digits = re.sub(r'\D', '', account)
    if len(digits) >= 12:
        return digits[:8] + "****" + digits[12:]
    return account


TIME_RE = re.compile(r'\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}:\d{2}')
AMOUNT_RE = re.compile(r'([\d,]+\.\d+)')
NAME_RE = re.compile(r'[一-龥]{2,}')
NAME_LABEL_RE = re.compile(r'付款人\s*姓名|付款人|^姓名')


def extract_records(ocr_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """从订单详情截图的OCR结果中提取单条订单记录"""
    rows = group_by_rows(ocr_results)
    if not rows:
        return []

    row_texts = [" ".join(item["text"] for item in row) for row in rows]
    full_text = " ".join(row_texts)

    # ---- 时间 ----
    time_val = ""
    for text in row_texts:
        if "创建时间" in text:
            m = TIME_RE.search(text)
            if m:
                time_val = m.group().strip()
                break
    if not time_val:
        m = TIME_RE.search(full_text)
        if m:
            time_val = m.group().strip()
    if time_val:
        time_val = re.sub(r'(\d{4}-\d{2}-\d{2})(\d{2}:\d{2}:\d{2})', r'\1 \2', time_val)

    # ---- 金额：优先从"总额"行取 ----
    amount = ""
    for text in row_texts:
        if "总额" in text:
            m = AMOUNT_RE.search(text)
            if m:
                amount = m.group(1).replace(",", "")
                break

    # ---- 状态 ----
    status = ""
    if "交易已完成" in full_text or "已完成" in full_text:
        status = "已完成"
    elif "交易已取消" in full_text or "已取消" in full_text:
        status = "已取消"

    # ---- 付款人姓名 + 脱敏：取标签行最后一个中文串，避免"姓名"被误识别为值 ----
    payer = ""
    for text in row_texts:
        if NAME_LABEL_RE.search(text):
            remainder = re.sub(r'付款人\s*姓名|付款人|姓名', '', text).strip()
            names = NAME_RE.findall(remainder)
            if names:
                payer = desensitize_name(names[-1])
                break

    warnings = []
    if not time_val:
        warnings.append("创建时间未识别")
    if not amount:
        warnings.append("总额未识别")
    if not status:
        warnings.append("状态未识别")
    if not payer:
        warnings.append("付款人姓名未识别")

    return [{
        "时间": time_val,
        "付款金额": amount,
        "状态": status,
        "付款人姓名": payer,
        "_warnings": warnings,
    }]
