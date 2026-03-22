import os
import time
import base64
import numpy as np
import cv2
import gc
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Numba & Resource Stability for Render Free Tier (0.1 CPU, 512MB RAM)
os.environ['NUMBA_CACHE_DIR'] = '/tmp/numba_cache'
os.environ['NUMBA_PARALLEL_DIAGNOSTICS'] = '0'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'

# Import backend logic
from backend.texture_tool.advanced_seamless import make_seamless
from backend.texture_tool.lighting import correct_lighting
from backend.texture_tool.pbr import generate_maps


# Global AI Engine Initialization (Saves 10s per request)
REMBG_SESSION = None
try:
    from rembg import new_session
    # Lite model [u2netp] is optimized for CPU-only small-RAM servers
    REMBG_SESSION = new_session("u2netp")
    print("✅ AI Engine [Lite + Thread-Limited] initialized and ready.")
except Exception as e:
    print(f"⚠️ AI Engine warning: {e}")

app = Flask(__name__)
CORS(app) 

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024 # 50 MB max size for large base64 arrays
UPLOAD_FOLDER = 'uploads'
# We don't really rely on OUTPUT_FOLDER anymore for the immediate response
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/outputs/<path:filename>')
def serve_output(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)

@app.route('/process', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Save input temporarily? Or just read from memory?
    # Saving input might trigger reload if input is inside watched folder?
    # backend/uploads is inside backend/, usually Live Server watches root.
    # But usually 'uploads' folder is fine if ignored.
    # Let's save to a temp filename
    
    # Read image directly from memory (Zero Disk Write)
    # file.read() gives bytes.
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    
    if img is None:
        return jsonify({"error": "Could not decode image"}), 500
        
    # Options
    do_seamless = request.form.get('seamless') == 'true'
    do_pbr = request.form.get('pbr') == 'true'
    do_lighting = request.form.get('lighting') == 'true'
    
    # --- Pipeline ---
    processed_img = img
    
    # 1. Lighting
    if do_lighting:
        processed_img = correct_lighting(processed_img)
        
    # 2. Seamless
    if do_seamless:
        processed_img = make_seamless(processed_img)
    
    # 3. Base64 Encoding
    # Helper to encode
    def encode_b64(cv_img):
        _, buf = cv2.imencode('.png', cv_img)
        return f"data:image/png;base64,{base64.b64encode(buf).decode('utf-8')}"

    response_data = {
        "Seamless Texture": encode_b64(processed_img)
    }
    
    # 4. PBR Maps
    # Check individual flags
    # We default to False if not present
    req_normal = request.form.get('pbr_normal') == 'true'
    req_rough = request.form.get('pbr_rough') == 'true'
    req_height = request.form.get('pbr_height') == 'true'
    req_metal = request.form.get('pbr_metal') == 'true'
    
    # If "PBR Maps" master is checked, but no children (weird state), maybe default to all? 
    # Or just trust the frontend. Let's trust the frontend individual flags.
    
    # Fix: If 'pbr' is false (because one child is unchecked), we still want to generate 
    # if ANY child is checked.
    any_pbr = req_normal or req_rough or req_height or req_metal
    
    if do_pbr or any_pbr:
        maps = generate_maps(processed_img)
        for map_type, map_img in maps.items():
            # map_type is "normal", "roughness", "height", "metallic"
            
            should_include = False
            if map_type == "normal" and req_normal: should_include = True
            if map_type == "roughness" and req_rough: should_include = True
            if map_type == "height" and req_height: should_include = True
            if map_type == "metallic" and req_metal: should_include = True
            
            if should_include:
                key = f"{map_type.capitalize()} Map"
                response_data[key] = encode_b64(map_img)

    return jsonify(response_data)

# --- Spritesheet Endpoints ---

import tempfile

@app.route('/extract-frames', methods=['POST'])
def extract_frames():
    if 'video' not in request.files:
        return jsonify({"error": "No video uploaded"}), 400
    
    file = request.files['video']
    fps_extract_rate = int(request.form.get('fps_rate', 1)) # Default 1 frame per second
    
    # Save the video temporarily to the OS temp directory to avoid live server reload
    fd, temp_video_path = tempfile.mkstemp(suffix='.mp4')
    os.close(fd) # Close the file descriptor, we'll let file.save handle writing
    
    file.save(temp_video_path)

    cap = cv2.VideoCapture(temp_video_path)
    if not cap.isOpened():
        os.remove(temp_video_path) # Cleanup on error
        return jsonify({"error": "Could not open video file"}), 500

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if video_fps <= 0:
        video_fps = 30 # Fallback if FPS cannot be read
    
    # Calculate how many frames to skip to get the desired frames per second
    frame_skip = max(1, int(video_fps / fps_extract_rate))

    frames_b64 = []
    frame_count = 0
    success, image = cap.read()
    
    while success:
        if frame_count % frame_skip == 0:
            # Resize frame to save memory (e.g., max 512px height)
            h, w = image.shape[:2]
            if h > 512:
                ratio = 512.0 / h
                new_w = int(w * ratio)
                image = cv2.resize(image, (new_w, 512))
                
            _, buf = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 80])
            b64_str = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"
            frames_b64.append(b64_str)
            
        success, image = cap.read()
        frame_count += 1
        
        # Hard limit to prevent memory crash on very long videos
        if len(frames_b64) > 200:
            break

    cap.release()
    try:
        os.remove(temp_video_path)
    except Exception as e:
        print(f"Warning: could not delete temp video: {e}")

    return jsonify({"frames": frames_b64})

@app.route('/generate-spritesheet', methods=['POST'])
def generate_spritesheet():
    data = request.json
    if not data or 'frames' not in data:
        return jsonify({"error": "No frames provided"}), 400
        
    base64_frames = data['frames']
    grid_layout = data.get('grid_layout', 'auto')
    remove_bg = data.get('remove_bg', False)
    
    if not base64_frames:
        return jsonify({"error": "Empty frame list"}), 400

    start_time = time.time()
    decode_start = time.time() # Initialize early to avoid NameError
    
    # Use Global AI Session (Pre-loaded for speed)
    rembg_session = REMBG_SESSION if remove_bg else None
    
    cv_frames = []
    for i, b64 in enumerate(base64_frames):
        try:
            # 1. Decode
            b64_data = b64.split(',')[-1]
            b64_data += "=" * ((4 - len(b64_data) % 4) % 4)
            img_bytes = base64.b64decode(b64_data)
            
            # 2. Pre-process (Resize for AI Speed and RAM safety)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)
            if img is None: continue

            # Scale down for AI pass (Max 512px) - This makes it 10x faster
            h, w = img.shape[:2]
            max_dim = 512
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

            # 3. AI Pass
            if remove_bg and REMBG_SESSION:
                # Convert back to bytes for rembg
                _, buffer = cv2.imencode('.png', img)
                img_bytes = buffer.tobytes()
                
                from rembg import remove as rembg_inner_remove
                img_bytes = rembg_inner_remove(img_bytes, session=REMBG_SESSION)
                
                # Re-decode to CV2
                np_arr = np.frombuffer(img_bytes, np.uint8)
                img = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)

            if img is not None:
                if len(img.shape) == 2: img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGRA)
                elif img.shape[2] == 3: img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
                cv_frames.append(img)
            
            # Explicit Cleanup
            import gc
            gc.collect()

        except Exception as e:
            print(f"Frame {i} error: {e}")
            continue

    try:
        print(f"[{time.time() - decode_start:.2f}s] Processing complete. Frames: {len(cv_frames)}")
    except: pass
    stitch_start = time.time()
    
    if not cv_frames:
        return jsonify({"error": "Could not decode any frames"}), 500
        
    num_frames = len(cv_frames)
    frame_h, frame_w = cv_frames[0].shape[:2]

    # Determine Grid Size (Cols x Rows)
    if grid_layout == 'row':
        cols = num_frames
        rows = 1
    elif grid_layout == '4x4':
        cols = 4
        rows = int(np.ceil(num_frames / 4.0))
    elif grid_layout == '8x8':
        cols = 8
        rows = int(np.ceil(num_frames / 8.0))
    else: # auto
        # Try to make it square-ish
        cols = int(np.ceil(np.sqrt(num_frames)))
        rows = int(np.ceil(num_frames / cols))
        
    # Calculate output spritesheet size
    sheet_w = cols * frame_w
    sheet_h = rows * frame_h
    
    # Create empty spritesheet canvas (transparent background - 4 channels)
    spritesheet = np.zeros((sheet_h, sheet_w, 4), dtype=np.uint8)
    
    # Place frames
    for i, frame in enumerate(cv_frames):
        row = i // cols
        col = i % cols
        
        # Resize frame if it's not the same size as the first one (safety check)
        if frame.shape[:2] != (frame_h, frame_w):
            frame = cv2.resize(frame, (frame_w, frame_h))
            
        y = row * frame_h
        x = col * frame_w
        spritesheet[y:y+frame_h, x:x+frame_w] = frame
        
    # Encode output
    _, buf = cv2.imencode('.png', spritesheet)
    out_b64 = f"data:image/png;base64,{base64.b64encode(buf).decode('utf-8')}"
    
    print(f"[{time.time() - stitch_start:.2f}s] Spritesheet stitching and encoding complete. Total time: {time.time() - start_time:.2f}s")
    
    return jsonify({"spritesheet": out_b64})

@app.route('/extract-sprites-points', methods=['POST'])
def extract_sprites_points():
    import json
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    if 'points' not in request.form:
        return jsonify({"error": "No points provided"}), 400
        
    file = request.files['image']
    points_str = request.form['points']
    remove_bg = request.form.get('remove_bg', 'false') == 'true'
    
    try:
        points = json.loads(points_str)
    except Exception:
        return jsonify({"error": "Invalid points format"}), 400
        
    if not points:
        return jsonify({"error": "Points list is empty"}), 400

    start_time = time.time()
    
    # Read raw bytes
    file_bytes = file.read()
    np_arr = np.frombuffer(file_bytes, np.uint8)
    img_orig = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)
    
    if img_orig is None:
        return jsonify({"error": "Failed to decode image"}), 400
    
    # Check if we can use FastSAM
    use_fastsam = False
    model = None
    try:
        import os
        from ultralytics import FastSAM
        # Suppress ultralytics logging by setting YOLO_VERBOSE
        os.environ['YOLO_VERBOSE'] = 'False'
        model = FastSAM("FastSAM-s.pt")
        use_fastsam = True
    except Exception as e:
        print(f"FastSAM unavailable: {e}. Falling back to OpenCV.")
        
    extracted_sprites = []
    
    if use_fastsam:
        img_rgb = cv2.cvtColor(img_orig, cv2.COLOR_BGR2RGB) if len(img_orig.shape) == 3 else cv2.cvtColor(img_orig, cv2.COLOR_GRAY2RGB)
        # Drop alpha channel for FastSAM processing if exists, SAM expects RGB
        if img_rgb.shape[2] == 4:
            img_rgb = img_rgb[:, :, :3]
            
        for pt in points:
            px, py = int(pt.get('x', 0)), int(pt.get('y', 0))
            
            try:
                # Run FastSAM
                results = model(img_rgb, device='cpu', points=[[px, py]], labels=[1], retina_masks=True, verbose=False)
                
                if not results or not results[0].masks:
                    print(f"FastSAM found no mask for point {px}, {py}")
                    continue
                    
                mask_np = results[0].masks.data[0].cpu().numpy()
                mask_uint8 = (mask_np * 255).astype(np.uint8)
                
                if mask_uint8.shape != img_orig.shape[:2]:
                    mask_uint8 = cv2.resize(mask_uint8, (img_orig.shape[1], img_orig.shape[0]), interpolation=cv2.INTER_NEAREST)
                    
                x, y, w, h = cv2.boundingRect(mask_uint8)
                
                if w < 5 or h < 5:
                    continue
                    
                pad = 10
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(img_orig.shape[1], x + w + pad)
                y2 = min(img_orig.shape[0], y + h + pad)
                
                cropped = img_orig[y1:y2, x1:x2].copy()
                
                _, buf = cv2.imencode('.png', cropped)
                b64_str = f"data:image/png;base64,{base64.b64encode(buf).decode('utf-8')}"
                extracted_sprites.append(b64_str)
                
            except Exception as e:
                print(f"FastSAM error at pt {px},{py}: {e}")
                
    else:
        # Fallback to OpenCV Contour Method
        try:
            if len(img_orig.shape) == 3 and img_orig.shape[2] == 4:
                alpha = img_orig[:, :, 3]
                _, mask = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)
                kernel = np.ones((3,3), np.uint8)
                mask = cv2.dilate(mask, kernel, iterations=1)
            else:
                gray = cv2.cvtColor(img_orig, cv2.COLOR_BGR2GRAY) if len(img_orig.shape) == 3 else img_orig
                blurred = cv2.GaussianBlur(gray, (3, 3), 0)
                v = np.median(blurred)
                lower = int(max(0, (1.0 - 0.33) * v))
                upper = int(min(255, (1.0 + 0.33) * v))
                edges = cv2.Canny(blurred, lower, upper)
                
                kernel = np.ones((3, 3), np.uint8)
                mask = cv2.dilate(edges, kernel, iterations=2)
                mask = cv2.erode(mask, kernel, iterations=1)
                
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            valid_contours = []
            for c in contours:
                x, y, w, h = cv2.boundingRect(c)
                if w >= 8 and h >= 8:
                    valid_contours.append(c)
                    
            extracted_contour_indices = set()
            
            for pt in points:
                px, py = pt.get('x', 0), pt.get('y', 0)
                
                best_contour_idx = -1
                min_dist = float('inf')
                
                for i, contour in enumerate(valid_contours):
                    if i in extracted_contour_indices:
                        continue
                        
                    dist = cv2.pointPolygonTest(contour, (px, py), True)
                    
                    if dist >= 0:
                        best_contour_idx = i
                        break
                    else:
                        abs_dist = abs(dist)
                        if abs_dist < min_dist:
                            min_dist = abs_dist
                            best_contour_idx = i
                            
                # Fallback distance of 200px incase users miss by a margin in dense grids
                if best_contour_idx != -1 and (min_dist < 200 or min_dist == float('inf')): 
                    contour = valid_contours[best_contour_idx]
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    pad = 10
                    x1 = max(0, x - pad)
                    y1 = max(0, y - pad)
                    x2 = min(img_orig.shape[1], x + w + pad)
                    y2 = min(img_orig.shape[0], y + h + pad)
                    
                    cropped = img_orig[y1:y2, x1:x2]
                    
                    _, buf = cv2.imencode('.png', cropped)
                    b64_str = f"data:image/png;base64,{base64.b64encode(buf).decode('utf-8')}"
                    extracted_sprites.append(b64_str)
                    
                    extracted_contour_indices.add(best_contour_idx)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    print(f"[{time.time() - start_time:.2f}s] Sprites extracted based on points.")
    return jsonify({"sprites": extracted_sprites})

@app.route('/remove-bg-single', methods=['POST'])

def remove_bg_single():
    data = request.json
    if not data or 'image' not in data:
        return jsonify({"error": "No image provided"}), 400
        
    b64_data = data['image'].split(',')[-1]
    b64_data += "=" * ((4 - len(b64_data) % 4) % 4)
    
    try:
        from rembg import remove
        img_bytes = base64.b64decode(b64_data)
        # Use Global AI session!
        out_bytes = remove(img_bytes, session=REMBG_SESSION)
        
        out_b64 = f"data:image/png;base64,{base64.b64encode(out_bytes).decode('utf-8')}"
        return jsonify({"image": out_b64})
    except Exception as e:
        print(f"rembg error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Production ready port and host
    import os
    port = int(os.environ.get('PORT', 8000))
    app.run(debug=False, host='0.0.0.0', port=port)
