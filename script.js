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

if (processBtn && !window.location.pathname.includes('spritesheet.html')) {
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
