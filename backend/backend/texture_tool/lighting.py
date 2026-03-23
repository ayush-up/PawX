import cv2
import numpy as np

def correct_lighting(img, sigma=50):
    """
    Corrects uneven lighting using a High-Pass filter approach.
    Lighting = Low Frequency (Gaussian Blur)
    Albedo = Original - Lighting + 128 (Mid-gray)
    
    NOTE: We add the mean of the original image instead of 128 to preserve the overall brightness.
    """
    img_float = img.astype(np.float32)
    
    # 1. Estimate low-frequency lighting
    blur = cv2.GaussianBlur(img_float, (0, 0), sigma)
    
    # 2. Subtract lighting
    # We want: Detail = Original - Lighting
    # But this centers around 0. We need to shift it back to the original's average brightness.
    mean_val = np.mean(img_float, axis=(0, 1))
    
    out = img_float - blur + mean_val
    
    return np.clip(out, 0, 255).astype(np.uint8)
