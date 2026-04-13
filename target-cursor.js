/**
 * TARGET CURSOR EFFECT
 * --------------------
 * Custom cursor with orbiting dashed square that snaps to elements on hover.
 * Inspired by ReactBits Target Cursor.
 */
(function () {
    // === CONFIG ===
    const TARGET_SELECTORS = [
        '.tool-card',
        '.pipe-card',
        '.cta-btn',
        '.engine-btns button',
        '.nav-link',
        '.contact-card',
        '.hero-overlay',
        '.big-drop',
        '.process-btn',
        '.logo'
    ];

    const CURSOR_DOT_SIZE = 8;           // px – size of the center dot
    const DEFAULT_SQUARE_SIZE = 40;       // px – default dashed square size (when not hovering)
    const SQUARE_PADDING = 14;            // px – extra padding when snapped to element
    const SPIN_DURATION = 6;              // seconds – one full rotation
    const LERP_SPEED = 0.15;             // smoothing factor (0–1, higher = snappier)
    const BORDER_COLOR = '#ff6a00';       // matches your orange accent
    const BORDER_COLOR_IDLE = 'rgba(255, 106, 0, 0.5)';
    const DOT_COLOR = '#ff6a00';
    const CORNER_SIZE = 10;              // px – length of the corner bracket lines

    // === STATE ===
    let mouseX = -100, mouseY = -100;
    let targetX = -100, targetY = -100;
    let targetW = DEFAULT_SQUARE_SIZE, targetH = DEFAULT_SQUARE_SIZE;
    let currentX = -100, currentY = -100;
    let currentW = DEFAULT_SQUARE_SIZE, currentH = DEFAULT_SQUARE_SIZE;
    let isHovering = false;
    let currentAngle = 0;
    let isVisible = false;

    // === CREATE DOM ELEMENTS ===

    // Dot (center cursor)
    const dot = document.createElement('div');
    dot.id = 'tc-dot';
    document.body.appendChild(dot);

    // Dashed square (the orbiting border)
    const square = document.createElement('div');
    square.id = 'tc-square';

    // Create 4 corner brackets using pseudo-style approach with actual divs
    const corners = ['tl', 'tr', 'bl', 'br'];
    corners.forEach(pos => {
        const corner = document.createElement('div');
        corner.className = `tc-corner tc-corner-${pos}`;
        square.appendChild(corner);
    });

    document.body.appendChild(square);

    // === INJECT STYLES ===
    const style = document.createElement('style');
    style.textContent = `
        /* Hide default cursor on everything */
        *, *::before, *::after {
            cursor: none !important;
        }

        #tc-dot {
            position: fixed;
            width: ${CURSOR_DOT_SIZE}px;
            height: ${CURSOR_DOT_SIZE}px;
            background: ${DOT_COLOR};
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
            transform: translate(-50%, -50%);
            transition: transform 0.1s ease, opacity 0.3s ease;
            opacity: 0;
            box-shadow: 0 0 8px rgba(255, 106, 0, 0.6), 0 0 20px rgba(255, 106, 0, 0.2);
        }

        #tc-dot.visible {
            opacity: 1;
        }

        #tc-dot.hovering {
            transform: translate(-50%, -50%) scale(0.6);
            background: #fff;
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.8);
        }

        #tc-square {
            position: fixed;
            pointer-events: none;
            z-index: 99998;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        #tc-square.visible {
            opacity: 1;
        }

        /* Corner bracket lines */
        .tc-corner {
            position: absolute;
            width: ${CORNER_SIZE}px;
            height: ${CORNER_SIZE}px;
            pointer-events: none;
        }

        .tc-corner-tl {
            top: 0; left: 0;
            border-top: 2px solid ${BORDER_COLOR_IDLE};
            border-left: 2px solid ${BORDER_COLOR_IDLE};
        }

        .tc-corner-tr {
            top: 0; right: 0;
            border-top: 2px solid ${BORDER_COLOR_IDLE};
            border-right: 2px solid ${BORDER_COLOR_IDLE};
        }

        .tc-corner-bl {
            bottom: 0; left: 0;
            border-bottom: 2px solid ${BORDER_COLOR_IDLE};
            border-left: 2px solid ${BORDER_COLOR_IDLE};
        }

        .tc-corner-br {
            bottom: 0; right: 0;
            border-bottom: 2px solid ${BORDER_COLOR_IDLE};
            border-right: 2px solid ${BORDER_COLOR_IDLE};
        }

        /* When hovering a target, make corners brighter and bigger */
        #tc-square.hovering .tc-corner-tl {
            border-top-color: ${BORDER_COLOR};
            border-left-color: ${BORDER_COLOR};
        }
        #tc-square.hovering .tc-corner-tr {
            border-top-color: ${BORDER_COLOR};
            border-right-color: ${BORDER_COLOR};
        }
        #tc-square.hovering .tc-corner-bl {
            border-bottom-color: ${BORDER_COLOR};
            border-left-color: ${BORDER_COLOR};
        }
        #tc-square.hovering .tc-corner-br {
            border-bottom-color: ${BORDER_COLOR};
            border-right-color: ${BORDER_COLOR};
        }

        #tc-square.hovering .tc-corner {
            width: ${CORNER_SIZE + 4}px;
            height: ${CORNER_SIZE + 4}px;
            filter: drop-shadow(0 0 6px rgba(255, 106, 0, 0.5));
        }
    `;
    document.head.appendChild(style);

    // === MOUSE TRACKING ===
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isVisible) {
            isVisible = true;
            dot.classList.add('visible');
            square.classList.add('visible');
        }
    });

    document.addEventListener('mouseleave', () => {
        isVisible = false;
        dot.classList.remove('visible');
        square.classList.remove('visible');
    });

    document.addEventListener('mouseenter', () => {
        isVisible = true;
        dot.classList.add('visible');
        square.classList.add('visible');
    });

    // === TARGET ELEMENT LISTENERS ===
    function attachListeners() {
        const allTargets = document.querySelectorAll(TARGET_SELECTORS.join(', '));

        allTargets.forEach(el => {
            el.addEventListener('mouseenter', () => {
                isHovering = true;
                dot.classList.add('hovering');
                square.classList.add('hovering');
                updateTargetFromElement(el);
            });

            el.addEventListener('mouseleave', () => {
                isHovering = false;
                dot.classList.remove('hovering');
                square.classList.remove('hovering');
            });
        });
    }

    function updateTargetFromElement(el) {
        const rect = el.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
        targetW = rect.width + SQUARE_PADDING * 2;
        targetH = rect.height + SQUARE_PADDING * 2;
    }

    // === LINEAR INTERPOLATION ===
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // === ANIMATION LOOP ===
    function animate() {
        // Dot always follows mouse directly
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';

        if (isHovering) {
            // Square snaps to the target element
            currentX = lerp(currentX, targetX, LERP_SPEED);
            currentY = lerp(currentY, targetY, LERP_SPEED);
            currentW = lerp(currentW, targetW, LERP_SPEED);
            currentH = lerp(currentH, targetH, LERP_SPEED);
            // Stop spinning when locked on
            // currentAngle stays at its current value and slowly goes to 0
            currentAngle = lerp(currentAngle, 0, 0.08);
        } else {
            // Square follows mouse with slight delay
            targetX = mouseX;
            targetY = mouseY;
            targetW = DEFAULT_SQUARE_SIZE;
            targetH = DEFAULT_SQUARE_SIZE;

            currentX = lerp(currentX, targetX, LERP_SPEED);
            currentY = lerp(currentY, targetY, LERP_SPEED);
            currentW = lerp(currentW, targetW, LERP_SPEED * 1.5);
            currentH = lerp(currentH, targetH, LERP_SPEED * 1.5);

            // Slow spin when idle
            currentAngle += 0.8;
            if (currentAngle >= 360) currentAngle -= 360;
        }

        // Position the square (centered on currentX, currentY)
        square.style.left = (currentX - currentW / 2) + 'px';
        square.style.top = (currentY - currentH / 2) + 'px';
        square.style.width = currentW + 'px';
        square.style.height = currentH + 'px';
        square.style.transform = `rotate(${currentAngle}deg)`;

        requestAnimationFrame(animate);
    }

    // === INIT ===
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            attachListeners();
            animate();
        });
    } else {
        attachListeners();
        animate();
    }

    // Re-attach listeners when DOM changes (for dynamically added elements)
    const observer = new MutationObserver(() => {
        attachListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
