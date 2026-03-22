import cv2
import numpy as np

def test():
    print("Start Diag")
    h, w = 512, 512
    img_f = np.random.rand(h, w).astype(np.float32)
    
    print("Testing copyMakeBorder...")
    padded = cv2.copyMakeBorder(img_f, 20, 20, 20, 20, cv2.BORDER_WRAP)
    print("copyMakeBorder OK")
    
    print("Testing GaussianBlur...")
    try:
        blur = cv2.GaussianBlur(padded, (0, 0), 10.0)
        print("GaussianBlur OK")
    except Exception as e:
        print(f"GaussianBlur Failed: {e}")
        
    print("Testing Sobel...")
    try:
        sobel = cv2.Sobel(padded, cv2.CV_64F, 1, 0, ksize=3)
        print("Sobel OK")
    except Exception as e:
        print(f"Sobel Failed: {e}")

    print("Testing Laplacian...")
    try:
        lap = cv2.Laplacian(padded, cv2.CV_64F)
        print("Laplacian OK")
    except Exception as e:
        print(f"Laplacian Failed: {e}")
        
    print("Testing Color Conv...")
    try:
        img_bgr = np.random.rand(h, w, 3).astype(np.float32)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        print("Color Conv OK")
    except Exception as e:
        print(f"Color Conv Failed: {e}")

if __name__ == "__main__":
    test()
