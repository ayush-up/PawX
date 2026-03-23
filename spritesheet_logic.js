// Logic for spritesheet tool
document.addEventListener('DOMContentLoaded', () => {
    const isSpritesheetPage = window.location.pathname.includes('spritesheet.html');
    if (!isSpritesheetPage) return; // Only run on spritesheet page

    const dropZone = document.getElementById('videoDropZone');
    const uploader = document.getElementById('videoUpload'); // technically video upload here
    const toolContent = document.getElementById('toolContent');
    const previewText = document.getElementById('previewText');
    const previewVideo = document.getElementById('previewVideo');
    const frameGallery = document.getElementById('frameGallery');
    const previewImage = document.getElementById('previewImage');
    const extractBtn = document.getElementById('extractBtn');
    const generateBtn = document.getElementById('generateBtn');
    const tabFrames = document.getElementById('tabFrames');
    const tabResult = document.getElementById('tabResult');
    const downloadBtnSidebar = document.getElementById('downloadBtnSidebar');
    const aiRemoveBgBtn = document.getElementById('aiRemoveBgBtn');
    const downloadFramesBtn = document.getElementById('downloadFramesBtn');

    // INITIAL STATE: Everything action-oriented is disabled until video is processed
    if (extractBtn) extractBtn.disabled = true;
    if (generateBtn) generateBtn.disabled = true;
    if (aiRemoveBgBtn) aiRemoveBgBtn.disabled = true;
    if (downloadBtnSidebar) downloadBtnSidebar.disabled = true;
    if (downloadFramesBtn) downloadFramesBtn.disabled = true;

    let videoFile = null;
    let extractedFramesBase64 = []; // Store original base64 images

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
        if (file && file.type.startsWith('video/')) {
            videoFile = file;
            
            // UI Changes
            const hero = document.querySelector('.hero');
            if (hero) hero.style.display = 'none';
            
            dropZone.style.display = 'none';
            toolContent.style.display = 'flex';
            previewText.style.display = 'none';
            frameGallery.style.display = 'none';
            previewImage.style.display = 'none';
            
            // Show Video
            previewVideo.style.display = 'block';
            previewVideo.src = URL.createObjectURL(file);
            
            // Enable Extraction
            if (extractBtn) extractBtn.disabled = false;
        } else {
            alert('Please upload a valid video file.');
        }
    }

    // Step 1: Extract Frames
    extractBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent accidental form submission / page refresh
        
        if (!videoFile) return false;

        extractBtn.innerText = "⏳ EXTRACTING...";
        extractBtn.disabled = true;

        const fpsRate = document.getElementById('fpsRate').value;
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('fps_rate', fpsRate);

        // v=20: Added timeout for better UI stability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        try {
            const response = await fetch(`${API_URL}/extract-frames`, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            extractedFramesBase64 = data.frames;
            
            displayFramesInGallery();
            
            // Switch UI state
            previewVideo.style.display = 'none';
            frameGallery.style.display = 'grid';
            
            // Sync Sidebar States
            if (generateBtn) generateBtn.disabled = false;
            if (downloadFramesBtn) downloadFramesBtn.disabled = false;
            if (aiRemoveBgBtn) aiRemoveBgBtn.disabled = false; 
            if (downloadBtnSidebar) downloadBtnSidebar.disabled = true;
            
            // Fix for CSS flex layout issue hiding the grid
            document.getElementById('previewContainer').style.display = 'block'; 
            
            tabFrames.classList.add('active-tab');
            tabResult.classList.remove('active-tab');

        } catch (error) {
            console.error(error);
            alert("Error extracting frames. Ensure the Python backend is running.");
        } finally {
            extractBtn.innerText = "⚡ EXTRACT FRAMES";
            // User requirement: Disable extract after successful run
            if (extractedFramesBase64.length > 0) {
                extractBtn.disabled = true;
            } else {
                extractBtn.disabled = false;
            }
        }
    });

    // AI CLEAN ALL FRAMES Logic (Step 1)
    if (aiRemoveBgBtn) {
        aiRemoveBgBtn.addEventListener('click', async () => {
            if (extractedFramesBase64.length === 0) return;

            const originalText = aiRemoveBgBtn.innerText;
            aiRemoveBgBtn.disabled = true;
            
            try {
                for (let i = 0; i < extractedFramesBase64.length; i++) {
                    aiRemoveBgBtn.innerText = `⏳ AI: ${i+1}/${extractedFramesBase64.length}`;
                    
                    const response = await fetch(`${API_URL}/remove-bg-single`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: extractedFramesBase64[i] })
                    });
                    
                    const data = await response.json();
                    if (data.image) {
                        extractedFramesBase64[i] = data.image; // Replace with transparent version
                    }
                }
                
                // Refresh Gallery
                displayFramesInGallery();
                aiRemoveBgBtn.innerText = "✨ AI CLEANING DONE";
                setTimeout(() => {
                    aiRemoveBgBtn.innerText = "✨ AI REMOVE BACKGROUNDS";
                    // Keep enabled so user can re-run if they want, or disable if preferred
                    aiRemoveBgBtn.disabled = false; 
                }, 3000);
                
            } catch (err) {
                alert("AI Error: " + err.message);
                aiRemoveBgBtn.disabled = false;
                aiRemoveBgBtn.innerText = originalText;
            }
        });
    }

    // Handle "Download Individual Frames"
    if (downloadFramesBtn) {
        downloadFramesBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Gather selected frames
            const wrappers = frameGallery.querySelectorAll('.frame-wrapper');
            const selectedFrames = [];
            
            wrappers.forEach(wrap => {
                if (wrap.dataset.selected === "true") {
                    const idx = parseInt(wrap.dataset.index);
                    selectedFrames.push(extractedFramesBase64[idx]); 
                }
            });

            if (selectedFrames.length === 0) {
                alert("Please select at least one frame!");
                return false;
            }

            const originalText = downloadFramesBtn.innerText;
            downloadFramesBtn.innerText = "⏳ ZIPPING...";
            downloadFramesBtn.disabled = true;

            try {
                // Initialize JSZip
                const zip = new JSZip();
                const folder = zip.folder("extracted_frames");

                // Add each frame to the zip
                selectedFrames.forEach((b64, index) => {
                    // Remove "data:image/jpeg;base64," to get pure base64 data
                    const base64Data = b64.split(',')[1];
                    // Name the files sequentially
                    const filename = `frame_${String(index + 1).padStart(3, '0')}.jpg`;
                    // Add file to zip folder
                    folder.file(filename, base64Data, {base64: true});
                });

                // Generate async blob
                const content = await zip.generateAsync({type:"blob"});
                
                // Trigger download
                const link = document.createElement("a");
                link.href = URL.createObjectURL(content);
                link.download = "extracted_frames.zip";
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

    function displayFramesInGallery() {
        frameGallery.innerHTML = ''; // Clear old

        extractedFramesBase64.forEach((b64, index) => {
            const wrap = document.createElement('div');
            wrap.style.position = 'relative';
            wrap.style.cursor = 'pointer';
            wrap.classList.add('frame-wrapper');
            // By default all are selected
            wrap.dataset.selected = "true";

            const img = document.createElement('img');
            img.src = b64;
            img.style.width = '100%';
            img.style.borderRadius = '5px';
            img.style.border = '2px solid var(--primary)';
            img.style.transition = '0.2s';

            // Checkmark overlay
            const check = document.createElement('div');
            check.innerHTML = '✓';
            check.style.position = 'absolute';
            check.style.top = '5px';
            check.style.right = '5px';
            check.style.background = 'var(--primary)';
            check.style.color = '#000';
            check.style.borderRadius = '50%';
            check.style.width = '20px';
            check.style.height = '20px';
            check.style.display = 'flex';
            check.style.alignItems = 'center';
            check.style.justifyContent = 'center';
            check.style.fontSize = '12px';
            check.style.fontWeight = 'bold';

            wrap.appendChild(img);
            wrap.appendChild(check);

            // Toggle selection
            wrap.addEventListener('click', () => {
                const isSelected = wrap.dataset.selected === "true";
                if (isSelected) {
                    wrap.dataset.selected = "false";
                    img.style.border = '2px solid transparent';
                    img.style.opacity = '0.5';
                    check.style.display = 'none';
                } else {
                    wrap.dataset.selected = "true";
                    img.style.border = '2px solid var(--primary)';
                    img.style.opacity = '1';
                    check.style.display = 'flex';
                }
            });

            // Store original index for reference
            wrap.dataset.index = index;
            frameGallery.appendChild(wrap);
        });
    }

    // Step 2: Generate Spritesheet
    generateBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent accidental page refresh
        
        // Gather selected frames
        const wrappers = frameGallery.querySelectorAll('.frame-wrapper');
        const selectedFrames = [];
        
        wrappers.forEach(wrap => {
            if (wrap.dataset.selected === "true") {
                const idx = parseInt(wrap.dataset.index);
                selectedFrames.push(extractedFramesBase64[idx]); // Fix: push instead of append
            }
        });

        if (selectedFrames.length === 0) {
            alert("Please select at least one frame!");
            return false;
        }

        generateBtn.innerText = "⏳ GENERATING...";
        generateBtn.disabled = true;

        const gridLayout = document.getElementById('gridLayout').value;

        try {
            const response = await fetch(`${API_URL}/generate-spritesheet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    frames: selectedFrames,
                    grid_layout: gridLayout,
                    remove_bg: false
                })
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            
            // Show result
            frameGallery.style.display = 'none';
            previewImage.style.display = 'block';
            
            // Enable Sidebar Action Buttons
            if (aiRemoveBgBtn) aiRemoveBgBtn.disabled = false;
            if (downloadBtnSidebar) downloadBtnSidebar.disabled = false;
            
            previewImage.src = data.spritesheet;
            
            // Final State: Enforce user requirements
            if (extractBtn) extractBtn.disabled = true;
            if (aiRemoveBgBtn) aiRemoveBgBtn.disabled = true;
            if (generateBtn) generateBtn.disabled = true;
            if (downloadBtnSidebar) downloadBtnSidebar.disabled = false;
            
            // Download logic
            const triggerDownload = () => {
                const link = document.createElement("a");
                link.href = previewImage.src;
                link.download = "spritesheet.png";
                link.click();
            };
            if (downloadBtnSidebar) downloadBtnSidebar.onclick = triggerDownload;
            
            // Switch tabs
            tabFrames.classList.remove('active-tab');
            tabResult.classList.add('active-tab');

        } catch (error) {
            console.error(error);
            alert("Error generating spritesheet.");
        } finally {
            generateBtn.innerText = "▶ GENERATE SPRITESHEET";
            generateBtn.disabled = false;
        }
    });

    // Tab Switching
    tabFrames.addEventListener('click', () => {
        if (extractedFramesBase64.length > 0) {
            frameGallery.style.display = 'grid';
            previewImage.style.display = 'none';
            document.getElementById('previewContainer').style.display = 'block';
            tabFrames.classList.add('active-tab');
            tabResult.classList.remove('active-tab');
        }
    });

    tabResult.addEventListener('click', () => {
        if (previewImage.src && previewImage.src !== window.location.href) {
            frameGallery.style.display = 'none';
            previewImage.style.display = 'block';
            document.getElementById('previewContainer').style.display = 'flex';
            tabFrames.classList.remove('active-tab');
            tabResult.classList.add('active-tab');
        }
    });
});
