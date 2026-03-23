// Logic for Asset Pack Generator tool
document.addEventListener('DOMContentLoaded', () => {
    const isAssetPackPage = window.location.pathname.includes('assetPack%20generator.html') || window.location.pathname.includes('assetPack generator.html');
    if (!isAssetPackPage) return; // Only run on asset pack page

    const dropZone = document.getElementById('imageDropZone');
    const uploader = document.getElementById('imageUploadBtn');
    const toolContent = document.getElementById('toolContent');
    const previewText = document.getElementById('previewText');
    const canvasContainer = document.getElementById('canvasContainer');
    const imageCanvas = document.getElementById('imageCanvas');
    const ctx = imageCanvas.getContext('2d');
    const frameGallery = document.getElementById('frameGallery');
    
    const extractBtn = document.getElementById('extractBtn');
    const aiRemoveBgBtn = document.getElementById('aiRemoveBgBtn');
    const clearPointsBtn = document.getElementById('clearPointsBtn');
    const pointCountDisplay = document.getElementById('pointCount');
    const downloadFramesBtn = document.getElementById('downloadFramesBtn');
    
    const tabInput = document.getElementById('tabInput');
    const tabResult = document.getElementById('tabResult');

    let imageFile = null;
    let loadedImage = new Image();
    let points = []; // Array of {x, y}
    let extractedSpritesBase64 = [];

    // API URL
    const API_URL = 'https://pawx.onrender.com';

    // Upload Handlers
    dropZone.addEventListener('click', () => uploader.click());
    uploader.addEventListener('change', handleUpload);
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = "var(--primary)"; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = "rgba(255, 255, 255, 0.2)"; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "rgba(255, 255, 255, 0.2)";
        if (e.dataTransfer.files.length) {
            uploader.files = e.dataTransfer.files;
            handleUpload();
        }
    });

    function handleUpload() {
        const file = uploader.files[0];
        if (file && file.type.startsWith('image/')) {
            imageFile = file;
            
            // UI Changes
            const hero = document.querySelector('.hero');
            if (hero) hero.style.display = 'none';
            
            dropZone.style.display = 'none';
            toolContent.style.display = 'flex';
            previewText.style.display = 'none';
            frameGallery.style.display = 'none';
            downloadFramesBtn.style.display = 'none';
            points = [];
            updatePointCount();
            
            // Show Canvas
            canvasContainer.style.display = 'block';
            
            // Load image to canvas
            const reader = new FileReader();
            reader.onload = (e) => {
                loadedImage.onload = () => {
                    imageCanvas.width = loadedImage.width;
                    imageCanvas.height = loadedImage.height;
                    redrawCanvas();
                    extractBtn.disabled = true; // disabled until point is placed
                };
                loadedImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload a valid image file.');
        }
    }

    function redrawCanvas() {
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.drawImage(loadedImage, 0, 0);
        
        // Draw points
        points.forEach((pt, index) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 10, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'white';
            ctx.stroke();
            
            // Draw number
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(index + 1, pt.x, pt.y);
        });
    }

    // Handle clicks on canvas
    imageCanvas.addEventListener('click', (e) => {
        const rect = imageCanvas.getBoundingClientRect();
        
        // Calculate the scale between the actual canvas size and the displayed CSS size
        const scaleX = imageCanvas.width / rect.width;
        const scaleY = imageCanvas.height / rect.height;
        
        // Adjust mouse coordinates
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        points.push({x: Math.round(x), y: Math.round(y)});
        updatePointCount();
        redrawCanvas();
        extractBtn.disabled = false;
    });

    clearPointsBtn.addEventListener('click', () => {
        points = [];
        updatePointCount();
        redrawCanvas();
        extractBtn.disabled = true;
    });

    function updatePointCount() {
        pointCountDisplay.innerText = `Points: ${points.length}`;
    }

    // Step 2: Extract Sprites
    extractBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!imageFile || points.length === 0) return false;

        extractBtn.innerText = "⏳ EXTRACTING...";
        extractBtn.disabled = true;

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('points', JSON.stringify(points));
        formData.append('remove_bg', false); // Always false for the main extraction

        try {
            const response = await fetch(`${API_URL}/extract-sprites-points`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            extractedSpritesBase64 = data.sprites;
            
            displaySpritesInGallery();
            
            // Switch UI state
            canvasContainer.style.display = 'none';
            frameGallery.style.display = 'grid';
            if (aiRemoveBgBtn) aiRemoveBgBtn.disabled = false;
            downloadFramesBtn.style.display = 'block';
            downloadFramesBtn.disabled = false;
            
            tabInput.classList.remove('active-tab');
            tabResult.classList.add('active-tab');

        } catch (error) {
            console.error(error);
            alert("Error extracting sprites. Ensure the Python backend is running.");
        } finally {
            extractBtn.innerText = "▶ EXTRACT SPRITES";
            extractBtn.disabled = false;
        }
    });

    // AI Background Removal Action
    if (aiRemoveBgBtn) {
        aiRemoveBgBtn.addEventListener('click', async () => {
            if (extractedSpritesBase64.length === 0) return;
            
            aiRemoveBgBtn.innerText = "⏳ REMOVING...";
            aiRemoveBgBtn.disabled = true;
            
            try {
                for (let i = 0; i < extractedSpritesBase64.length; i++) {
                    aiRemoveBgBtn.innerText = `⏳ AI: ${i+1}/${extractedSpritesBase64.length}`;
                    
                    const response = await fetch(`${API_URL}/remove-bg-single`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: extractedSpritesBase64[i] })
                    });
                    
                    const data = await response.json();
                    if (data.image) {
                        extractedSpritesBase64[i] = data.image;
                    }
                }
                
                // Refresh Gallery
                displaySpritesInGallery();
                aiRemoveBgBtn.innerText = "✨ AI REMOVAL DONE";
                setTimeout(() => {
                    aiRemoveBgBtn.innerText = "✨ AI REMOVE BACKGROUNDS";
                    aiRemoveBgBtn.disabled = false;
                }, 3000);
                
            } catch (err) {
                alert("AI Error: " + err.message);
                aiRemoveBgBtn.innerText = "✨ AI REMOVE BACKGROUNDS";
                aiRemoveBgBtn.disabled = false;
            }
        });
    }

    function displaySpritesInGallery() {
        frameGallery.innerHTML = ''; // Clear old

        if (extractedSpritesBase64.length === 0) {
            frameGallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ccc;">No sprites extracted.</p>';
            return;
        }

        extractedSpritesBase64.forEach((b64, index) => {
            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.flexDirection = 'column';
            wrap.style.alignItems = 'center';
            wrap.style.background = '#222';
            wrap.style.padding = '10px';
            wrap.style.borderRadius = '8px';

            const img = document.createElement('img');
            img.src = b64;
            img.style.width = '100%';
            img.style.maxHeight = '150px';
            img.style.objectFit = 'contain';
            img.style.background = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAnv37v3/n00UxsBIFxg1lHAo4SgAABgAIvU6O1OaDJoAAAAASUVORK5CYII=") repeat'; // Transparency checkerboard
            img.style.borderRadius = '5px';
            img.style.marginBottom = '10px';

            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.gap = '5px';
            btnContainer.style.width = '100%';

            const downloadLink = document.createElement('button');
            downloadLink.innerText = "⬇";
            downloadLink.style.background = 'var(--primary)';
            downloadLink.style.padding = '5px 10px';
            downloadLink.style.color = 'black';
            downloadLink.style.border = 'none';
            downloadLink.style.cursor = 'pointer';
            downloadLink.style.fontWeight = 'bold';
            downloadLink.style.borderRadius = '4px';
            downloadLink.style.fontSize = '12px';
            downloadLink.style.flex = '1';
            
            downloadLink.onclick = () => {
                const link = document.createElement('a');
                link.href = extractedSpritesBase64[index]; // Use array reference so it reflects updates
                link.download = `sprite_${index + 1}.png`;
                link.click();
            };

            const rmBgBtn = document.createElement('button');
            rmBgBtn.innerText = "✨ RM BG";
            rmBgBtn.style.background = '#8a2be2';
            rmBgBtn.style.padding = '5px 10px';
            rmBgBtn.style.color = 'white';
            rmBgBtn.style.border = 'none';
            rmBgBtn.style.cursor = 'pointer';
            rmBgBtn.style.fontWeight = 'bold';
            rmBgBtn.style.borderRadius = '4px';
            rmBgBtn.style.fontSize = '12px';
            rmBgBtn.style.flex = '2';

            rmBgBtn.onclick = async () => {
                rmBgBtn.innerText = "⏳...";
                rmBgBtn.disabled = true;
                try {
                    const response = await fetch(`${API_URL}/remove-bg-single`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: extractedSpritesBase64[index] })
                    });
                    if (!response.ok) throw new Error("BG Removal failed");
                    const data = await response.json();
                    extractedSpritesBase64[index] = data.image; // Update source
                    img.src = data.image; // Update preview
                    rmBgBtn.innerText = "✅ DONE";
                    setTimeout(() => rmBgBtn.style.display = 'none', 1500);
                } catch (err) {
                    console.error(err);
                    rmBgBtn.innerText = "❌ ERR";
                    setTimeout(() => { rmBgBtn.innerText = "✨ RM BG"; rmBgBtn.disabled = false; }, 2000);
                }
            };

            btnContainer.appendChild(downloadLink);
            btnContainer.appendChild(rmBgBtn);

            wrap.appendChild(img);
            wrap.appendChild(btnContainer);
            frameGallery.appendChild(wrap);
        });
    }

    // Handle "Download All Sprites"
    if (downloadFramesBtn) {
        downloadFramesBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (extractedSpritesBase64.length === 0) {
                alert("No sprites to download.");
                return;
            }

            const originalText = downloadFramesBtn.innerText;
            downloadFramesBtn.innerText = "⏳ ZIPPING...";
            downloadFramesBtn.disabled = true;

            try {
                const zip = new JSZip();
                const folder = zip.folder("extracted_sprites");

                extractedSpritesBase64.forEach((b64, index) => {
                    const base64Data = b64.split(',')[1];
                    const filename = `sprite_${String(index + 1).padStart(2, '0')}.png`;
                    folder.file(filename, base64Data, {base64: true});
                });

                const content = await zip.generateAsync({type:"blob"});
                
                const link = document.createElement("a");
                link.href = URL.createObjectURL(content);
                link.download = "extracted_sprites.zip";
                link.click();
            } catch (error) {
                console.error("Error zipping files:", error);
                alert("There was an error generating the ZIP file.");
            } finally {
                downloadFramesBtn.innerText = originalText;
                downloadFramesBtn.disabled = false;
            }
        });
    }

    // Tab Switching
    tabInput.addEventListener('click', () => {
        if (imageFile) {
            canvasContainer.style.display = 'block';
            frameGallery.style.display = 'none';
            downloadFramesBtn.style.display = 'none';
            tabInput.classList.add('active-tab');
            tabResult.classList.remove('active-tab');
        }
    });

    tabResult.addEventListener('click', () => {
        if (extractedSpritesBase64.length > 0) {
            canvasContainer.style.display = 'none';
            frameGallery.style.display = 'grid';
            downloadFramesBtn.style.display = 'block';
            tabInput.classList.remove('active-tab');
            tabResult.classList.add('active-tab');
        }
    });
});
