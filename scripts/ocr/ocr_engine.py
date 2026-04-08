from rapidocr_onnxruntime import RapidOCR
import numpy as np
import re
from typing import List, Dict, Any

_ocr_engine = None


def get_ocr_engine() -> RapidOCR:
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = RapidOCR()
    return _ocr_engine


def recognize(img: np.ndarray, confidence_threshold: float = 0.85) -> List[Dict[str, Any]]:
    """
    调用RapidOCR识别图片
    返回格式：
    [
        {
            "text": "总额",
            "box": [[x1,y1],[x2,y2],[x3,y3],[x4,y4]],
            "confidence": 0.99,
            "center_x": 100,
            "center_y": 380,
            "low_confidence": False
        },
        ...
    ]
    """
    engine = get_ocr_engine()
    result = engine(img)

    # RapidOCR 返回 (results_list, timing)
    # results_list 中每项为 [box, text, confidence]
    results_list = result[0]

    if not results_list:
        return []

    parsed = []
    for item in results_list:
        box, text, confidence = item[0], item[1], item[2]
        text = clean_text(text)
        if not text:
            continue

        box = [list(map(int, point)) for point in box]
        center_x = int(np.mean([p[0] for p in box]))
        center_y = int(np.mean([p[1] for p in box]))

        parsed.append({
            "text": text,
            "box": box,
            "confidence": round(float(confidence), 4),
            "center_x": center_x,
            "center_y": center_y,
            "low_confidence": float(confidence) < confidence_threshold
        })

    return parsed


def clean_text(text: str) -> str:
    """清洗识别结果：去掉乱码字符，保留中文、英文、数字、常见符号"""
    text = text.strip()
    cleaned = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s\.\-\:\%\¥\*\/]', '', text)
    return cleaned.strip()
