/**
 * CONSTRUO 2026 - AutoCAD Blueprint 3D Background
 * Interactive wireframe scene with parallax scrolling
 */

class AutoCADScene {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        if (!this.canvas) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = null;

        // State
        this.wireframes = [];
        this.gridLines = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.scrollY = 0;
        this.targetScrollY = 0;
        this.time = 0;
        this.isMobile = window.innerWidth < 768;
        this.isLowPower = this.detectLowPower();
        this.animationId = null;

        this.init();
    }

    detectLowPower() {
        // Detect low-power devices
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return true;

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                // Check for integrated graphics or mobile GPUs
                if (renderer.includes('intel') || renderer.includes('mali') || renderer.includes('adreno') || renderer.includes('software')) {
                    return true;
                }
            }
        } catch (e) {
            return true;
        }

        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return true;
        }

        // Don't just return this.isMobile; check if it's a high-end mobile
        return false;
    }

    init() {
        // Renderer setup - optimized for performance
        const pixelRatio = this.isLowPower ? 1 : Math.min(window.devicePixelRatio, 2);

        // Use a more compatible power preference for emulators
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: !this.isLowPower,
            alpha: true,
            powerPreference: 'default'
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setClearColor(0x0a0f1a, 1);

        // Camera position
        this.camera.position.set(0, 150, 400);
        this.camera.lookAt(0, 0, 0);

        // Create scene elements
        this.createBlueprintGrid();
        this.createWireframeStructures();
        this.createFloatingParticles();
        this.createGlowingLines();

        // Event listeners
        this.setupEventListeners();

        // Start animation
        this.animate();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());

        // Use passive event listeners for better performance
        document.addEventListener('mousemove', (e) => {
            this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        }, { passive: true });

        window.addEventListener('scroll', () => {
            this.targetScrollY = window.scrollY;
        }, { passive: true });

        // Pause animation when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAnimation();
            } else {
                this.startAnimation();
            }
        });
    }

    createBlueprintGrid() {
        const gridSize = this.isMobile ? 600 : 1200;
        const divisions = this.isMobile ? 30 : 60;

        // Main grid
        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x1e4a7a,
            transparent: true,
            opacity: 0.3
        });

        const gridGeometry = new THREE.BufferGeometry();
        const gridPoints = [];
        const step = gridSize / divisions;

        for (let i = -gridSize / 2; i <= gridSize / 2; i += step) {
            // Horizontal lines
            gridPoints.push(-gridSize / 2, 0, i);
            gridPoints.push(gridSize / 2, 0, i);
            // Vertical lines
            gridPoints.push(i, 0, -gridSize / 2);
            gridPoints.push(i, 0, gridSize / 2);
        }

        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
        const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
        grid.position.y = -100;
        this.scene.add(grid);
        this.mainGrid = grid;

        // Secondary glowing grid lines (major divisions)
        const majorGridMaterial = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.15
        });

        const majorStep = step * 5;
        const majorPoints = [];

        for (let i = -gridSize / 2; i <= gridSize / 2; i += majorStep) {
            majorPoints.push(-gridSize / 2, 0.5, i);
            majorPoints.push(gridSize / 2, 0.5, i);
            majorPoints.push(i, 0.5, -gridSize / 2);
            majorPoints.push(i, 0.5, gridSize / 2);
        }

        const majorGridGeometry = new THREE.BufferGeometry();
        majorGridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(majorPoints, 3));
        const majorGrid = new THREE.LineSegments(majorGridGeometry, majorGridMaterial);
        majorGrid.position.y = -100;
        this.scene.add(majorGrid);
    }

    createWireframeStructures() {
        const structureCount = this.isMobile ? 5 : 12;
        const structures = [];

        // Create different types of engineering structures
        for (let i = 0; i < structureCount; i++) {
            const type = Math.floor(Math.random() * 4);
            let structure;

            switch (type) {
                case 0:
                    structure = this.createBridgeWireframe();
                    break;
                case 1:
                    structure = this.createTowerWireframe();
                    break;
                case 2:
                    structure = this.createBuildingWireframe();
                    break;
                case 3:
                    structure = this.createCraneWireframe();
                    break;
            }

            // Position structures
            const spreadX = this.isMobile ? 200 : 500;
            const spreadZ = this.isMobile ? 200 : 400;

            structure.position.x = (Math.random() - 0.5) * spreadX;
            structure.position.z = (Math.random() - 0.5) * spreadZ - 100;
            structure.position.y = -100 + Math.random() * 20;

            structure.rotation.y = Math.random() * Math.PI * 2;

            // Store for animation
            structure.userData = {
                rotationSpeed: (Math.random() - 0.5) * 0.001,
                floatSpeed: Math.random() * 0.5 + 0.5,
                floatOffset: Math.random() * Math.PI * 2,
                baseY: structure.position.y
            };

            structures.push(structure);
            this.scene.add(structure);
        }

        this.wireframes = structures;
    }

    createBridgeWireframe() {
        const group = new THREE.Group();
        const material = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.6
        });

        const scale = Math.random() * 0.5 + 0.5;

        // Bridge deck
        const deckWidth = 120 * scale;
        const deckLength = 40 * scale;
        const deckHeight = 8 * scale;

        const deckGeometry = new THREE.BoxGeometry(deckWidth, deckHeight, deckLength);
        const deckEdges = new THREE.EdgesGeometry(deckGeometry);
        const deck = new THREE.LineSegments(deckEdges, material);
        group.add(deck);

        // Support pillars
        const pillarCount = 4;
        const pillarMaterial = material.clone();
        pillarMaterial.opacity = 0.4;

        for (let i = 0; i < pillarCount; i++) {
            const pillarHeight = 50 * scale;
            const pillarGeometry = new THREE.BoxGeometry(6 * scale, pillarHeight, 6 * scale);
            const pillarEdges = new THREE.EdgesGeometry(pillarGeometry);
            const pillar = new THREE.LineSegments(pillarEdges, pillarMaterial);

            const xOffset = (i % 2 === 0 ? -1 : 1) * (deckWidth / 3);
            const zOffset = (i < 2 ? -1 : 1) * (deckLength / 3);

            pillar.position.set(xOffset, -pillarHeight / 2 - deckHeight / 2, zOffset);
            group.add(pillar);
        }

        // Cable stay lines
        const cableMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });

        const cablePoints = [];
        const towerHeight = 60 * scale;

        // Add tower
        for (let side of [-1, 1]) {
            for (let i = 0; i < 6; i++) {
                const xPos = side * (deckWidth / 4 + i * 8 * scale);
                cablePoints.push(0, towerHeight, 0);
                cablePoints.push(xPos, 0, 0);
            }
        }

        const cableGeometry = new THREE.BufferGeometry();
        cableGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cablePoints, 3));
        const cables = new THREE.LineSegments(cableGeometry, cableMaterial);
        group.add(cables);

        return group;
    }

    createTowerWireframe() {
        const group = new THREE.Group();
        const scale = Math.random() * 0.6 + 0.4;

        const material = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.5
        });

        const towerHeight = 150 * scale;
        const baseWidth = 30 * scale;
        const topWidth = 10 * scale;

        // Tower frame with decreasing width
        const segments = 8;
        const segmentHeight = towerHeight / segments;

        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const width = baseWidth - (baseWidth - topWidth) * t;
            const nextWidth = baseWidth - (baseWidth - topWidth) * ((i + 1) / segments);
            const y = i * segmentHeight;

            // Create segment box
            const geometry = new THREE.BufferGeometry();
            const points = [];

            // Bottom square
            points.push(-width / 2, y, -width / 2);
            points.push(width / 2, y, -width / 2);
            points.push(width / 2, y, -width / 2);
            points.push(width / 2, y, width / 2);
            points.push(width / 2, y, width / 2);
            points.push(-width / 2, y, width / 2);
            points.push(-width / 2, y, width / 2);
            points.push(-width / 2, y, -width / 2);

            // Top square
            const topY = y + segmentHeight;
            points.push(-nextWidth / 2, topY, -nextWidth / 2);
            points.push(nextWidth / 2, topY, -nextWidth / 2);
            points.push(nextWidth / 2, topY, -nextWidth / 2);
            points.push(nextWidth / 2, topY, nextWidth / 2);
            points.push(nextWidth / 2, topY, nextWidth / 2);
            points.push(-nextWidth / 2, topY, nextWidth / 2);
            points.push(-nextWidth / 2, topY, nextWidth / 2);
            points.push(-nextWidth / 2, topY, -nextWidth / 2);

            // Vertical connections
            points.push(-width / 2, y, -width / 2);
            points.push(-nextWidth / 2, topY, -nextWidth / 2);
            points.push(width / 2, y, -width / 2);
            points.push(nextWidth / 2, topY, -nextWidth / 2);
            points.push(width / 2, y, width / 2);
            points.push(nextWidth / 2, topY, nextWidth / 2);
            points.push(-width / 2, y, width / 2);
            points.push(-nextWidth / 2, topY, nextWidth / 2);

            // Cross bracing
            points.push(-width / 2, y, -width / 2);
            points.push(nextWidth / 2, topY, nextWidth / 2);
            points.push(width / 2, y, -width / 2);
            points.push(-nextWidth / 2, topY, nextWidth / 2);

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            const segment = new THREE.LineSegments(geometry, material);
            group.add(segment);
        }

        return group;
    }

    createBuildingWireframe() {
        const group = new THREE.Group();
        const scale = Math.random() * 0.5 + 0.5;

        const material = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.4
        });

        const width = 40 * scale;
        const depth = 30 * scale;
        const height = (80 + Math.random() * 60) * scale;
        const floors = Math.floor(height / 15);

        // Main structure
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingEdges = new THREE.EdgesGeometry(buildingGeometry);
        const building = new THREE.LineSegments(buildingEdges, material);
        building.position.y = height / 2;
        group.add(building);

        // Floor lines
        const floorMaterial = material.clone();
        floorMaterial.opacity = 0.2;

        for (let i = 1; i < floors; i++) {
            const y = (i / floors) * height;
            const floorGeometry = new THREE.BufferGeometry();
            const points = [
                -width / 2, y, -depth / 2,
                width / 2, y, -depth / 2,
                width / 2, y, -depth / 2,
                width / 2, y, depth / 2,
                width / 2, y, depth / 2,
                -width / 2, y, depth / 2,
                -width / 2, y, depth / 2,
                -width / 2, y, -depth / 2
            ];
            floorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            const floor = new THREE.LineSegments(floorGeometry, floorMaterial);
            group.add(floor);
        }

        return group;
    }

    createCraneWireframe() {
        const group = new THREE.Group();
        const scale = Math.random() * 0.4 + 0.6;

        const material = new THREE.LineBasicMaterial({
            color: 0xff6b35,
            transparent: true,
            opacity: 0.6
        });

        const towerHeight = 100 * scale;
        const armLength = 80 * scale;
        const baseWidth = 15 * scale;

        // Tower
        const towerGeometry = new THREE.BoxGeometry(baseWidth, towerHeight, baseWidth);
        const towerEdges = new THREE.EdgesGeometry(towerGeometry);
        const tower = new THREE.LineSegments(towerEdges, material);
        tower.position.y = towerHeight / 2;
        group.add(tower);

        // Arm
        const armGeometry = new THREE.BoxGeometry(armLength, 8 * scale, 8 * scale);
        const armEdges = new THREE.EdgesGeometry(armGeometry);
        const arm = new THREE.LineSegments(armEdges, material);
        arm.position.set(armLength / 3, towerHeight, 0);
        group.add(arm);

        // Counter arm
        const counterGeometry = new THREE.BoxGeometry(armLength * 0.4, 6 * scale, 6 * scale);
        const counterEdges = new THREE.EdgesGeometry(counterGeometry);
        const counter = new THREE.LineSegments(counterEdges, material);
        counter.position.set(-armLength * 0.25, towerHeight, 0);
        group.add(counter);

        // Cable
        const cableMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4
        });

        const cableGeometry = new THREE.BufferGeometry();
        const cablePoints = [
            0, towerHeight + 10 * scale, 0,
            armLength * 0.6, towerHeight, 0,
            0, towerHeight + 10 * scale, 0,
            -armLength * 0.2, towerHeight, 0
        ];
        cableGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cablePoints, 3));
        const cables = new THREE.LineSegments(cableGeometry, cableMaterial);
        group.add(cables);

        return group;
    }

    createFloatingParticles() {
        const particleCount = this.isMobile ? 500 : 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const colorCyan = new THREE.Color(0x00d4ff);
        const colorBlue = new THREE.Color(0x1e90ff);
        const colorWhite = new THREE.Color(0xffffff);

        const spread = this.isMobile ? 300 : 600;

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = Math.random() * 400 - 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * spread;

            const colorChoice = Math.random();
            let color;
            if (colorChoice < 0.5) {
                color = colorCyan;
            } else if (colorChoice < 0.8) {
                color = colorBlue;
            } else {
                color = colorWhite;
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: this.isMobile ? 1 : 1.5,
            vertexColors: true,
            transparent: true,
            opacity: this.isMobile ? 0.4 : 0.6,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createGlowingLines() {
        // Create glowing technical measurement lines
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });

        const lineGroup = new THREE.Group();
        const lineCount = this.isMobile ? 5 : 15;

        for (let i = 0; i < lineCount; i++) {
            const geometry = new THREE.BufferGeometry();
            const length = Math.random() * 100 + 50;
            const points = [
                0, 0, 0,
                length, 0, 0
            ];

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            const line = new THREE.Line(geometry, lineMaterial);

            line.position.set(
                (Math.random() - 0.5) * 400,
                Math.random() * 200,
                (Math.random() - 0.5) * 300
            );

            line.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            line.userData = {
                pulseSpeed: Math.random() * 2 + 1,
                pulseOffset: Math.random() * Math.PI * 2
            };

            lineGroup.add(line);
        }

        this.glowingLines = lineGroup;
        this.scene.add(lineGroup);
    }

    onResize() {
        this.isMobile = window.innerWidth < 768;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    startAnimation() {
        if (!this.animationId) {
            this.animate();
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        this.time += 0.016; // Approximate 60fps delta

        // Smooth mouse following
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

        // Smooth scroll following
        this.scrollY += (this.targetScrollY - this.scrollY) * 0.05;

        // Camera parallax based on mouse and scroll
        const scrollProgress = this.scrollY / (document.body.scrollHeight - window.innerHeight);

        this.camera.position.x = this.mouseX * 50;
        this.camera.position.y = 150 - scrollProgress * 100 + this.mouseY * 30;
        this.camera.position.z = 400 - scrollProgress * 100;
        this.camera.lookAt(0, -scrollProgress * 50, -scrollProgress * 50);

        // Animate particles
        if (this.particles) {
            this.particles.rotation.y += 0.0002;
            this.particles.position.y = -this.scrollY * 0.015;
        }

        // Animate wireframes
        this.wireframes.forEach((structure) => {
            const { rotationSpeed, floatSpeed, floatOffset, baseY } = structure.userData;
            structure.rotation.y += rotationSpeed;
            structure.position.y = baseY + Math.sin(this.time * floatSpeed + floatOffset) * 3;
        });

        // Animate glowing lines
        if (this.glowingLines) {
            this.glowingLines.children.forEach((line) => {
                const pulse = Math.sin(this.time * line.userData.pulseSpeed + line.userData.pulseOffset);
                line.material.opacity = 0.2 + pulse * 0.15;
            });
        }

        // Grid movement
        if (this.mainGrid) {
            this.mainGrid.position.z = (this.scrollY * 0.02) % 20;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
let autocadScene;

document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure canvas is ready
    setTimeout(() => {
        autocadScene = new AutoCADScene();
    }, 100);
});

// Export for external access
window.AutoCADScene = AutoCADScene;
