import cv2
import numpy as np

def apply_filter_seamless(img, filter_func, pad_size):
    """
    Applies a filtering function with seamless padding (WRAP).
    Ensures that convolution operations do not create seams at the edges.
    """
    # Pad with WRAP to simulate infinite tiling using NumPy (more robust than cv2.BORDER_WRAP on some builds)
    # img is (H, W) or (H, W, C)
    if len(img.shape) == 2:
        padded = np.pad(img, ((pad_size, pad_size), (pad_size, pad_size)), mode='wrap')
    else:
        padded = np.pad(img, ((pad_size, pad_size), (pad_size, pad_size), (0, 0)), mode='wrap')
    
    padded = np.ascontiguousarray(padded)
    
    # Apply the filter
    filtered = filter_func(padded)
    
    # Crop back to original size
    h, w = img.shape[:2]
    # If the output size matches the padded size (e.g. blur), we crop center
    if filtered.shape[0] == padded.shape[0]:
        return filtered[pad_size:pad_size+h, pad_size:pad_size+w]
    return filtered

class PBRGenerator:
    def __init__(self, params=None):
        self.params = params or {}
        # Defaults
        self.normal_strength = self.params.get('normal_strength', 1.0)
        self.roughness_min = self.params.get('roughness_min', 0.1)
        self.roughness_max = self.params.get('roughness_max', 0.9)
        self.metallic_type = self.params.get('metallic_type', 'non_metal') # non_metal, metal, composite

    def process(self, img):
        # 1. Pre-process (Float32)
        img_f = img.astype(np.float32) / 255.0
        
        # 2. Height Map (Advanced Frequency Separation)
        height_f = self._generate_height(img_f)
        height = (height_f * 255).astype(np.uint8)
        
        # 3. Normal Map
        normal_map = self._generate_normal(height_f)
        
        # 4. Roughness Map
        roughness = self._generate_roughness(height_f)
        
        # 5. Metallic Map
        metallic = self._generate_metallic(height_f, self.metallic_type)
        
        return {
            "normal": normal_map,
            "roughness": roughness,
            "height": height,
            "metallic": metallic
        }

    def _generate_height(self, img_f):
        """
        Generates height using frequency separation to capture both large shapes and fine details.
        """
        # Luminance
        gray = cv2.cvtColor(img_f, cv2.COLOR_BGR2GRAY)
        
        # Frequency Separation
        # Low Frequency (Shape) - Large blur
        low_freq = apply_filter_seamless(gray, lambda x: cv2.GaussianBlur(x, (0, 0), 10.0), 20)
        
        # High Frequency (Detail) - Difference
        high_freq = gray - low_freq
        
        # Combine: Enhance shapes slightly, preserve details
        # Weights can be parameterized
        alpha = 0.6  # Low freq weight
        beta = 0.4   # High freq weight (enhanced)
        
        # We want to re-center the high frequency around the low frequency
        # But for height, we often want to amplify the high variance
        
        # Simple Weighted Add:
        height = (low_freq * 1.0) + (high_freq * 2.0)
        
        # Normalize to [0, 1] without clipping too hard
        h_min, h_max = height.min(), height.max()
        if h_max - h_min > 1e-5:
            height = (height - h_min) / (h_max - h_min)
        else:
            height = np.zeros_like(height)
            
        return height

    def _generate_normal(self, height_f):
        """
        Generates normal map using Sobel filters with seamless padding.
        """
        # Sobel with Seamless Padding
        # We need a wrapper lambda that applies Sobel and returns the result
        # Note: Sobel kernel size 3 needs pad=1, but let's give it 2 for safety with Gaussian pre-smooth if needed.
        
        def sobel_x(img): return cv2.Sobel(img, cv2.CV_32F, 1, 0, ksize=3)
        def sobel_y(img): return cv2.Sobel(img, cv2.CV_32F, 0, 1, ksize=3)
        
        # Use a small pre-blur on height for normals to reduce noise?
        # Maybe optional. For now, raw height.
        gx = apply_filter_seamless(height_f, sobel_x, 2)
        gy = apply_filter_seamless(height_f, sobel_y, 2)
        
        # Strength
        strength = self.normal_strength
        z_c = np.ones_like(gx) * (1.0 / strength)
        
        # Invert gradients for Green/Red channels as per standard
        # N = T x B
        nx = -gx
        ny = -gy
        nz = z_c
        
        # Normalize
        mag = np.sqrt(nx**2 + ny**2 + nz**2)
        np.maximum(mag, 1e-5, out=mag)
        
        nx /= mag
        ny /= mag
        nz /= mag
        
        # Encode [0, 255]
        norm_x = ((nx + 1.0) * 0.5 * 255).astype(np.uint8)
        norm_y = ((ny + 1.0) * 0.5 * 255).astype(np.uint8)
        norm_z = ((nz + 1.0) * 0.5 * 255).astype(np.uint8)
        
        return cv2.merge([norm_z, norm_y, norm_x])

    def _generate_roughness(self, height_f):
        """
        Generates roughness based on height and detail.
        High/Worn areas -> Smooth (Low Roughness)
        Low/Recessed areas -> Rough (High Roughness)
        """
        # Base: Inverted Height
        roughness = 1.0 - height_f
        
        # Remap to physical range
        r_min, r_max = self.roughness_min, self.roughness_max
        roughness = roughness * (r_max - r_min) + r_min
        
        # Output
        return (roughness * 255).astype(np.uint8)

    def _generate_metallic(self, height_f, mode):
        """
        Generates metallic map based on mode.
        """
        h, w = height_f.shape
        
        if mode == 'metal':
            return np.full((h, w), 255, dtype=np.uint8)
        
        elif mode == 'painted_metal':
            # Edge detection to find worn edges
            # Edges -> Metal (255)
            # Surface -> Paint (0) or slightly glossy
            
            # Simple curvature approximation using Laplacian
            def laplacian(img): return cv2.Laplacian(img, cv2.CV_32F)
            curv = apply_filter_seamless(height_f, laplacian, 2)
            
            # High positive curvature = Peaks/Edges
            # Normalize curvature
            curv = np.abs(curv)
            curv = (curv - curv.min()) / (curv.max() - curv.min() + 1e-9)
            
            # Threshold
            mask = curv > 0.6 # Top 40% edges
            metallic = np.zeros((h, w), dtype=np.uint8)
            metallic[mask] = 255
            return metallic
            
        else: # non_metal
            return np.zeros((h, w), dtype=np.uint8)

def generate_maps(img, base_name="output"):
    """
    Legacy wrapper for the PBRGenerator.
    """
    generator = PBRGenerator()
    return generator.process(img)
