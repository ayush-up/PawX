const API_URL = 'https://ayushup2135-pawx-backend.hf.space';
const bigDrop = document.getElementById("bigDropZone");
const fileInput = document.getElementById("imageUpload");
const toolContent = document.getElementById("toolContent");

const previewImage = document.getElementById("previewImage");
const previewText = document.getElementById("previewText");

let currentFile = null;

if (bigDrop && fileInput) {
    // CLICK → open file dialog
    bigDrop.addEventListener("click", () => fileInput.click());

    // Show UI + preview
    function displayImage(file) {
        currentFile = file;
        const reader = new FileReader();
        reader.onload = () => {
            previewImage.src = reader.result;
            previewImage.style.display = "block";
            previewText.style.display = "none";

            // Hide big window, hide hero, show full UI
            const hero = document.querySelector(".hero");
            if (hero) hero.style.display = "none";
            
            bigDrop.style.display = "none";
            toolContent.style.display = "flex";
        };
        reader.readAsDataURL(file);
    }

    // Manual file select
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            displayImage(fileInput.files[0]);
        }
    });

    // Prevent default drag
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        bigDrop.addEventListener(eventName, e => e.preventDefault());
    });

    // Highlight drag
    bigDrop.addEventListener("dragover", () => bigDrop.classList.add("dragover"));
    bigDrop.addEventListener("dragleave", () => bigDrop.classList.remove("dragover"));

    // Drop file
    bigDrop.addEventListener("drop", (e) => {
        bigDrop.classList.remove("dragover");

        const file = e.dataTransfer.files[0];
        if (!file) return;

        displayImage(file);
    });
}
// PBR Master Checkbox Logic
const pbrMaster = document.getElementById("pbrMaster");
const pbrChildren = document.querySelectorAll(".pbr-child");

if (pbrMaster) {
    // When parent is checked/unchecked → toggle all children
    pbrMaster.addEventListener("change", () => {
        pbrChildren.forEach(child => child.checked = pbrMaster.checked);
    });

    // When any child changes → update parent state
    pbrChildren.forEach(child => {
        child.addEventListener("change", () => {
            const allChecked = Array.from(pbrChildren).every(c => c.checked);
            pbrMaster.checked = allChecked;
        });
    });
}

// --- BACKEND CONNECTION ---
const processBtn = document.querySelector(".process-btn");

if (processBtn && !window.location.pathname.includes('spritesheet.html') && !window.location.pathname.includes('assetPack-generator.html')) {
    processBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    // 1. Get the file
    console.log(`Process button clicked. Sending to ${API_URL}...`);

    // Check if file is available
    if (!currentFile && fileInput.files.length === 0) {
        alert("Please upload an image first!");
        return;
    }

    const fileToUpload = currentFile || fileInput.files[0];

    // 2. Collect Options
    const formData = new FormData();
    formData.append("image", fileToUpload);

    // Checkboxes 
    const allChecks = document.querySelectorAll(".options input[type='checkbox']");
    // 0: Make Seamless
    // 1: PBR Master
    // 2: Normal
    // 3: Roughness
    // 4: Height
    // 5: Metallic
    // 6: Lighting Fix

    const seamlessOpt = allChecks[0].checked;
    const pbrMasterOpt = allChecks[1].checked;

    // Individual PBR Maps
    const normalOpt = allChecks[2].checked;
    const roughOpt = allChecks[3].checked;
    const heightOpt = allChecks[4].checked;
    const metalOpt = allChecks[5].checked;

    const lightingOpt = allChecks[6].checked;

    formData.append("seamless", seamlessOpt);
    formData.append("pbr", pbrMasterOpt);
    formData.append("pbr_normal", normalOpt);
    formData.append("pbr_rough", roughOpt);
    formData.append("pbr_height", heightOpt);
    formData.append("pbr_metal", metalOpt);
    formData.append("lighting", lightingOpt);

    // UI Feedback
    processBtn.innerText = "⏳ Processing...";
    processBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/process`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Processing failed");

        const data = await response.json();
        const previewBox = document.querySelector(".preview-box");

        // Clear previous results
        previewBox.innerHTML = "";

        // === GRID LAYOUT STYLES ===
        previewBox.style.display = "flex";
        previewBox.style.flexWrap = "wrap";
        previewBox.style.gap = "15px";
        previewBox.style.justifyContent = "center";
        previewBox.style.alignItems = "flex-start";

        Object.keys(data).forEach(key => {
            const b64 = data[key];

            const container = document.createElement("div");
            // Flex Item Style (Card)
            container.style.flex = "1 1 150px";
            container.style.maxWidth = "220px";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.alignItems = "center";
            container.style.marginBottom = "20px";

            // Title
            const title = document.createElement("h5");
            title.innerText = key;
            title.style.color = "#ff9e2c";
            title.style.marginBottom = "8px";
            title.style.fontSize = "0.8rem";
            title.style.textTransform = "uppercase";
            title.style.fontWeight = "bold";

            // Image
            const img = document.createElement("img");
            img.src = b64;
            img.style.width = "100%";
            img.style.aspectRatio = "1/1"; // Square
            img.style.objectFit = "cover"; // Fill square
            img.style.borderRadius = "6px";
            img.style.border = "1px solid #555";

            // Download Button
            const btn = document.createElement("button");
            btn.innerText = "⬇ DOWNLOAD";
            btn.style.backgroundColor = "#ff9e2c";
            btn.style.color = "#000";
            btn.style.border = "none";
            btn.style.marginTop = "8px";
            btn.style.fontSize = "0.75rem";
            btn.style.fontWeight = "bold";
            btn.style.padding = "8px 12px";
            btn.style.cursor = "pointer";
            btn.style.borderRadius = "4px";
            btn.style.width = "100%";

            // Hover effect
            btn.onmouseover = () => btn.style.backgroundColor = "#ffb35c";
            btn.onmouseout = () => btn.style.backgroundColor = "#ff9e2c";

            btn.onclick = (e) => {
                e.preventDefault();
                const link = document.createElement("a");
                link.href = b64;
                link.download = key.replace(/ /g, "_") + ".png";
                link.click();
            };

            container.appendChild(title);
            container.appendChild(img);
            container.appendChild(btn);

            previewBox.appendChild(container);
        });

    } catch (err) {
        console.error("Fetch Error Details:", err);
        processBtn.innerText = "❌ Error (See Console)";
    } finally {
        if (processBtn.innerText !== "❌ Error (See Console)") {
            processBtn.innerText = "▶ PROCESS";
            processBtn.disabled = false;
        } else {
            setTimeout(() => {
                processBtn.innerText = "▶ PROCESS";
                processBtn.disabled = false;
            }, 3000);
        }
    }
    }); // Close addEventListener
} // Close if statement

/* =========================================
   DUAL ICARD DROPDOWN PHYSICS ENGINE
   ========================================= */
class PhysicsCard {
    constructor(wrapperId) {
        this.wrapper = document.getElementById(wrapperId);
        if (!this.wrapper) return;
        
        this.icard = this.wrapper.querySelector('.icard');
        this.svg = this.wrapper.querySelector('.string-svg');
        this.lanyardBg = this.svg.querySelector('.lanyard-bg');
        this.lanyardPath = this.svg.querySelector('.lanyard-path');
        this.lanyardEdges = this.svg.querySelector('.lanyard-edges');
        
        // Physics constants
        this.REST_LENGTH = 390; 
        this.GRAVITY = 0.35;
        this.DAMPING = 0.992;
        
        // State
        this.cardX = 0;
        this.cardY = this.REST_LENGTH;
        this.velX = 0;
        this.velY = 0;
        
        this.isDragging = false;
        this.grabOffsetX = 0;
        this.grabOffsetY = 0;
        this.simLoopId = null;
        this.dragCount = 0;
        this.onDragAlert = null; // Callback for Easter egg

        this.initEvents();
        this.updateSVG();
    }

    drop() {
        this.wrapper.classList.toggle('dropped');
        if (this.wrapper.classList.contains('dropped')) {
            // Slight delay so the CSS transition starts first
            setTimeout(() => {
                this.velX = (Math.random() - 0.5) * 20; // Random swing bounce outwards
                if (!this.simLoopId) this.physicsLoop();
            }, 100);
        }
    }

    initEvents() {
        this.icard.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.velX = 0; 
            this.velY = 0;
            this.dragCount++;
            if (this.onDragAlert) this.onDragAlert(this.dragCount);

            const rect = this.wrapper.getBoundingClientRect();
            const anchorScreenX = rect.left + rect.width / 2;
            const anchorScreenY = rect.top;

            const currentMouseRelativeX = e.clientX - anchorScreenX;
            const currentMouseRelativeY = e.clientY - anchorScreenY;
            
            this.grabOffsetX = currentMouseRelativeX - this.cardX;
            this.grabOffsetY = currentMouseRelativeY - this.cardY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const rect = this.wrapper.getBoundingClientRect();
            const anchorScreenX = rect.left + rect.width / 2;
            const anchorScreenY = rect.top;

            let targetX = e.clientX - anchorScreenX - this.grabOffsetX;
            let targetY = e.clientY - anchorScreenY - this.grabOffsetY;
            
            const targetDist = Math.sqrt(targetX*targetX + targetY*targetY);
            if (targetDist > this.REST_LENGTH) {
                targetX = (targetX / targetDist) * this.REST_LENGTH;
                targetY = (targetY / targetDist) * this.REST_LENGTH;
            }
            
            this.velX = targetX - this.cardX;
            this.velY = targetY - this.cardY;
            
            this.cardX = targetX;
            this.cardY = targetY;
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                if (!this.simLoopId) this.physicsLoop();
            }
        });
    }

    updateSVG() {
        const startX = 500;
        const startY = 0;
        const endX = 500 + this.cardX;
        const endY = this.cardY;

        const distance = Math.sqrt(this.cardX*this.cardX + this.cardY*this.cardY);
        let dPath = ``;

        if (distance >= this.REST_LENGTH * 0.98) {
            dPath = `M ${startX} ${startY} L ${endX} ${endY}`;
        } else {
            const slack = this.REST_LENGTH - distance;
            const dir = (this.cardX >= 0) ? -1 : 1; 
            const ctrlX = startX + (this.cardX / 2) + (slack * dir * 1.5);
            const ctrlY = startY + (this.cardY / 2) + (slack * 0.5);
            dPath = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
        }

        this.lanyardBg.setAttribute('d', dPath);
        this.lanyardPath.setAttribute('d', dPath);
        this.lanyardEdges.setAttribute('d', dPath);
        
        let tilt = distance > 0 ? (this.cardX / distance) * 20 : 0;
        tilt += this.velX * 0.5;

        this.icard.style.transform = `translate(${this.cardX}px, ${this.cardY}px) rotate(${tilt}deg)`;
    }

    physicsLoop() {
        if (!this.isDragging) {
            this.velY += this.GRAVITY;
            this.cardX += this.velX;
            this.cardY += this.velY;

            const distance = Math.sqrt(this.cardX*this.cardX + this.cardY*this.cardY);

            if (distance > this.REST_LENGTH) {
                const nx = this.cardX / distance;
                const ny = this.cardY / distance;
                this.cardX = nx * this.REST_LENGTH;
                this.cardY = ny * this.REST_LENGTH;

                const dotProduct = (this.velX * nx) + (this.velY * ny);
                if (dotProduct > 0) {
                    this.velX -= dotProduct * nx;
                    this.velY -= dotProduct * ny;
                }
            }

            this.velX *= this.DAMPING;
            this.velY *= this.DAMPING;
        }

        this.updateSVG();

        if (!this.isDragging && Math.abs(this.velX) < 0.1 && Math.abs(this.velY) < 0.1 && Math.abs(this.cardX) < 1 && Math.abs(this.cardY - this.REST_LENGTH) < 1) {
            this.cardX = 0;
            this.cardY = this.REST_LENGTH;
            this.velX = 0;
            this.velY = 0;
            this.updateSVG();
            this.simLoopId = null; 
        } else {
            this.simLoopId = requestAnimationFrame(() => this.physicsLoop());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const aboutBtn = document.getElementById('about-btn');
    if (aboutBtn) {
        const card1 = new PhysicsCard('hanger-wrapper-1');
        const card2 = new PhysicsCard('hanger-wrapper-2');
        
        // Easter egg: Alert if user plays too much with Ayush's card
        card1.onDragAlert = (count) => {
            if (count === 5) {
                alert("You suppose to read it not to play with it!");
            } else if (count === 10) {
                alert("⚠️ Hey! Stop messing with my card! i already warned you!");
            } else if (count === 15) {
                alert("🚨 Bro... i am CERTIFIED CYBER CRIMINAL. You really wanna keep doing this?");
            } else if (count === 20) {
                alert("💀 Alright that's it. i have your IP address now.do it one more time and you will be screwed. Good luck.");
            } else if (count === 21) {
                triggerFakeCrash();
            }
        };

        function triggerFakeCrash() {
            // Create full-screen overlay
            const crash = document.createElement('div');
            crash.id = 'crash-screen';
            crash.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #000; z-index: 999999; display: flex; flex-direction: column;
                align-items: center; justify-content: center; cursor: none;
                font-family: 'Courier New', monospace; overflow: hidden;
            `;

            // Glitch flicker effect
            const glitchStyle = document.createElement('style');
            glitchStyle.textContent = `
                @keyframes glitchFlicker {
                    0%, 100% { opacity: 1; }
                    5% { opacity: 0; }
                    10% { opacity: 1; transform: translateX(-5px); }
                    15% { opacity: 1; transform: translateX(5px); }
                    20% { opacity: 0.8; transform: translateX(0); }
                }
                @keyframes scanline {
                    0% { top: -10%; }
                    100% { top: 110%; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                #crash-screen * { animation: glitchFlicker 0.3s infinite; }
                #crash-terminal { animation: none !important; }
                #crash-terminal span { animation: none !important; }
            `;
            document.head.appendChild(glitchStyle);

            // Skull ASCII
            const skull = document.createElement('pre');
            skull.style.cssText = `color: #ff0000; font-size: 14px; text-align: center; margin-bottom: 20px; line-height: 1.2;`;
            skull.textContent = `
     ██████╗ ██████╗  █████╗ ███████╗██╗  ██╗
    ██╔════╝ ██╔══██╗██╔══██╗██╔════╝██║  ██║
    ██║      ██████╔╝███████║███████╗███████║
    ██║      ██╔══██╗██╔══██║╚════██║██╔══██║
    ╚██████╗ ██║  ██║██║  ██║███████║██║  ██║
     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
            `;

            // Main title
            const title = document.createElement('h1');
            title.style.cssText = `color: #ff0000; font-size: 2.5rem; margin: 0; letter-spacing: 8px; text-shadow: 0 0 20px red, 0 0 40px red;`;
            title.textContent = '⚠ SYSTEM COMPROMISED ⚠';

            // Subtitle
            const sub = document.createElement('p');
            sub.style.cssText = `color: #ff4444; font-size: 1rem; margin: 10px 0 30px; letter-spacing: 3px;`;
            sub.textContent = 'UNAUTHORIZED ACCESS DETECTED';

            // Terminal output area
            const terminal = document.createElement('div');
            terminal.id = 'crash-terminal';
            terminal.style.cssText = `
                width: 600px; max-width: 90vw; background: rgba(255,0,0,0.05);
                border: 1px solid #ff0000; border-radius: 4px; padding: 20px;
                font-size: 0.85rem; color: #ff6a00; text-align: left;
                max-height: 250px; overflow-y: auto;
            `;

            // Scanline effect
            const scanline = document.createElement('div');
            scanline.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%;
                height: 4px; background: rgba(255,0,0,0.15);
                animation: scanline 3s linear infinite; pointer-events: none;
            `;

            crash.appendChild(scanline);
            crash.appendChild(skull);
            crash.appendChild(title);
            crash.appendChild(sub);
            crash.appendChild(terminal);
            document.body.appendChild(crash);

            // Disable all scrolling and interaction
            document.body.style.overflow = 'hidden';
            document.body.style.pointerEvents = 'none';
            crash.style.pointerEvents = 'auto';

            // Typewriter terminal lines
            const lines = [
                '> Initiating breach protocol...',
                '> — meow meow meow meow',
                '> Scanning target device...',
                '> — meow meow meow meow',
                '> IP Address: ' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255),
                '> — meow meow meow meow',
                '> Location: LOCKED',
                '> — meow meow meow meow',
                '> Extracting browser cookies... ██████████ 100%',
                '> — meow meow meow meow',
                '> Webcam access: GRANTED',
                '> — meow meow meow meow',
                '> Uploading selfie to pawDevX servers...',
                '> — meow meow meow meow',
                '> Downloading entire search history...',
                '> ',
                '> ...',
                '> Just kidding 😏',
                '> I warned you though.',
                '> — meow meow meow meow',
                '> — meow meow meow meow',
                '> — meow meow meow meow',
                '> — meow meow meow meow',
                '> — meow meow meow meow',
                '> — meow meow meow meow',
                '> ',
                '> (Refresh the page to escape)',
            ];

            let lineIndex = 0;
            function typeLine() {
                if (lineIndex >= lines.length) return;
                const line = document.createElement('div');
                line.style.cssText = 'margin: 4px 0; opacity: 0; transition: opacity 0.3s;';
                line.textContent = lines[lineIndex];
                
                // Color the punchline differently
                if (lines[lineIndex].includes('kidding')) line.style.color = '#00ff00';
                if (lines[lineIndex].includes('warned')) line.style.color = '#ffaa00';
                if (lines[lineIndex].includes('Ayush')) line.style.color = '#ff6a00';
                if (lines[lineIndex].includes('Refresh')) { line.style.color = '#888'; line.style.animation = 'blink 1s infinite'; }
                
                terminal.appendChild(line);
                setTimeout(() => line.style.opacity = '1', 50);
                terminal.scrollTop = terminal.scrollHeight;
                lineIndex++;
                setTimeout(typeLine, 800 + Math.random() * 600);
            }

            // Start after brief blackout
            setTimeout(typeLine, 1500);
        }

        aboutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (card1.wrapper) card1.drop();
            if (card2.wrapper) card2.drop();
        });
    }
});
