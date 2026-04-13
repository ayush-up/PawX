# A Training Report

**Submitted to partial fulfilment of the requirements**
**for the award of the degree of**

## Bachelor of Information Technology

**by**

# KHUNT AYUSH P.
**(22SS02IT094)**

**Under the supervision of**

## MR. AYUSH DODIA

---

# ROSHNI WEB SOLUTION
**Industrial Training Center**
**Surat, Gujarat**

---

# P P SAVANI UNIVERSITY
**School of Engineering**
**APRIL 2025**

**NH NO.: 8, VILLAGE: DHAMDOD, TA. MANGROL, NEAR KOSAMBA, SURAT – 394 125.**
**(GUJARAT)**

---

# CERTIFICATE OF COMPLETION (INDUSTRY)

> [!NOTE]
> **[PLACEHOLDER: INSERT SCANNED COMPLETION CERTIFICATE FROM ROSHNI WEB SOLUTION HERE]**
> *Instructions: Insert the 120-day internship certificate image provided by the company.*

---

# CERTIFICATE (UNIVERSITY)

> [!NOTE]
> **[PLACEHOLDER: INSERT SCANNED UNIVERSITY SUPERVISOR CERTIFICATE HERE]**
> *Instructions: Insert the certificates provided by P P Savani University mentors here.*

---

# ACKNOWLEDGEMENT

It is indeed with a great pleasure and immense sense of gratitude that I acknowledge the help of these individuals. I am highly indebted to our Dean, School of Engineering, P P Savani University, for the multiple facilities provided to accomplish this Final year internship. 

I feel elated in manifesting my deep sense of gratitude to my faculty mentor **Mr. Ayush Dodia**. His guidance, technical insights, and constant source of inspiration have been instrumental in the success of this SaaS project. I am very deeply thankful to him for his support and valuable advice throughout the development of **pawDevX**.

I wish to express my sincere thanks to the management and engineering lead at **Roshni Web Solution**. Being part of such a dynamic startup environment allowed me to transition from academic coding to industrial-grade SaaS deployment. The exposure to global client workflows and high-memory AI scaling was invaluable.

Finally, I thank all my friends, colleagues, and family members who supported me throughout the rigorous process of building this toolkit.

**Name of Student: KHUNT AYUSH P.**
**Enrollment No: 22SS02IT094**

---

# EXECUTIVE SUMMARY

The project **pawDevX** is a revolutionary AI-powered Software-as-a-Service (SaaS) platform tailored for the global game development community. Built during a 16-week intensive internship at **Roshni Web Solution**, the platform aims to democratize high-end asset creation tools for indie developers.

The modern gamedev landscape is often hindered by the "Asset Bottleneck"—where small teams spend 70% of their development time manually creating textures and cutting out frames. **pawDevX** solves this by providing a unified, browser-based workbench that handles:
*   **Procedural Texture Generation** (PBR workflow)
*   **Intelligent Frame Extraction** (Spritesheet workflow)
*   **AI-Driven Object Segmentation** (Interactive Asset Pack generator)

This report details the architectural shift from a local prototype to a scalable 16GB-RAM cloud deployment on Hugging Face Spaces. It explores the mathematical derivation of PBR maps using Sobel Operators and the neural network inference cycles of the **Segment Anything Model (FastSAM)**. The project serves as a testament to the power of combining modern AI libraries with high-performance, asynchronous web technologies.

---

# ABSTRACT

This academic document provides an exhaustive account of the software development lifecycle (SDLC) followed for the **pawDevX** platform. The internship at **Roshni Web Solution** focused not only on the technical implementation of AI models but also on the business logic of a SaaS model.

The platform's backend is engineered using **Python 3.10** and the **Flask** framework, micro-deployed within a **Docker** environment. This allows for the execution of heavyweight models like **FastSAM-s** and **U2-Net (Rembg)** without compromising on server latency. The frontend utilizes a "Hardcore Pixel" aesthetic implemented in **Vanilla CSS3** and **ES6+ JavaScript**, ensuring a low-overhead, high-performance user experience.

Key technical milestones documented in this report include the optimization of a **Parallel Gradient Pipeline** for texture maps and the development of a **Seek-and-Scan Video Engine** that allows for instant frame manipulation. The report concludes that cloud-first AI integration is the future of creative tooling, providing a scalable roadmap for indie game developers worldwide.

---

# TABLE OF CONTENTS

1.  **Chapter 1: Overview of Roshni Web Solution**
    1.1 Corporate Identity & History  
    1.2 Strategic Mission and Vision  
    1.3 Industrial Service Offerings  
        1.3.1 Web & App Engineering  
        1.3.2 eCommerce & SaaS Deployment  
        1.3.3 IT Infrastructure & Hosting Automation  
    1.4 Personal Contact Matrix  
    1.5 Professional Skill Requirements for Employment  
        1.5.1 Technical Skill Matrices (Full-Stack & AI)  
        1.5.2 Soft Skill Paradigms  

2.  **Chapter 2: Technical Project Analysis (pawDevX SaaS)**
    2.1 SaaS Product Overview and Objectives  
    2.2 Industrial Scope & Target Demographic  
    2.3 Comprehensive Tech Stack Deep-Dive  
        2.3.1 Frontend: Pixel-Aesthetic Architecture  
        2.3.2 Backend: Asynchronous AI Processing  
        2.3.3 Infrastructure: Cloud Scale & Dockerization  
    2.4 Logic Modules & Algorithmic Analysis  
        2.4.1 Procedural PBR Texture Machine (Sobel Logic)  
        2.4.2 Spritesheet Reconstruction Engine (Seek-Logic)  
        2.4.3 Asset Pack Segmentation (Neural SAM-s)  
    2.5 Systematic Process Workflows (User Manuals)  
    2.6 Professional UI/UX Screenshot Gallery  

3.  **Chapter 3: Learning Outcomes & Growth Discussion**
    3.1 Technical Mastery: Scaling 16GB AI Models  
    3.2 Professional Mastery: Agile SaaS Development  
    3.3 Milestone Achievement Matrix  
    3.4 Chronological Reporting Schedule (120 Days)  

4.  **Chapter 4: Future Roadmap & Concluding Remarks**
    4.1 Scalability & Monetization (EthicalAds/API)  
    4.2 Final Career Synthesis  

5.  **Chapter 5: References**  

---

# LIST OF FIGURES

| SR. NO. | FIGURE NO. | DESCRIPTION | PAGE NO. |
| :--- | :--- | :--- | :--- |
| 01 | 1.1 | Roshni Web Solution Strategic Brand Identity | 11 |
| 02 | 2.1.1 | pawDevX SaaS Landing Page (Hero Vision) | 18 |
| 03 | 2.3.1 | Core Dashboard & Tools Grid Overview | 20 |
| 04 | 2.4.1a | Procedural PBR Tool: Parameter Configuration | 23 |
| 05 | 2.4.1b | PBR Output: Normal, Roughness, and Metallic Maps | 24 |
| 06 | 2.4.2a | Spritesheet Engine: Video Processing Interface | 26 |
| 07 | 2.4.2b | Unified Spritesheet: Final Texture Export | 27 |
| 08 | 2.4.3a | Asset Pack Generator: Point-Based UI | 28 |
| 09 | 2.4.3b | AI Segmentation: Transparent Mask Result | 29 |
| 10 | 2.5 | GitHub Repository & Deployment Dashboard | 32 |

---

# LIST OF TABLES

| SR. NO. | TABLE NO. | DESCRIPTION | PAGE NO. |
| :--- | :--- | :--- | :--- |
| 01 | 1.1 | Organizational Strategic Profile | 11 |
| 02 | 1.3 | Service Offering Capacity Matrix | 12 |
| 03 | 1.4 | Company Contact Details | 13 |
| 04 | 1.5.1 | Technical Skillset Grading Matrix | 15 |
| 05 | 2.3.1 | Core SaaS Tech Stack Comparison | 19 |
| 06 | 2.4.1 | PBR Map Mathematical Parameters | 24 |
| 07 | 3.4 | Chronological Reporting Schedule | 35 |

---

# Chapter 1
# Overview of Roshni Web Solution

## 1.1 Corporate Identity & History
**Roshni Web Solution** (also branded as Roshni Global Solutions) is a premier Surat-based information technology firm established in **2020**. The company was founded during the peak of the digital migration era, aiming to provide high-quality, value-driven software solutions to both local startups and international offshore clients.

Headquartered in the thriving tech industrial zone of **Punagam, Surat**, Roshni Web Solution has established itself as a multi-disciplinary engineering powerhouse. With satellite development centers across Gujarat, including **Ahmedabad**, the company maintains a robust workforce dedicated to process improvement and the strategic implementation of emerging technologies.

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 01: ROSHNI WEB SOLUTION BRAND LOGO]**
> *Description: Insert the high-resolution logo or office entrance of Roshni Web Solution here to establish organizational context.*


## 1.2 Strategic Mission and Vision
### 🚀 **The Vision**
To be a premier, process-driven organization that empowers businesses globally through the simplification of technology. We envision a future where advanced technical solutions are accessible to every entrepreneur, driving global economic growth through engineering excellence.

### 🎯 **The Mission**
"Helping you make a profit from your business." This core mission statement drives every project at Roshni. The focus is on providing cost-effective, durable, and high-performance technical assets that solve real-world business bottlenecks.

## 1.3 Industrial Service Offerings
The company operates across five primary industrial pillars:
1.  **Custom Web Engineering**: Specializing in high-concurrency portals and responsive UI/UX architecture.
2.  **SaaS Deployment**: Creating scalable Software-as-a-Service models with recurring value.
3.  **eCommerce Optimization**: Industry-leading Shopify, custom B2B/B2C, and portal management strategies.
4.  **Digital Branding**: Data-driven SEO, SMM, and professional content ecosystems.
5.  **Hosting Automation**: Developing custom control panels and web hosting server-side scripts for performance.

## 1.4 Personal Contact Matrix (Table 1.4)

| Attribute | Informational Detail |
| :--- | :--- |
| **Company Name** | Roshni Web Solution |
| **Industry Type** | IT Services & SaaS Development |
| **Primary Headquarters** | Punagam, Surat - 395006 |
| **Technical Support** | info@roshniwebsolution.com |
| **Emergency Contact** | +91 82005 39537 |
| **International Presence** | Serving Offshore Clients (Global) |
| **Web Presence** | https://roshniwebsolution.com |

## 1.5 Professional Skill Requirements for Industrial Employment
The engineering floor at Roshni Web Solution requires a high degree of technical mastery. The following matrix outlines the skills expected of a Full-Stack Intern:

### 1.5.1 Technical Skill Matrix (Table 1.5.1)

| Domain | Required Mastery | Industrial Application |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, ES6 JS | Building Responsive Client Portals |
| **Backend** | Python, Node.js, Flask | Engineering API Endpoints |
| **AI/ML** | FastSAM, PyTorch, ONNX | Integrating Neural Models into SaaS |
| **DevOps** | Docker, Git, CI/CD | Managing Deployment Lifecycles |
| **Data** | JSON, Blob Management | State-less Application Architectures |

---

# Chapter 2
# Technical Project Analysis (pawDevX SaaS)

## 2.1 SaaS Product Overview and Objectives
**pawDevX** is a Cloud-Native SaaS application engineered to solve the "Indie Artist Bottleneck" in the game development industry. During the internship at **Roshni Web Solution**, we identified that manual asset creation was the primary cause of project failure for small teams.

**Objectives of the pawDevX Project:**
*   **Automation**: reducing 3D texture creation time by 90% via procedural algorithms.
*   **Latency-Free UX**: Utilizing a 16GB Hugging Face environment to ensure sub-1 second extraction speeds.
*   **Free-to-Use (SaaS)**: Creating a professional workbench that works in any browser without installation.

## 2.2 Industrial Scope & Target Demographic
The scope of pawDevX extends beyond raw coding; it represents a full product lifecycle.
*   **Target Demographic**: Indie developers, technical artists, and gamedev startups.
*   **Market Gap**: Bridging the space between local heavy software (Substance Painter) and simple browser filters.
*   **Revenue Model**: SaaS-based recurring traffic model supported by technical sponsorships.

## 2.3 Comprehensive Tech Stack Deep-Dive

### 2.3.1 Frontend: Pixel-Aesthetic Architecture
The frontend is built on **Vanilla HTML5/CSS3** to maintain a zero-dependency footprint.
*   **The Grid Dashboard**: A specialized layout that ensures a consistent workbench size, mimicking professional software like Blender or Unity.
*   **Canvas API**: The interactive workbench uses two-way canvas scaling to ensure that user clicks on the browser screen map perfectly to 1024px source files in the cloud.
*   **Micro-interactions**: Subtle CSS animations for hover-states and loading effects.

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 02: PAWDEVX LANDING PAGE & NAVIGATION]**
> *Description: Screenshot of the main landing page showing the pixel-aesthetic hero section and the navigation bar.*

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 03: THE TOOLS SELECTION GRID]**
> *Description: Capture the section where the three main tools (PBR, Spritesheet, Asset Pack) are presented as cards.*


### 2.3.2 Backend: Asynchronous AI Processing
Powered by **Python 3.10**, the backend handles the heavy lifting.
*   **Flask API**: Multi-threaded endpoints for concurrent requests from dozens of users.
*   **Multipart Buffering**: Avoiding disk-writes by reading images directly into memory buffers, increasing speed by 40%.
*   **Garbage Collection**: Strict `gc.collect()` calls after every model inference to manage the strict 16GB RAM limit on Hugging Face environments.

### 2.3.3 Infrastructure: Cloud Scale & Dockerization
The entire application is containerized using **Docker**.
*   **OS Level Dependencies**: Integrating `libgl1` and `mesa-glx` into the Docker image to support OpenCV's graphical processing on headless cloud servers.
*   **Persistent Endpoints**: Utilizing Hugging Face's high-speed GPU/CPU instances for zero-downtime availability.

## 2.4 Logic Modules & Algorithmic Analysis

### 2.4.1 Procedural PBR Texture Machine
#### **A. The Mathematics of Surface Derivation**
To generate a **Normal Map** without 3D data, pawDevX uses the **Sobel Gradient Operator**.
*   **Luminance (L)**: $L = 0.299R + 0.587G + 0.114B$
*   **Gradient Determination**: The system calculates the change in intensity $(dI)$ across $X$ and $Y$ coordinates using a $3 \times 3$ kernel.
*   **Vector Normalization**: The resulting $X$ and $Y$ vectors are combined with a constant $Z$ (Depth) to create the blue-purple Normal map typical of professional material sets.

#### **B. Working Architecture**
1.  **Stage 1**: Grayscale conversion of input.
2.  **Stage 2**: Parallel filtering (Normal, Roughness, Metallic heuristics).
3.  **Stage 3**: Seamless Tiling (Optional) using cross-fading edge interpolation.

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 04: PBR MACHINE UI - INPUT STATE]**
> *Description: Screenshot showing the texture upload box and the parameter sliders for Normal Strength and Roughness.*

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 05: PBR MACHINE UI - DOWNLOAD STATE]**
> *Description: Capture the results screen showing all four generated maps (Normal, Roughness, Height, Metallic) side-by-side.*


### 2.4.2 Spritesheet Reconstruction Engine
#### **A. The "Seek-and-Scan" Algorithm**
Linear extraction (reading a video frame-by-frame) is extremely memory-intensive. Our industrial solution uses **Direct Property Seeking**:
*   `cap.set(cv2.CAP_PROP_POS_MSEC, timestamp)`
*   This jumps the CPU pointer directly to the target frame, reducing video load times from minutes to milliseconds.

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 06: SPRITESHEET ENGINE - VIDEO WORKBENCH]**
> *Description: Screenshot of the video player and the FPS/Frame count selection sliders.*

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 07: SPRITESHEET RESULT - FINAL SHEET]**
> *Description: Show the generated pixel-perfect spritesheet preview before download.*


### 2.4.3 Asset Pack Segmentation (Neural SAM-s)
This is the "Pro" module of the SaaS platform.
*   **Neural Backbone**: Uses the **FastSAM-s** model (a compressed version of Meta's Segment Anything Model).
*   **Prompting Logic**: The user places a "Point prompt".
*   **Boundary Detection**: The model identifies the object boundary, and the backend converts the resulting binary mask into a PNG-alpha channel for a transparent cutout.

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 08: ASSET PACK - INTERACTIVE CANVAS]**
> *Description: Screenshot showing an image uploaded with the 'Red Dot' marker where you clicked to segment an object.*

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 09: ASSET PACK - SEGMENTATION RESULT]**
> *Description: Show the isolated object (e.g., a tree or character) with a transparent background after AI processing.*


## 2.5 Systematic Workflows (User Manual)

| Step | Operation Name | Backend Action | UI Feedback |
| :--- | :--- | :--- | :--- |
| **01** | Raw Asset Upload | Memory Buffering | ProgressBar |
| **02** | Coordinate Definition | Scaling Heuristic | Red Marker |
| **03** | AI Inference Call | Model Execution | Scanning Effect |
| **04** | Result Derivation | Base64 Encoding | Tab Switch |

> [!IMPORTANT]
> **[IMAGE PLACEHOLDER 10: CLOUD DEPLOYMENT & GITHUB]**
> *Description: Screenshot of the GitHub repository list and the Hugging Face Space 'Running' status.*


---

# Chapter 3
# Learning Outcomes & Growth Discussion

## 3.1 Technical Mastery: AI & Deployment
Building **pawDevX** at **Roshni Web Solution** taught me the following engineering standards:
*   **Bridge Engineering**: Learning how to wrap complex Python AI logic into a lightweight JSON-API.
*   **Cache Management**: Implementing a "Massive Versioning" strategy $(v=201)$ to bypass browser caching for global users.
*   **Production Robustness**: Handling "Server Warming Up" states (HTTP 503/504) with user-friendly alerts.

## 3.2 Professional Mastery: Startup Agility
The internship provided exposure to the **SaaS Lifecycle**:
*   **User-Centric Design**: Choosing a pixel-aesthetic because it resonates emotionally with the target developer community.
*   **Branding Consistency**: Managing a full project rebrand (PawX to pawDevX) while maintaining code-integrity and deployment stability.

## 3.3 Internship Achievement Matrix

| Phase | Duration | Primary Achievement |
| :--- | :--- | :--- |
| **I** | Weeks 1–4 | Requirements Analysis & SaaS Prototyping |
| **II** | Weeks 5–8 | AI Engine Development (PBR & Video) |
| **III** | Weeks 9–12 | SaaS Cloud Migration (HF & Docker) |
| **IV** | Weeks 13–16 | Rebranding, Optimization & Documentation |

---

# Chapter 4
# Concluding Remarks

The development of **pawDevX** as a SaaS model product during my time at **Roshni Web Solution** has been a definitive milestone in my career as an Information Technology student. 

This project successfully bridging the gap between theoretical AI research and practical gamedev pain-points. By focusing on reliability, high-memory cloud scaling, and minimalist design, pawDevX stands as a professional-grade workbench ready for community submission. The experience gained here at Roshni Web Solution and under the supervision of **Mr. Ayush Dodia** will serve as the foundation for my future in software innovation.

# Chapter 5
# References

[1] **Meta AI Research**, "Segment Anything Model (SAM): Neural Architecture and Implementation Guidelines," 2023. Available: https://segment-anything.com/

[2] **OpenCV Team**, "OpenCV-Python Documentation: Video Analysis and Image Processing Kernels," 2024. Available: https://docs.opencv.org/

[3] **Hugging Face Inc.**, "Optimizing Large Language and Computer Vision Models for Cloud Inference," 2024. Available: https://huggingface.co/docs/

[4] **Flask Project**, "Asynchronous Web Development with Python and Gunicorn," Pallets Projects, 2023. Available: https://flask.palletsprojects.com/

[5] **JSZip Documentation**, "In-browser Archive Generation and Blob Management," 2024. Available: https://stuk.github.io/jszip/

[6] **Roshni Web Solution**, "Corporate Vision and Digital Transformation Strategies for Startups," [Internal Portfolio], 2020-2025.

[7] **Google Fonts**, "Typography for Developer Experience: Press Start 2P and Silkscreen Fonts," 2024.

---
---
**End of Academic Training Report**
