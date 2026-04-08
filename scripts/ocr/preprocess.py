import cv2
import numpy as np
from PIL import Image


def load_image(image_path: str) -> np.ndarray:
    """加载图片，统一转为OpenCV格式"""
    img = Image.open(image_path).convert("RGB")
    img = np.array(img)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    return img


def resize_image(img: np.ndarray, target_width: int = 1080) -> np.ndarray:
    """统一缩放到目标宽度，避免不同分辨率影响坐标对齐"""
    h, w = img.shape[:2]
    if w == target_width:
        return img
    scale = target_width / w
    new_h = int(h * scale)
    img = cv2.resize(img, (target_width, new_h), interpolation=cv2.INTER_LINEAR)
    return img


def detect_colored_banner_mask(img: np.ndarray) -> np.ndarray:
    """检测绿色/蓝色banner区域，返回掩码"""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    green_lower = np.array([40, 80, 80])
    green_upper = np.array([80, 255, 255])
    green_mask = cv2.inRange(hsv, green_lower, green_upper)

    blue_lower = np.array([100, 80, 80])
    blue_upper = np.array([140, 255, 255])
    blue_mask = cv2.inRange(hsv, blue_lower, blue_upper)

    return cv2.bitwise_or(green_mask, blue_mask)


def enhance_image(img: np.ndarray) -> np.ndarray:
    """
    图片增强：
    - 彩色 banner 区域：CLAHE 增强对比度，保留彩色，不做二值化
    - 普通区域：灰度 + 自适应二值化
    两部分合并输出，避免二值化破坏 banner 上的白色文字
    """
    combined_mask = detect_colored_banner_mask(img)

    # 膨胀掩码，覆盖 banner 边缘
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 5))
    banner_mask = cv2.dilate(combined_mask, kernel, iterations=2)

    # ---- 普通区域：灰度 + 自适应二值化 ----
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 10
    )
    binary_bgr = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)

    # ---- Banner 区域：CLAHE 增强，保留原色 ----
    banner_enhanced = img.copy()
    rows = np.any(banner_mask > 0, axis=1)
    if rows.any():
        row_indices = np.where(rows)[0]
        y_min, y_max = row_indices[0], row_indices[-1]
        region = banner_enhanced[y_min:y_max + 1].copy()
        lab = cv2.cvtColor(region, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        banner_enhanced[y_min:y_max + 1] = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    # ---- 合并：banner 区域用增强彩色，其余用二值化 ----
    mask_3ch = cv2.cvtColor(banner_mask, cv2.COLOR_GRAY2BGR)
    result = np.where(mask_3ch > 0, banner_enhanced, binary_bgr)
    return result.astype(np.uint8)


def preprocess(image_path: str, target_width: int = 1080) -> np.ndarray:
    """完整预处理流程入口"""
    img = load_image(image_path)
    img = resize_image(img, target_width)
    img = enhance_image(img)
    return img
