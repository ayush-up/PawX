import numpy as np

def make_seamless(img, feather=64):
    """
    Makes an image seamless by blending the edges towards a shared average.
    This ensures that img[0] matches img[H-1] and img[:, 0] matches img[:, W-1].
    """
    h, w, _ = img.shape
    out = img.copy().astype(np.float32)

    # --- Vertical Seam (Top & Bottom) ---
    # We want top row and bottom row to become identical (average of both).
    # Then we blend from that average towards the original content over 'feather' pixels.
    
    # Get the source edges
    top_edge = out[0].copy()
    bottom_edge = out[h - 1].copy()
    
    # Calculate target edge (average)
    vertical_target = (top_edge + bottom_edge) * 0.5
    
    for y in range(feather):
        # 0.0 at the edge, 1.0 at 'feather' distance
        alpha = y / float(feather)
        
        # Blend Top: Target -> Original
        out[y] = vertical_target * (1 - alpha) + out[y] * alpha
        
        # Blend Bottom: Target -> Original (counting backwards from bottom)
        out[h - 1 - y] = vertical_target * (1 - alpha) + out[h - 1 - y] * alpha

    # --- Horizontal Seam (Left & Right) ---
    # Same logic for Left/Right cols, operating on the ALREADY vertically blended image.
    
    left_edge = out[:, 0].copy()
    right_edge = out[:, w - 1].copy()
    
    horizontal_target = (left_edge + right_edge) * 0.5
    
    for x in range(feather):
        alpha = x / float(feather)
        
        # Blend Left
        out[:, x] = horizontal_target * (1 - alpha) + out[:, x] * alpha
        
        # Blend Right
        out[:, w - 1 - x] = horizontal_target * (1 - alpha) + out[:, w - 1 - x] * alpha

    return np.clip(out, 0, 255).astype(np.uint8)
