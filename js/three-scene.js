/**
 * CONSTRUO 2026 - Three.js Scene Setup
 * 3D Visual Elements and Particle System
 */

class ConstruoScene {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.particles = null;
        this.buildings = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.scrollY = 0;

        this.init();
    }

    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        // Camera position
        this.camera.position.z = 50;
        this.camera.position.y = 10;

        // Lights
        this.setupLights();

        // Create elements
        this.createParticleField();
        this.createCityscape();
        this.createGridFloor();

        // Events
        window.addEventListener('resize', () => this.onResize());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('scroll', () => this.onScroll());

        // Start animation
        this.animate();
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);

        // Point lights for accent
        const accentLight1 = new THREE.PointLight(0xff6b35, 1, 100);
        accentLight1.position.set(-20, 20, 30);
        this.scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(0x4a90d9, 0.5, 100);
        accentLight2.position.set(20, 10, 20);
        this.scene.add(accentLight2);
    }

    createParticleField() {
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 1000 : 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const color1 = new THREE.Color(0xff6b35); // Accent orange
        const color2 = new THREE.Color(0x4a90d9); // Blueprint blue
        const color3 = new THREE.Color(0xffffff); // White

        const spreadX = isMobile ? 100 : 200;
        const offsetX = isMobile ? -30 : 0; // Shift particles left on mobile

        for (let i = 0; i < particleCount; i++) {
            // Position - spread in 3D space
            positions[i * 3] = (Math.random() - 0.5) * spreadX + offsetX;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

            // Color - random between accent colors
            const colorChoice = Math.random();
            let color;
            if (colorChoice < 0.3) {
                color = color1;
            } else if (colorChoice < 0.6) {
                color = color2;
            } else {
                color = color3;
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Size variation
            sizes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: isMobile ? 0.3 : 0.5,
            vertexColors: true,
            transparent: true,
            opacity: isMobile ? 0.5 : 0.8,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createCityscape() {
        const isMobile = window.innerWidth < 768;
        const buildingCount = isMobile ? 15 : 30;
        const buildingGroup = new THREE.Group();

        const spreadX = isMobile ? 80 : 150;
        const offsetX = isMobile ? -20 : 0; // Shift buildings left on mobile

        for (let i = 0; i < buildingCount; i++) {
            const width = Math.random() * 5 + 2;
            const height = Math.random() * 30 + 10;
            const depth = Math.random() * 5 + 2;

            // Building geometry
            const geometry = new THREE.BoxGeometry(width, height, depth);

            // Wireframe material for blueprint feel
            const edges = new THREE.EdgesGeometry(geometry);
            const material = new THREE.LineBasicMaterial({
                color: 0x4a90d9,
                transparent: true,
                opacity: 0.3
            });

            const building = new THREE.LineSegments(edges, material);

            // Position buildings
            building.position.x = (Math.random() - 0.5) * spreadX + offsetX;
            building.position.y = height / 2 - 30;
            building.position.z = (Math.random() - 0.5) * 80 - 20;

            // Store initial height for animation
            building.userData.targetHeight = height;
            building.userData.currentHeight = 0;
            building.userData.delay = Math.random() * 2;

            this.buildings.push(building);
            buildingGroup.add(building);
        }

        this.buildingGroup = buildingGroup;
        this.scene.add(buildingGroup);
    }

    createGridFloor() {
        const gridSize = 200;
        const gridDivisions = 50;

        const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x4a90d9, 0x1a2332);
        grid.position.y = -30;
        grid.material.transparent = true;
        grid.material.opacity = 0.3;

        this.grid = grid;
        this.scene.add(grid);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onScroll() {
        this.scrollY = window.scrollY;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Particle animation
        if (this.particles) {
            this.particles.rotation.y = time * 0.02;
            this.particles.rotation.x = Math.sin(time * 0.1) * 0.1;

            // Move particles based on scroll
            this.particles.position.y = -this.scrollY * 0.02;
        }

        // Camera parallax effect
        this.camera.position.x += (this.mouseX * 5 - this.camera.position.x) * 0.02;
        this.camera.position.y += (this.mouseY * 3 + 10 - this.camera.position.y) * 0.02;
        this.camera.lookAt(0, 0, 0);

        // Building group rotation based on scroll
        if (this.buildingGroup) {
            this.buildingGroup.rotation.y = this.scrollY * 0.0002;
        }

        // Grid animation
        if (this.grid) {
            this.grid.position.z = (this.scrollY * 0.01) % 4;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
let construoScene;

document.addEventListener('DOMContentLoaded', () => {
    construoScene = new ConstruoScene();
});
