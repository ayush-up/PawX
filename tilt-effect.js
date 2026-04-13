/**
 * TILT EFFECT
 * -----------
 * 3D perspective tilt that follows mouse position.
 * Applied to .big-drop elements (upload zones on tool pages).
 */
(function () {
    // === CONFIG ===
    const MAX_TILT = 8;               // Max rotation in degrees
    const PERSPECTIVE = 1000;          // CSS perspective value (px)
    const TRANSITION_SPEED = '0.1s';   // Smoothing on mouse move
    const RESET_SPEED = '0.5s';        // Smoothing on mouse leave (spring back)
    const GLARE_ENABLED = true;        // Subtle light glare following mouse
    const GLARE_OPACITY = 0.08;        // Max glare brightness

    const SELECTORS = '.big-drop';

    function initTilt(el) {
        // Set base styles
        el.style.transformStyle = 'preserve-3d';
        el.style.transition = `transform ${TRANSITION_SPEED} ease-out`;

        // Create glare overlay
        let glare = null;
        if (GLARE_ENABLED) {
            glare = document.createElement('div');
            glare.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                width: 100%;
                height: 100%;
                border-radius: inherit;
                pointer-events: none;
                z-index: 2;
                opacity: 0;
                transition: opacity 0.3s ease;
                background: radial-gradient(
                    circle at 50% 50%,
                    rgba(255, 255, 255, ${GLARE_OPACITY}),
                    transparent 60%
                );
            `;
            el.style.position = 'relative';
            el.style.overflow = 'hidden';
            el.appendChild(glare);
        }

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Normalize mouse position to -1 to 1
            const normalX = (e.clientX - centerX) / (rect.width / 2);
            const normalY = (e.clientY - centerY) / (rect.height / 2);

            // Clamp to -1, 1
            const clampedX = Math.max(-1, Math.min(1, normalX));
            const clampedY = Math.max(-1, Math.min(1, normalY));

            // Calculate rotation (inverted Y for natural feel)
            const rotateY = clampedX * MAX_TILT;
            const rotateX = -clampedY * MAX_TILT;

            el.style.transition = `transform ${TRANSITION_SPEED} ease-out`;
            el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            // Move glare to mouse position
            if (glare) {
                const percentX = ((e.clientX - rect.left) / rect.width) * 100;
                const percentY = ((e.clientY - rect.top) / rect.height) * 100;
                glare.style.background = `radial-gradient(
                    circle at ${percentX}% ${percentY}%,
                    rgba(255, 255, 255, ${GLARE_OPACITY}),
                    transparent 60%
                )`;
                glare.style.opacity = '1';
            }
        });

        el.addEventListener('mouseleave', () => {
            // Spring back to flat
            el.style.transition = `transform ${RESET_SPEED} cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
            el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg)`;

            if (glare) {
                glare.style.opacity = '0';
            }
        });
    }

    // === INIT ===
    function init() {
        const elements = document.querySelectorAll(SELECTORS);
        elements.forEach(initTilt);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
