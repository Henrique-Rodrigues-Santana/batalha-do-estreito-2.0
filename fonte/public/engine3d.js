/** 
 * @fileoverview Jogo Batalha Naval 3D - Operação Drone (Casino Edition)
 * Versão Apostas - 2026
 */

// --- /core/Config ---
// Usar a configuração do arquivo config.js ou fallback
const GAME_CONFIG = window.GAME_CONFIG_BASE ? {
    ...window.GAME_CONFIG_BASE.difficulty[window.GAME_CONFIG_BASE.currentDifficulty],
    gridSize: window.GAME_CONFIG_BASE.gridSize,
    initialBalance: window.GAME_CONFIG_BASE.initialBalance,
    lives: 3
} : {
    gridSize: 10,
    initialBalance: 1000,
    shipCount: 3,
    multipliers: [2.0, 4.0, 10.0],
    lives: 3
};

// --- /utils/AudioManager ---
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    play(type) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        if (type === 'click') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.type = 'sine';
            osc.start(); osc.stop(this.ctx.currentTime + 0.1);
            return;
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === 'shoot') {
            osc.frequency.value = 150;
            gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
            osc.type = 'sawtooth';
        }
        else if (type === 'hit') {
            osc.frequency.setValueAtTime(100, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
            osc.type = 'sawtooth';
        }
        else if (type === 'miss') {
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
            osc.type = 'sine';
        }
        else if (type === 'sink') {
            osc.frequency.value = 100;
            gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 2.0);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.0);
            osc.type = 'sawtooth';
        }

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 2.5);
    }

    startFlight() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.flightOsc = this.ctx.createOscillator();
        this.flightGain = this.ctx.createGain();
        this.flightOsc.connect(this.flightGain);
        this.flightGain.connect(this.ctx.destination);

        this.flightOsc.type = 'sawtooth';
        this.flightOsc.frequency.setValueAtTime(100, this.ctx.currentTime);
        this.flightGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.flightGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.2);

        this.flightOsc.start();
    }

    updateFlight(t) {
        if (!this.flightOsc) return;
        // Frequência sobe conforme o drone mergulha (t de 0 a 1)
        this.flightOsc.frequency.setValueAtTime(100 + t * 400, this.ctx.currentTime);
    }

    stopFlight() {
        if (this.flightGain) {
            this.flightGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            setTimeout(() => {
                if (this.flightOsc) this.flightOsc.stop();
                this.flightOsc = null;
            }, 100);
        }
    }
}

AudioManager.getInstance = (function () {
    let instance;
    return function () {
        if (!instance) instance = new AudioManager();
        return instance;
    };
})();

// --- /utils/VFXManager ---
class VFXManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.fireGroup = new THREE.Group();
        this.scene.add(this.fireGroup);
    }

    shake(intensity = 1, duration = 0.5) {
        const originalPos = this.camera.position.clone();
        gsap.to(this.camera.position, {
            duration: duration,
            x: "+=" + (Math.random() - 0.5) * intensity,
            y: "+=" + (Math.random() - 0.5) * intensity,
            ease: "rough({ template: none, strength: 1, points: 20, taper: 'none', randomize: true, clamp: false})",
            onComplete: () => {
                this.camera.position.set(originalPos.x, originalPos.y, originalPos.z);
            }
        });
    }

    createPersistentFire(pos) {
        const particleCount = 15;
        const group = new THREE.Group();
        group.position.copy(pos);
        this.fireGroup.add(group);

        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.SphereGeometry(Math.random() * 0.4, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xff4400 : 0xffaa00,
                transparent: true,
                opacity: 0.8
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.set((Math.random() - 0.5) * 1, Math.random() * 2, (Math.random() - 0.5) * 1);
            group.add(p);

            gsap.to(p.position, {
                y: "+=" + (Math.random() * 3),
                duration: 1 + Math.random(),
                repeat: -1,
                ease: "none"
            });
            gsap.to(mat, {
                opacity: 0,
                duration: 1 + Math.random(),
                repeat: -1,
                ease: "none"
            });
        }
    }

    clearFires() {
        while (this.fireGroup.children.length > 0) {
            this.fireGroup.remove(this.fireGroup.children[0]);
        }
    }
}

// --- /core/CoreEngine ---
class CoreEngine {
    constructor() {
        this.scene = new THREE.Scene();
        // Pôr do Sol Sem Neblina para máxima nitidez ao longe
        this.scene.fog = new THREE.FogExp2(0xffaa55, 0.0005); // Quase zero

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(aspect < 1 ? 60 : 45, aspect, 0.1, 1000);
        this.camera.position.set(0, 35, 45); // Visão tática normal restaurada
        this.camera.lookAt(0, -3, 0); // Foco no tabuleiro com margem para o céu

        let canvas = document.getElementById('game-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'game-canvas';
            canvas.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;';
            document.body.appendChild(canvas);
        }
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.9;

        this.setupLighting();
        this.setupSky();
        
        // Terreno customizado (Substitui Water e City)
        this.setupTerrain();
        // Plano invisível para colisões de clique onde o mar estaria
        this.setupRaycastPlane();
        
        this.setupClouds(); // Nuvens reativadas para o mergulho cinemático!
        this.setupParticles();

        window.addEventListener('resize', () => this.onResize());
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0xffeedd, 1.0); // Ambiente muito mais claro (Pôr do Sol)
        this.scene.add(ambient);
        this.sunLight = new THREE.DirectionalLight(0xffa040, 3.5); // Sol laranja vibrante
        this.sunLight.position.set(50, 15, -150); // Sol no fundo do horizonte
        this.sunLight.castShadow = true;
        this.scene.add(this.sunLight);
    }

    setupSky() {
        const skyGeo = new THREE.SphereGeometry(400, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x2a5298) }, // Azul claro do entardecer no topo
                bottomColor: { value: new THREE.Color(0xff7722) }, // Laranja forte do Por do sol perto do mar
                offset: { value: 20 },
                exponent: { value: 0.5 }
            },
            vertexShader: `varying vec3 vWorldPosition; void main() { vec4 worldPosition = modelMatrix * vec4(position, 1.0); vWorldPosition = worldPosition.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize(vWorldPosition + offset).y; gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0); }`,
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(skyGeo, skyMat));
    }

    setupTerrain() {
        const loader = new THREE.GLTFLoader();
        loader.load('assets/terreno/desert_city.glb', (gltf) => {
            this.terrainModel = gltf.scene;
            
            // Aplicar calibragem em tempo real vinda do config.js
            const ts = window.GAME_CONFIG_BASE.terrainSettings;
            if (ts) {
                this.terrainModel.position.set(ts.x, ts.y, ts.z);
                this.terrainModel.scale.set(ts.scale, ts.scale, ts.scale);
                if (ts.rotationY !== undefined) this.terrainModel.rotation.y = ts.rotationY;
            }

            this.scene.add(this.terrainModel);
            console.log("Cenário Customizado (Desert City) carregado com sucesso!");
        }, undefined, (error) => {
            console.error("Erro ao carregar o cenário Desert City:", error);
        });
    }

    setupRaycastPlane() {
        const gridTotal = GAME_CONFIG.gridSize * (window.GAME_CONFIG_BASE?.cellSize || 3);
        const geo = new THREE.PlaneGeometry(gridTotal, gridTotal);
        const mat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide, depthWrite: false, depthTest: false });
        this.water = new THREE.Mesh(geo, mat);
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = 0;
        this.scene.add(this.water);
    }

    setupClouds() {
        const cloudGeo = new THREE.PlaneGeometry(250, 250); // Nuvens maiores para preencher o céu brilhante
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0xffaa66, // Cor de poente nas nuvens
            transparent: true, 
            opacity: 0.2, // Nuvens mais translúcidas para não poluir
            side: THREE.DoubleSide,
            depthWrite: false
        });

        this.clouds = new THREE.Group();
        for(let i=0; i<8; i++) {
            const cloud = new THREE.Mesh(cloudGeo, cloudMat);
            cloud.rotation.x = -Math.PI / 2;
            cloud.position.set(
                (Math.random() - 0.5) * 100,
                80 + Math.random() * 30, // Entre 80m e 110m (Drone nasce a 120m)
                (Math.random() - 0.5) * 100
            );
            cloud.rotation.z = Math.random() * Math.PI;
            cloud.scale.setScalar(1 + Math.random() * 2);
            this.clouds.add(cloud);
        }
        this.scene.add(this.clouds);
    }

    setupParticles() {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(300 * 3);
        for (let i = 0; i < 300; i++) { pos[i * 3] = (Math.random() - 0.5) * 200; pos[i * 3 + 1] = Math.random() * 20; pos[i * 3 + 2] = (Math.random() - 0.5) * 200; }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.2 }));
        this.scene.add(this.particles);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(time) {
        // Removido this.water.material.uniforms... pois agora a água é o modelo carregado
        
        // Se desejar atualizar a calibração do config.js visualmente em "tempo real" sem recarregar o jogo,
        // (útil para desenvolvimento apenas), poderiamos atualizar aqui. 
        // Mas a leitura será feita no carregamento.
        
        this.renderer.render(this.scene, this.camera);
    }
}

// --- /game/GridSystem ---
class GridSystem {
    constructor(size) {
        this.size = size;
        this.cellSize = 3;
        // Metade da largura visual total do grid = borda externa (Usado para as linhas visuais)
        this.gridHalf = (this.size * this.cellSize) / 2;
        // Coordenada local de centro celular do primeiro bloco (Usa para objetos físicos)
        this.centerOffset = this.gridHalf - (this.cellSize / 2);

        this.group = new THREE.Group();
        const mat = new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.3 });
        for (let i = 0; i <= size; i++) {
            const p1 = i * this.cellSize - this.gridHalf;
            const geoH = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p1, 0.1, -this.gridHalf), new THREE.Vector3(p1, 0.1, this.gridHalf)]);
            const geoV = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-this.gridHalf, 0.1, p1), new THREE.Vector3(this.gridHalf, 0.1, p1)]);
            this.group.add(new THREE.Line(geoH, mat), new THREE.Line(geoV, mat));
        }
    }
    getWorldPosition(c, r) { 
        return new THREE.Vector3(c * this.cellSize - this.centerOffset, 0.5, r * this.cellSize - this.centerOffset); 
    }
    getGridCoords(pos) {
        const c = Math.floor((pos.x + this.gridHalf) / this.cellSize);
        const r = Math.floor((pos.z + this.gridHalf) / this.cellSize);
        return (c >= 0 && c < this.size && r >= 0 && r < this.size) ? { c, r } : null;
    }
}

// --- /game/DroneController ---
class DroneController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.loader = new THREE.GLTFLoader();
        this.model = null;
        this.targetModel = null;
        this.drone = new THREE.Group();
        this.scene.add(this.drone);
        this.drone.visible = false;
        this.state = 'IDLE';
        this.droneType = 'normal'; // normal or gold

        this.smokeParticles = [];
        this.setupSmoke();
        this.loadModel();
        this.loadTargetModel();
    }

    loadTargetModel() {
        this.loader.load('assets/t-22.glb', (gltf) => {
            this.targetModel = gltf.scene;
            // Navio redimensionado (cabe em 3 blocos)
            this.targetModel.scale.set(0.12, 0.12, 0.12);
            this.targetModel.visible = false;
            this.scene.add(this.targetModel);
        });
    }

    loadModel() {
        this.loader.load('assets/3d-drone/iranian_shahed-136_military_drone.glb', (gltf) => {
            this.model = gltf.scene;
            // Escala para visibilidade total (0.6 é o segredo)
            this.model.scale.set(0.6, 0.6, 0.6);
            this.model.rotation.y = Math.PI;
            this.drone.add(this.model);
            console.log("Drone 3D carregado com sucesso!");
        }, undefined, (error) => {
            console.error("Erro ao carregar o drone 3D:", error);
            this.drone.add(this.createDroneMesh());
        });
    }

    setupSmoke() {
        this.smokeGroup = new THREE.Group();
        this.scene.add(this.smokeGroup);
    }

    createSmoke(pos) {
        const geo = new THREE.SphereGeometry(0.1, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.6 });
        const smoke = new THREE.Mesh(geo, mat);
        smoke.position.copy(pos);
        smoke.scale.set(1, 1, 1);
        this.smokeGroup.add(smoke);

        gsap.to(smoke.scale, { x: 4, y: 4, z: 4, duration: 1.5 });
        gsap.to(mat, {
            opacity: 0, duration: 1.5, onComplete: () => {
                this.smokeGroup.remove(smoke);
                geo.dispose();
                mat.dispose();
            }
        });
    }

    createDroneMesh() {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, metalness: 0.2 });
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 1.5); wingShape.lineTo(1.2, -1.0); wingShape.lineTo(-1.2, -1.0); wingShape.lineTo(0, 1.5);
        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.1, bevelEnabled: false });
        const wing = new THREE.Mesh(wingGeo, material);
        wing.rotation.x = Math.PI / 2;
        group.add(wing);
        return group;
    }

    createExplosion(pos) {
        const particleCount = 80;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            velocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.8, (Math.random() - 0.5) * 0.6));
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0xffaa00, size: 0.4, transparent: true, blending: THREE.AdditiveBlending });
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);

        const flashGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.9 });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(pos);
        this.scene.add(flash);

        gsap.to(flash.scale, { x: 8, y: 8, z: 8, duration: 0.5, ease: "power2.out" });
        gsap.to(flashMat, { opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => this.scene.remove(flash) });

        const startTime = Date.now();
        const updateParticles = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed < 1.0) {
                const posAttr = geometry.attributes.position;
                for (let i = 0; i < particleCount; i++) {
                    posAttr.array[i * 3] += velocities[i].x;
                    posAttr.array[i * 3 + 1] += velocities[i].y;
                    posAttr.array[i * 3 + 2] += velocities[i].z;
                    velocities[i].y -= 0.02;
                }
                posAttr.needsUpdate = true;
                material.opacity = 1.0 - elapsed;
                requestAnimationFrame(updateParticles);
            } else {
                this.scene.remove(points);
                geometry.dispose(); material.dispose();
            }
        };
        updateParticles();
    }

    createFlakExplosion(pos, group) {
        // Nuvem principal de Fumaça preta Flak 88mm
        const boxGeo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 1.5, 1);
        const boxMat = new THREE.MeshBasicMaterial({ 
            color: 0x111111, 
            transparent: true, 
            opacity: 0.9 
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.copy(pos);
        
        // Núcleo explosivo de fogo (flash laranja rápido)
        const flashGeo = new THREE.SphereGeometry(1.2 + Math.random(), 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 1.0 });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        
        box.add(flash);
        group.add(box);

        // Animação de Fogo que some rápido
        gsap.to(flash.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 0.2, ease: "power2.in" });
        // Fumaça expandindo e sumindo aos poucos com o vento
        gsap.to(box.scale, { x: 4, y: 4, z: 4, duration: 2.5, ease: "power1.out" });
        gsap.to(boxMat, { 
            opacity: 0, 
            duration: 2.5, 
            ease: "power2.out", 
            onComplete: () => {
                group.remove(box);
                boxGeo.dispose(); boxMat.dispose();
                flashGeo.dispose(); flashMat.dispose();
            } 
        });
    }

    update(time) {
        if (this.state === 'WAITING') {
            const radius = 15;
            const speed = time * 0.45;
            const x = Math.cos(speed) * radius;
            const z = Math.sin(speed) * radius;
            const y = 12 + Math.sin(time) * 1.0;

            const nextX = Math.cos(speed + 0.1) * radius;
            const nextZ = Math.sin(speed + 0.1) * radius;
            this.currentVelocity = new THREE.Vector3(nextX - x, 0, nextZ - z).normalize();

            this.drone.position.set(x, y, z);
            this.drone.lookAt(x + this.currentVelocity.x, y, z + this.currentVelocity.z);

            if (Math.random() > 0.85) {
                this.createSmoke(new THREE.Vector3(x, y, z));
            }
        }
    }

    setWaiting(active, type = 'normal') {
        if (active) {
            this.state = 'WAITING';
            this.droneType = type;
            this.drone.visible = true;
            this.drone.scale.set(1, 1, 1);

            // Aplicar cor dourada se for drone de ouro
            if (this.model) {
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.material.emissive = new THREE.Color(type === 'gold' ? 0xffaa00 : 0x000000);
                        child.material.emissiveIntensity = type === 'gold' ? 0.5 : 0;
                    }
                });
            }

            AudioManager.getInstance().startFlight();
        } else {
            if (this.state === 'WAITING') {
                this.state = 'IDLE';
                this.drone.visible = false;
                AudioManager.getInstance().stopFlight();
            }
        }
    }

    async deploy(targetPos) {
        const startPos = this.drone.position.clone();
        const startVel = this.currentVelocity ? this.currentVelocity.clone() : new THREE.Vector3(1, 0, 0);
        this.state = 'ATTACKING';

        // Curva de Bezier Cúbica para suavidade total
        // P0 = startPos
        // C1 = Saída tangencial da órbita
        const control1 = startPos.clone().add(startVel.multiplyScalar(15));
        // C2 = Aproximação do alvo por cima
        const control2 = new THREE.Vector3(
            targetPos.x,
            Math.max(startPos.y, 25),
            targetPos.z
        );
        // P3 = targetPos
        const endPos = new THREE.Vector3(targetPos.x, 0.5, targetPos.z);

        const obj = { t: 0 };
        const randomSeed = Math.random() * 100;

        // Usar Promise para garantir que o await funcione com o GSAP
        await new Promise(resolve => {
            gsap.to(obj, {
                t: 1,
                duration: 4.0,
                ease: "power1.inOut",
                onUpdate: () => {
                    const t = obj.t;
                    AudioManager.getInstance().updateFlight(t);

                    const invT = 1 - t;
                    const b0 = invT * invT * invT, b1 = 3 * invT * invT * t, b2 = 3 * invT * t * t, b3 = t * t * t;
                    const x = b0 * startPos.x + b1 * control1.x + b2 * control2.x + b3 * endPos.x;
                    const y = b0 * startPos.y + b1 * control1.y + b2 * control2.y + b3 * endPos.y;
                    const z = b0 * startPos.z + b1 * control1.z + b2 * control2.z + b3 * endPos.z;

                    const d1 = 3 * invT * invT * (control1.x - startPos.x) + 6 * invT * t * (control2.x - control1.x) + 3 * t * t * (endPos.x - control2.x);
                    const d2 = 3 * invT * invT * (control1.y - startPos.y) + 6 * invT * t * (control2.y - control1.y) + 3 * t * t * (endPos.y - control2.y);
                    const d3 = 3 * invT * invT * (control1.z - startPos.z) + 6 * invT * t * (control2.z - control1.z) + 3 * t * t * (endPos.z - control2.z);

                    this.drone.position.set(x, y, z);
                    this.drone.lookAt(x + d1, y + d2, z + d3);

                    if (Math.random() > (0.6 - (t * 0.3))) {
                        this.createSmoke(new THREE.Vector3(x, y, z));
                    }
                },
                onComplete: resolve
            });
        });

        this.state = 'IDLE';
        this.drone.visible = false;
        AudioManager.getInstance().stopFlight();
        AudioManager.getInstance().play('hit');
        this.createExplosion(endPos);

        await new Promise(r => setTimeout(r, 600));
    }

    async deployCinematic(targetPos) {
        const startPos = this.drone.position.clone();
        // Subindo a altitude de início para ter uma visão mais longa e ampla!
        startPos.y = 120; 

        const startVel = this.currentVelocity ? this.currentVelocity.clone() : new THREE.Vector3(1, 0, 0);
        this.state = 'ATTACKING';

        const originalCamPos = this.camera.position.clone();
        
        // ANEXANDO A CÂMERA AO BICO DO DRONE
        this.drone.add(this.camera);
        // O drone voa na direção de seu eixo. Como a câmera apareceu invertida,
        // viramos ela 180 graus (Math.PI) no eixo Y.
        // Posição: centro (X=0), levemente acima (Y=0.5), e deslocado para a frente no eixo invertido (Z=1.5)
        this.camera.position.set(0, 0.5, 1.5);
        this.camera.rotation.set(0, Math.PI, 0);

        const hud = document.getElementById('drone-hud');
        if (hud) hud.classList.remove('hidden');

        if (this.targetModel) {
            this.targetModel.position.set(targetPos.x, 0, targetPos.z);
            this.targetModel.visible = true;
        }

        const control1 = startPos.clone().add(startVel.multiplyScalar(20));
        // Ajustamos control2 para manter uma curva mais alta no começo
        const control2 = new THREE.Vector3(targetPos.x, 60, targetPos.z);
        const endPos = new THREE.Vector3(targetPos.x, 0.5, targetPos.z);

        const obj = { t: 0 };
        const hudAlt = document.getElementById('hud-alt');
        const altBar = document.getElementById('alt-bar');
        const hudSpd = document.getElementById('hud-spd');

        // Grupo para guardar os tiros traçantes (anti-aérea)
        const tracerGroup = new THREE.Group();
        this.scene.add(tracerGroup);

        await new Promise(resolve => {
            gsap.to(obj, {
                t: 1,
                // Duração do mergulho agora em modo Câmera Lenta para curtir o cenário
                duration: 10.0,
                ease: "power2.in",
                onUpdate: () => {
                    const t = obj.t;
                    AudioManager.getInstance().updateFlight(t);

                    const invT = 1 - t;
                    const b0 = invT * invT * invT, b1 = 3 * invT * invT * t, b2 = 3 * invT * t * t, b3 = t * t * t;
                    const x = b0 * startPos.x + b1 * control1.x + b2 * control2.x + b3 * endPos.x;
                    const y = b0 * startPos.y + b1 * control1.y + b2 * control2.y + b3 * endPos.y;
                    const z = b0 * startPos.z + b1 * control1.z + b2 * control2.z + b3 * endPos.z;

                    const d1 = 3 * invT * invT * (control1.x - startPos.x) + 6 * invT * t * (control2.x - control1.x) + 3 * t * t * (endPos.x - control2.x);
                    const d2 = 3 * invT * invT * (control1.y - startPos.y) + 6 * invT * t * (control2.y - control1.y) + 3 * t * t * (endPos.y - control2.y);
                    const d3 = 3 * invT * invT * (control1.z - startPos.z) + 6 * invT * t * (control2.z - control1.z) + 3 * t * t * (endPos.z - control2.z);

                    this.drone.position.set(x, y, z);
                    this.drone.lookAt(x + d1, y + d2, z + d3);

                    if (hudAlt) hudAlt.innerText = y.toFixed(1);
                    if (altBar) altBar.style.height = (y / 15 * 100) + '%';
                    if (hudSpd) hudSpd.innerText = (45 + t * 150).toFixed(0);

                    // TIROS TRAÇANTES E FLAK (Cortina de Ferro Estilo 2ª Guerra Mundial)
                    // Frequência massiva e contínua em TODAS direções (sem o limitador de bursts)
                    if (Math.random() > 0.45) { // 55% de chance A CADA FRAME de criar tiro/explosão
                        const tracerGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
                        const tracerMat = new THREE.MeshStandardMaterial({ 
                            color: 0xffffff, emissive: 0xff8800, emissiveIntensity: 5.0,
                            transparent: true, opacity: 0.9 
                        });
                        const tracer = new THREE.Mesh(tracerGeo, tracerMat);

                        // Nascem muito espalhados gerando impressão de múltiplos canhões
                        const spawnX = endPos.x + (Math.random() - 0.5) * 40;
                        const spawnZ = endPos.z + (Math.random() - 0.5) * 40;
                        tracer.position.set(spawnX, endPos.y + 1, spawnZ);

                        // Vetor base mirando pro alto, mas totalmente espalhado pras laterais ("todas direções")
                        const targetVec = new THREE.Vector3(
                            (Math.random() - 0.5) * 80, 
                            100 + Math.random() * 80, // Sobe muito
                            (Math.random() - 0.5) * 80
                        );
                        
                        // Direciona a "cabeça" da bala pro seu percurso
                        const dir = targetVec.clone().normalize();
                        tracer.lookAt(tracer.position.clone().add(dir));
                        tracer.rotateX(Math.PI / 2);

                        tracerGroup.add(tracer);

                        const destY = targetVec.y;
                        const duration = 0.8 + Math.random() * 0.8; // Variáveis de velocidade

                        // Animando com "Ease out" e drop no Y para simular a Gravidade Arc (Traçantes Curvos no ceu)
                        gsap.to(tracer.position, {
                            x: "+=" + targetVec.x,
                            y: "+=" + (destY - 60), // Gravidade puxando o rastro pra baixo gerando Curva de Parábola Visual
                            z: "+=" + targetVec.z,
                            duration: duration,
                            ease: "power2.out", // Desacelera conforme sobe! Muito realista
                            onComplete: () => {
                                tracerGroup.remove(tracer);
                                tracerGeo.dispose(); tracerMat.dispose();
                            }
                        });

                        // EXPLOSÃO AÉREA FLAK!
                        // Muitas balas não chegam no final gasta, elas EXLODEM no ar gerando tufos escuros e fogo.
                        if (Math.random() > 0.5) {
                            setTimeout(() => {
                                if (tracerGroup.children.includes(tracer)) {
                                    this.createFlakExplosion(tracer.position, tracerGroup);
                                    tracer.visible = false; // "Apaga" a bala branca e só fica a explosão no ar
                                }
                            }, (duration * 1000) * (0.2 + Math.random() * 0.6)); // Estoura aleatoriamente no meio do percurso
                        }
                    }
                },
                onComplete: resolve
            });
        });

        // Retornar a câmera IMEDIATAMENTE (rápido!) para ver a explosão e o navio afundando de cima
        this.scene.attach(this.camera);
        gsap.to(this.camera.position, {
            x: originalCamPos.x, y: originalCamPos.y, z: originalCamPos.z,
            duration: 0.5, ease: "power2.out",
            onUpdate: () => this.camera.lookAt(0, -3, 0)
        });

        this.state = 'IDLE';
        this.drone.visible = false;
        
        // Afundando o navio
        if (this.targetModel) {
            gsap.to(this.targetModel.position, {
                y: -5,
                duration: 6,
                ease: "power2.in",
                onComplete: () => {
                    this.targetModel.visible = false;
                }
            });
            gsap.to(this.targetModel.rotation, {
                x: 0.2, // inclina afundando
                z: -0.1,
                duration: 6
            });
        }
        
        if (hud) hud.classList.add('hidden');
        this.scene.remove(tracerGroup);

        AudioManager.getInstance().stopFlight();
        AudioManager.getInstance().play('hit');
        this.createExplosion(endPos);

        await new Promise(r => setTimeout(r, 600));
    }
}

class Engine3D {
    constructor(onCellClick, onPlacementClick, onHover) {
        this.core = new CoreEngine();
        this.vfx = new VFXManager(this.core.scene, this.core.camera);
        this.grid = new GridSystem(GAME_CONFIG.gridSize);
        this.core.scene.add(this.grid.group);
        this.drone = new DroneController(this.core.scene, this.core.camera);
        this.markers = [];
        this.shipMeshes = [];
        this.previewMeshes = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.onCellClick = onCellClick;
        this.onPlacementClick = onPlacementClick;
        this.onHover = onHover;
        
        this.isActive = false;
        this.mode = 'ATTACK'; // 'ATTACK' or 'PLACEMENT'
        this.attackedCells = new Set();

        window.addEventListener('click', (e) => this.handleBoardClick(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.handleBoardClick({ clientX: touch.clientX, clientY: touch.clientY, target: e.target });
            }
        });
        this.animate();
    }

    start(mode = 'ATTACK') {
        this.isActive = true;
        this.mode = mode;
        this.attackedCells.clear();
        this.clearMarkers();
        this.clearShips();
        this.clearPreview();
        this.vfx.clearFires();
        
        if (mode === 'ATTACK') {
            this.drone.setWaiting(true, 'normal');
        } else {
            this.drone.setWaiting(false); // No drone during placement
        }
        
        const canvas = document.getElementById('game-canvas');
        if (canvas) canvas.style.display = 'block';
    }

    stop() {
        this.isActive = false;
        this.drone.setWaiting(false);
        const canvas = document.getElementById('game-canvas');
        if (canvas) canvas.style.display = 'none';
    }

    clearMarkers() {
        this.markers.forEach(m => this.core.scene.remove(m));
        this.markers = [];
    }

    clearShips() {
        this.shipMeshes.forEach(m => this.core.scene.remove(m));
        this.shipMeshes = [];
    }
    
    clearPreview() {
        this.previewMeshes.forEach(m => this.core.scene.remove(m));
        this.previewMeshes = [];
    }

    getIntersectedCell(e) {
        if (!this.isActive) return null;
        // Só processa cliques no canvas
        const canvas = document.getElementById('game-canvas');
        if (e.target && e.target !== canvas) return null;

        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.core.camera);
        const intersects = this.raycaster.intersectObject(this.core.water);

        if (intersects.length > 0) {
            return this.grid.getGridCoords(intersects[0].point);
        }
        return null;
    }

    handleMouseMove(e) {
        if (this.mode !== 'PLACEMENT') return;
        // Para mousemove, não filtramos por target - queremos preview contínuo
        if (!this.isActive) return;
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.core.camera);
        const intersects = this.raycaster.intersectObject(this.core.water);
        let coords = null;
        if (intersects.length > 0) {
            coords = this.grid.getGridCoords(intersects[0].point);
        }
        if (this.onHover) {
            this.onHover(coords ? coords.c : -1, coords ? coords.r : -1);
        }
    }

    handleBoardClick(e) {
        const coords = this.getIntersectedCell(e);
        if (!coords) return;

        if (this.mode === 'PLACEMENT') {
            if (this.onPlacementClick) this.onPlacementClick(coords.c, coords.r);
        } else if (this.mode === 'ATTACK') {
            if (this.drone.state !== 'WAITING') return;
            if (!this.attackedCells.has(`${coords.c},${coords.r}`) && this.onCellClick) {
                this.onCellClick(coords.c, coords.r);
            }
        }
    }

    renderShips(board) {
        this.clearShips();
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[r].length; c++) {
                if (board[r][c]) {
                    const wPos = this.grid.getWorldPosition(c, r);
                    const geo = new THREE.BoxGeometry(2.5, 0.5, 2.5);
                    const mat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.6, metalness: 0.5, roughness: 0.2 });
                    const mesh = new THREE.Mesh(geo, mat);
                    mesh.position.copy(wPos);
                    mesh.position.y = 0.25;
                    this.core.scene.add(mesh);
                    this.shipMeshes.push(mesh);
                }
            }
        }
    }

    renderPreview(r, c, size, isHoriz, isValid) {
        this.clearPreview();
        if (r < 0 || c < 0) return;
        
        const color = isValid ? 0x00ff88 : 0xff4a4a;
        
        for (let k = 0; k < size; k++) {
            const rr = isHoriz ? r : r + k;
            const cc = isHoriz ? c + k : c;
            
            if (rr < GAME_CONFIG.gridSize && cc < GAME_CONFIG.gridSize) {
                const wPos = this.grid.getWorldPosition(cc, rr);
                const geo = new THREE.BoxGeometry(2.5, 0.6, 2.5);
                const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.copy(wPos);
                mesh.position.y = 0.3;
                this.core.scene.add(mesh);
                this.previewMeshes.push(mesh);
            }
        }
    }

    async processAttack(c, r, hit, sunk, isCinematic) {
        this.attackedCells.add(`${c},${r}`);
        const worldPos = this.grid.getWorldPosition(c, r);

        if (isCinematic) {
            await this.drone.deployCinematic(worldPos);
        } else {
            await this.drone.deploy(worldPos);
        }

        this.createMarker(worldPos, hit);

        if (hit) {
            AudioManager.getInstance().play('hit');
            this.vfx.shake(sunk ? 2.5 : 0.8, 0.4);
            this.vfx.createPersistentFire(worldPos);
            if (sunk) AudioManager.getInstance().play('sink');
        } else {
            AudioManager.getInstance().play('miss');
        }

        this.drone.setWaiting(true);
    }

    createMarker(pos, isHit) {
        const mat = new THREE.MeshStandardMaterial({
            color: isHit ? 0x00ff88 : 0xff4a4a,
            transparent: true,
            opacity: 0.9,
            emissive: isHit ? 0x00ff88 : 0xff4a4a,
            emissiveIntensity: 0.5
        });
        const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2), mat);
        marker.position.copy(pos);
        this.core.scene.add(marker);
        this.markers.push(marker);
    }

    animate() {
        const time = performance.now() * 0.001;
        requestAnimationFrame(() => this.animate());
        if (this.isActive) {
            this.core.update(time);
            this.drone.update(time);
            this.core.sunLight.intensity = 2.0 + Math.sin(time) * 0.1;
        }
    }
}

window.Engine3D = Engine3D;

