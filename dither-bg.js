/**
 * DITHER BACKGROUND EFFECT
 * ------------------------
 * Organic flowing wave patterns rendered through Bayer dithering.
 * Uses layered Simplex noise for smooth, lava-lamp-like shapes.
 * Mouse hover clears noise in a radius around the cursor.
 */
(function () {
    // === CONFIG ===
    const PIXEL_SIZE = 1;               // Size of each dither dot (smaller = finer)
    const NOISE_SCALE = 0.0025;         // Scale of the noise (smaller = larger shapes)
    const ANIM_SPEED = 0.0005;           // Animation speed (visible flow)
    const FLOW_ANGLE = Math.PI * 0.75;  // Flow direction: bottom-left to top-right
    const FLOW_DX = Math.cos(FLOW_ANGLE);
    const FLOW_DY = Math.sin(FLOW_ANGLE);
    const MOUSE_RADIUS = 130;           // Mouse clear zone radius
    const MOUSE_FADE_EDGE = 70;         // Soft edge fade
    const NOISE_COLOR_R = 255;          // White
    const NOISE_COLOR_G = 255;
    const NOISE_COLOR_B = 255;
    const BRIGHTNESS = 0.28;            // Overall brightness (0–1, subtle)
    const CONTRAST = 1.6;               // Contrast multiplier
    const OCTAVES = 3;                  // Noise layers (more = more detail)
    const PERSISTENCE = 0.01;            // How much each octave contributes
    const WARP_STRENGTH = 0.8;          // Domain warp intensity (fluid look)
    const CANVAS_SCALE = 0.5;           // Render at half res for performance
    const FPS_CAP = 30;

    // === STATE ===
    let mouseX = -9999, mouseY = -9999;
    let animTime = 0;
    let lastFrameTime = 0;
    const frameInterval = 1000 / FPS_CAP;

    // === SIMPLEX NOISE IMPLEMENTATION ===
    // Based on Stefan Gustavson's simplex noise
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    // Permutation table
    const perm = new Uint8Array(512);
    const grad3 = [
        [1, 1], [-1, 1], [1, -1], [-1, -1],
        [1, 0], [-1, 0], [0, 1], [0, -1]
    ];

    // Seed the permutation table
    (function seedNoise() {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        // Fisher-Yates shuffle with fixed seed
        let seed = 42;
        for (let i = 255; i > 0; i--) {
            seed = (seed * 16807 + 0) % 2147483647;
            const j = seed % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    })();

    function dot2(g, x, y) { return g[0] * x + g[1] * y; }

    function simplex2D(xin, yin) {
        let n0, n1, n2;
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;

        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; }
        else { i1 = 0; j1 = 1; }

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;

        const ii = i & 255;
        const jj = j & 255;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0;
        else {
            t0 *= t0;
            const gi0 = perm[ii + perm[jj]] % 8;
            n0 = t0 * t0 * dot2(grad3[gi0], x0, y0);
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0;
        else {
            t1 *= t1;
            const gi1 = perm[ii + i1 + perm[jj + j1]] % 8;
            n1 = t1 * t1 * dot2(grad3[gi1], x1, y1);
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0;
        else {
            t2 *= t2;
            const gi2 = perm[ii + 1 + perm[jj + 1]] % 8;
            n2 = t2 * t2 * dot2(grad3[gi2], x2, y2);
        }

        // Returns value in range [-1, 1]
        return 70 * (n0 + n1 + n2);
    }

    // Multi-octave fractal noise
    function fbm(x, y) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < OCTAVES; i++) {
            value += amplitude * simplex2D(x * frequency, y * frequency);
            maxValue += amplitude;
            amplitude *= PERSISTENCE;
            frequency *= 2;
        }

        return value / maxValue; // Normalized to [-1, 1]
    }

    // === BAYER DITHER MATRIX (8x8 for smoother gradients) ===
    const bayerMatrix8 = [
        [ 0, 32,  8, 40,  2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44,  4, 36, 14, 46,  6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [ 3, 35, 11, 43,  1, 33,  9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47,  7, 39, 13, 45,  5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21]
    ];
    const bayerSize = 8;
    const bayerLevels = 64;

    // === CREATE CANVAS ===
    const canvas = document.createElement('canvas');
    canvas.id = 'dither-bg-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 0;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);

    // Push content above canvas
    const layerStyle = document.createElement('style');
    layerStyle.textContent = `
        .navbar {
            position: sticky;
            z-index: 1000 !important;
        }
        .hero-cinematic,
        .hero,
        .tool-grid-container,
        .tool-wrapper,
        .about-section,
        .contact-section,
        footer,
        section,
        header {
            position: relative;
            z-index: 1;
        }
        .hero {
            background: transparent !important;
            position: relative;
        }
        /* CSS mask for hero titles to hide the noise behind them smoothly */
        .hero::before, .hero-cinematic::before, .section-title::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 300px;
            background: radial-gradient(ellipse at center, rgba(8,8,8,1) 0%, rgba(8,8,8,0) 70%);
            pointer-events: none;
            z-index: -1;
        }
        .hero h2, .hero .subtext, .hero-cinematic h1, .hero-cinematic p, .section-title {
            position: relative;
            z-index: 1;
        }
        .tool-wrapper {
            background: transparent !important;
        }
        /* Hide noise inside the drag-and-drop area by giving it a solid background */
        .big-drop {
            background: #080808 !important;
        }
    `;
    document.head.appendChild(layerStyle);

    const ctx = canvas.getContext('2d');

    // === RESIZE ===
    function resize() {
        canvas.width = Math.floor(window.innerWidth * CANVAS_SCALE);
        canvas.height = Math.floor(window.innerHeight * CANVAS_SCALE);
    }
    window.addEventListener('resize', resize);
    resize();

    // === MOUSE MASKS ===
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX * CANVAS_SCALE;
        mouseY = e.clientY * CANVAS_SCALE;
    });
    document.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
    });

    // === RENDER ===
    function render(timestamp) {
        requestAnimationFrame(render);

        const elapsed = timestamp - lastFrameTime;
        if (elapsed < frameInterval) return;
        lastFrameTime = timestamp - (elapsed % frameInterval);

        const w = canvas.width;
        const h = canvas.height;

        animTime += ANIM_SPEED * (elapsed / 16.67); // Normalize to ~60fps

        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;

        const mouseRadScaled = MOUSE_RADIUS * CANVAS_SCALE;
        const mouseFadeScaled = MOUSE_FADE_EDGE * CANVAS_SCALE;
        const totalMouseRad = mouseRadScaled + mouseFadeScaled;

        for (let y = 0; y < h; y += PIXEL_SIZE) {
            for (let x = 0; x < w; x += PIXEL_SIZE) {
                let sampleX = x;
                let sampleY = y;
                
                const dx = x - mouseX;
                const dy = y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Act as a solid rock splitting the fluid
                const rockRadius = MOUSE_RADIUS * CANVAS_SCALE; 
                if (dist < rockRadius * 2 && dist > 0.1) {
                    const falloff = 1 - (dist / (rockRadius * 2));
                    // Strong cubed falloff pushes pixels outward sharply like a solid boundary
                    const repel = Math.pow(falloff, 3) * rockRadius * 2.5; 
                    sampleX += (dx / dist) * repel;
                    sampleY += (dy / dist) * repel;
                }

                // Get organic noise coordinates
                const nx = sampleX * NOISE_SCALE;
                const ny = sampleY * NOISE_SCALE;

                // Directional flow: offset coordinates along the flow angle over time
                const flowOffset = animTime;
                const fx = nx + FLOW_DX * flowOffset;
                const fy = ny + FLOW_DY * flowOffset;

                // Domain warping for fluid/smoke-like shapes 
                const warpX = simplex2D(fx * 0.8, fy * 0.8 + animTime * 0.3) * WARP_STRENGTH;
                const warpY = simplex2D(fx * 0.8 + 30, fy * 0.8 + animTime * 0.3) * WARP_STRENGTH;

                // Final noise with warp applied
                const noiseVal = fbm(fx + warpX, fy + warpY);

                // Map from [-1,1] to [0,1] and apply contrast/brightness
                let value = (noiseVal + 1) * 0.5;
                value = ((value - 0.5) * CONTRAST) + 0.5;
                value = value * BRIGHTNESS;
                value = Math.max(0, Math.min(1, value));

                // Bayer dithering: compare value against threshold
                const bx = Math.floor(x / PIXEL_SIZE) % bayerSize;
                const by = Math.floor(y / PIXEL_SIZE) % bayerSize;
                const threshold = (bayerMatrix8[by][bx] + 0.5) / bayerLevels;

                const shouldDraw = value > threshold;
                if (!shouldDraw) continue;

                // Mouse interaction (cut out the exact center to fake a physical object)
                let alpha = 1.0;
                if (dist < totalMouseRad) {
                    if (dist < mouseRadScaled * 0.7) { // Tighter core than before
                        alpha = 0;
                    } else {
                        // Smooth fade out into the distorted wave
                        alpha = (dist - mouseRadScaled * 0.7) / (totalMouseRad - mouseRadScaled * 0.7);
                    }
                }

                if (alpha <= 0) continue;

                const a = Math.floor(alpha * 255);

                // Fill pixel block 
                for (let py = 0; py < PIXEL_SIZE && (y + py) < h; py++) {
                    for (let px = 0; px < PIXEL_SIZE && (x + px) < w; px++) {
                        const idx = ((y + py) * w + (x + px)) * 4;
                        data[idx] = NOISE_COLOR_R;
                        data[idx + 1] = NOISE_COLOR_G;
                        data[idx + 2] = NOISE_COLOR_B;
                        data[idx + 3] = a; 
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // === INIT ===
    requestAnimationFrame(render);
})();
