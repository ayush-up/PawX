import cv2
import sys
import numpy as np
import argparse
import os

from backend.texture_tool.advanced_seamless import make_seamless
from backend.texture_tool.lighting import correct_lighting
from backend.texture_tool.pbr import generate_maps

def tile_preview(img, tiles=2):
    return np.tile(img, (tiles, tiles, 1))

def main():
    parser = argparse.ArgumentParser(description="TexForge Backend Texture Tool")
    parser.add_argument("image_path", help="Path to the input image")
    parser.add_argument("--lighting", action="store_true", help="Apply lighting correction (delighting)")
    parser.add_argument("--pbr", action="store_true", help="Generate PBR maps (Normal, Roughness, Height, Metallic)")
    
    args = parser.parse_args()
    
    path = args.image_path
    if not os.path.exists(path):
        print(f"Error: Image not found at {path}")
        return

    img = cv2.imread(path)
    if img is None:
        print("Error: Could not read image.")
        return

    print(f"Processing: {path}")

    # 1. Pipeline: Lighting Correction (Optional)
    if args.lighting:
        print("Applying lighting correction...")
        img = correct_lighting(img)

    # 2. Pipeline: Make Seamless
    print("Generating seamless texture...")
    seamless = make_seamless(img)
    cv2.imwrite("output_seamless.png", seamless)
    print("✅ output_seamless.png generated")

    # 3. Pipeline: Tiled Preview
    print("Generating preview...")
    tiled = tile_preview(seamless, 2)
    cv2.imwrite("output_tiled.png", tiled)
    print("✅ output_tiled.png generated")

    # 4. Pipeline: PBR Generation (Optional)
    if args.pbr:
        print("Generating PBR maps...")
        maps = generate_maps(seamless)
        for map_type, map_img in maps.items():
            out_name = f"output_{map_type}.png"
            cv2.imwrite(out_name, map_img)
            print(f"✅ {out_name} generated")

if __name__ == "__main__":
    main()
