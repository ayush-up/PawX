import cv2
import numpy as np

def test():
    cv2.setUseOptimized(False)
    print("Optimizations Disabled.")
    
    img = np.random.rand(512, 512).astype(np.float32)
    padded = np.pad(img, ((20, 20), (20, 20)), mode='wrap')
    padded = np.ascontiguousarray(padded)
    
    try:
        blur = cv2.GaussianBlur(padded, (0, 0), 10.0)
        print("GaussianBlur OK with Opt=False")
    except Exception as e:
        print(f"GaussianBlur Failed: {e}")

if __name__ == "__main__":
    test()
