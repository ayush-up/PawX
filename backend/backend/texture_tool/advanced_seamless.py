import cv2
import numpy as np
import random

def generate_noise_mask(h, w, center_percent=0.6):
    """
    Generates an organic, cloud-like noise mask for blending.
    This avoids geometric transitions (sharp circles/squares).
    """
    mask = np.zeros((h, w), dtype=np.uint8)
    
    # 1. Start with a white center (the patch area)
    pad_y = int(h * (1 - center_percent) / 2)
    pad_x = int(w * (1 - center_percent) / 2)
    
    # Create a soft rectangular center
    cv2.rectangle(mask, (pad_x, pad_y), (w - pad_x, h - pad_y), 255, -1)
    
    # 2. Distort/Erode it with noise to make edges organic
    # We generate low-res noise and upscale it to get "cloudy" shapes
    noise_res = (w // 8, h // 8)
    noise = np.random.randint(0, 255, noise_res, dtype=np.uint8)
    noise = cv2.resize(noise, (w, h), interpolation=cv2.INTER_CUBIC)
    
    # Threshold noise to create holes/islands in the transition zone
    _, noise_thresh = cv2.threshold(noise, 128, 255, cv2.THRESH_BINARY)
    
    # Blend the noise into the mask edges
    # Blur the hard rectangle first
    mask = cv2.GaussianBlur(mask, (101, 101), 0)
    
    # Multiply/Combine with noise to break coherence
    # (Simple approach: Average them in the transition zone)
    mask = cv2.addWeighted(mask, 0.7, noise_thresh, 0.3, 0)
    
    # Re-normalize to binary-ish for seamlessClone mask (255 where src, 0 where dst)
    # White = Keep Patch (Original Center), Black = Keep Base (Offset Edges)
    _, final_mask = cv2.threshold(mask, 100, 255, cv2.THRESH_BINARY)
    
    # Final smooth to ensure valid domain for poisson
    # final_mask = cv2.GaussianBlur(final_mask, (5, 5), 0)
    
    return final_mask

def make_seamless(img, overlap_percent=0.25):
    """
    Pro-Grade Seamless Texture Generator.
    Uses 'Make it Tile' technique:
    1. Offset image (wrap mode).
    2. Overlay original image center (patch).
    3. Blend using Organic Noise Mask + Poisson Blending.
    """
    h, w = img.shape[:2]
    
    # 1. Base: Offset by 50% to hide original edges (they wrap around now)
    base = np.roll(img, (h // 2, w // 2), axis=(0, 1))
    
    # 2. Patch: One solid piece from the original (good interior)
    patch = img.copy()
    
    # 3. Mask: Organic Noise instead of Ellipse
    # The mask defines WHERE we see the PATCH.
    # We want the PATCH in the center (hide the offset seams).
    # We want the BASE at the edges (the seamless part).
    mask = generate_noise_mask(h, w, center_percent=0.75)
    
    center = (w // 2, h // 2)
    
    try:
        # NORMAL_CLONE allows the patch to overwrite the base structure more boldly,
        # obstructing the visible 'cross' seam from the offset base.
        # MIXED_CLONE sometimes ghosts if the contrast is high.
        # Let's try NORMAL_CLONE for "Opacity" style replacement, but with Poisson gradients.
        seamless = cv2.seamlessClone(patch, base, mask, center, cv2.NORMAL_CLONE)
    except Exception as e:
        print(f"Fallback: {e}")
        # Fallback: Alpha Blend if Poisson fails
        mask_f = mask.astype(np.float32) / 255.0
        mask_f = cv2.GaussianBlur(mask_f, (21, 21), 0) # Smooth transition
        if len(img.shape) == 3: mask_f = mask_f[..., None]
        seamless = (patch * mask_f + base * (1 - mask_f)).astype(np.uint8)
        
    return seamless
