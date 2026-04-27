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

        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
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
        // Criamos um plano invisível em y=0 para receber os cliques
        // O GameManager antigo raycastava contra this.core.water, 
        // então definimos this.water como esse plano invisível!
        const geo = new THREE.PlaneGeometry(400, 400);
        const mat = new THREE.MeshBasicMaterial({ visible: false });
        this.water = new THREE.Mesh(geo, mat);
        this.water.rotation.x = -Math.PI / 2;
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

// --- /game/BetManager ---
class BetManager {
    constructor() {
        this.balance = GAME_CONFIG.initialBalance;
        this.currentBet = 0;
        this.lives = GAME_CONFIG.lives;
        this.sunkCount = 0;
        this.isGameActive = false;
        this.updateUI();
    }

    placeBet(amount) {
        if (amount > this.balance) return false;
        this.balance -= amount;
        this.currentBet = amount;
        this.lives = GAME_CONFIG.lives;
        this.sunkCount = 0;
        this.isGameActive = true;
        this.updateUI();
        return true;
    }

    loseLife() {
        this.lives--;
        this.updateUI();
        if (this.lives <= 0) {
            this.isGameActive = false;
            return 'LOST';
        }
        return 'CONTINUE';
    }

    shipSunk() {
        this.sunkCount++;
        this.updateUI();
        return GAME_CONFIG.multipliers[this.sunkCount - 1];
    }

    cashOut() {
        const mult = GAME_CONFIG.multipliers[this.sunkCount - 1] || 0;
        const prize = this.currentBet * mult;
        this.balance += prize;
        this.isGameActive = false;
        this.currentBet = 0;
        this.updateUI();
        return prize;
    }

    updateUI() {
        document.getElementById('balance-display').innerText = `R$ ${this.balance.toFixed(2)}`;
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`life-${i}`).classList.toggle('lost', i > this.lives);
        }
        GAME_CONFIG.multipliers.forEach((m, idx) => {
            const el = document.getElementById(`mult-${idx + 1}`);
            el.classList.toggle('active', this.sunkCount > idx);
        });
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
// --- /game/GameManager ---
class GameManager {
    constructor() {
        this.state = 'IDLE';
        this.core = new CoreEngine();
        this.vfx = new VFXManager(this.core.scene, this.core.camera);
        this.grid = new GridSystem(GAME_CONFIG.gridSize);
        this.core.scene.add(this.grid.group);
        this.betManager = new BetManager();
        this.drone = new DroneController(this.core.scene, this.core.camera);
        this.markers = [];
        this.ships = [];
        this.attacks = new Set();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.setupEvents();
        this.animate();
    }

    setupEvents() {
        document.getElementById('place-bet-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            AudioManager.getInstance().play('click');
            this.startTurn();
        });
        document.getElementById('cashout-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            AudioManager.getInstance().play('click');
            this.doCashOut();
        });
        document.getElementById('continue-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // BLOQUEIA O TIRO FANTASMA IMEDIATO
            AudioManager.getInstance().play('click');
            document.getElementById('cashout-modal').style.display = 'none';
            
            // Estado neutro: interface trancada por 2 segundos antes de liberar
            this.state = 'COOLDOWN';
            this.drone.setWaiting(true);
            document.getElementById('status-display').innerText = "Reabastecendo, aguarde...";

            setTimeout(() => {
                if (this.state === 'COOLDOWN') {
                    this.state = 'PLAYING';
                    document.getElementById('status-display').innerText = "Pode abater o próximo alvo!";
                }
            }, 2000); // Exatos 2 segundos para dar início à nova caçada
        });

        // Botões de Aposta Rápida
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                AudioManager.getInstance().play('click');
                const mod = parseFloat(btn.dataset.mod);
                const input = document.getElementById('bet-input');
                let val = parseFloat(input.value);
                input.value = (val * mod).toFixed(2);
            });
        });

        window.addEventListener('click', (e) => this.handleBoardClick(e));
    }

    startTurn() {
        const val = parseFloat(document.getElementById('bet-input').value);
        if (this.betManager.placeBet(val)) {
            this.markers.forEach(m => this.core.scene.remove(m));
            this.markers = [];

            this.generateShips();
            this.attacks.clear();
            this.state = 'PLAYING';

            // Chance de Drone de Ouro (Bônus)
            const isGold = Math.random() < (GAME_CONFIG_BASE.goldDroneChance || 0.15);
            this.drone.setWaiting(true, isGold ? 'gold' : 'normal');

            if (isGold) {
                this.showFeedback("DRONE DE OURO ATIVADO!", "text-hit");
            }

            document.getElementById('place-bet-btn').disabled = true;
            document.getElementById('status-display').innerText = "Operação em curso! Selecione o alvo.";
        }
    }

    generateShips() {
        this.ships = [];
        this.vfx.clearFires(); // Limpar chamas anteriores

        // Limpar marcadores de debug antigos
        if (this.debugMarkers) {
            this.debugMarkers.forEach(m => this.core.scene.remove(m));
        }
        this.debugMarkers = [];

        for (let i = 0; i < GAME_CONFIG.shipCount; i++) {
            let placed = false;
            while (!placed) {
                const isH = Math.random() > 0.5;
                const c = Math.floor(Math.random() * (GAME_CONFIG.gridSize - (isH ? 3 : 0)));
                const r = Math.floor(Math.random() * (GAME_CONFIG.gridSize - (isH ? 0 : 3)));
                const pos = [];
                for (let j = 0; j < 3; j++) pos.push(isH ? `${c + j},${r}` : `${c},${r + j}`);

                if (!this.ships.some(s => s.pos.some(p => pos.includes(p)))) {
                    this.ships.push({ pos, hits: 0, sunk: false });
                    placed = true;

                    // Renderizar navios fantasma se o debug estiver ativado
                    if (window.GAME_CONFIG_BASE && window.GAME_CONFIG_BASE.debugShowShips) {
                        pos.forEach(p => {
                            const [cc, rr] = p.split(',').map(Number);
                            const wPos = this.grid.getWorldPosition(cc, rr);
                            const geo = new THREE.BoxGeometry(2, 0.2, 2);
                            const mat = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.3 });
                            const mesh = new THREE.Mesh(geo, mat);
                            mesh.position.copy(wPos);
                            mesh.position.y = 0.1;
                            this.core.scene.add(mesh);
                            this.debugMarkers.push(mesh);
                        });
                    }
                }
            }
        }
    }

    async handleBoardClick(e) {
        if (this.state !== 'PLAYING') return;
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.core.camera);
        const intersects = this.raycaster.intersectObject(this.core.water);

        if (intersects.length > 0) {
            const coords = this.grid.getGridCoords(intersects[0].point);
            if (!coords || this.attacks.has(`${coords.c},${coords.r}`)) return;

            this.state = 'ANIMATING';
            this.attacks.add(`${coords.c},${coords.r}`);
            const worldPos = this.grid.getWorldPosition(coords.c, coords.r);

            // Verificar se é o golpe final em um navio para cinemática
            const ship = this.ships.find(s => s.pos.includes(`${coords.c},${coords.r}`));
            const isLastHit = ship && ship.hits === 2;

            if (isLastHit) {
                await this.drone.deployCinematic(worldPos);
            } else {
                await this.drone.deploy(worldPos);
            }

            this.processResult(coords.c, coords.r, worldPos);
        }
    }

    processResult(c, r, worldPos) {
        const key = `${c},${r}`;
        const ship = this.ships.find(s => s.pos.includes(key));

        if (ship) {
            ship.hits++;
            this.showFeedback("ACERTOU MISERAVI", "text-hit");
            AudioManager.getInstance().play('hit');
            this.createMarker(worldPos, true);

            // Efeitos de impacto
            this.vfx.shake(ship.hits === 3 ? 2.5 : 0.8, 0.4);
            this.vfx.createPersistentFire(worldPos);

            if (ship.hits === 3) {
                ship.sunk = true;
                AudioManager.getInstance().play('sink');
                const mult = this.betManager.shipSunk();
                this.showCashoutModal(mult);
                if (this.betManager.sunkCount === GAME_CONFIG.shipCount) {
                    this.state = 'GAME_OVER';
                    document.getElementById('status-display').innerText = "MISSÃO COMPLETA! TODA A FROTA AFUNDADA.";
                }
                return;
            }
            this.state = 'PLAYING';
            this.drone.setWaiting(true);
        } else {
            this.showFeedback("AAAAAAGUA", "text-miss");
            AudioManager.getInstance().play('miss');
            this.createMarker(worldPos, false);
            const status = this.betManager.loseLife();
            if (status === 'LOST') {
                this.gameOver(false);
            } else {
                this.state = 'PLAYING';
                // Resetar drone para o modo espera após o erro
                this.drone.setWaiting(true);
            }
        }
    }

    showFeedback(txt, cls) {
        const el = document.getElementById('feedback-text');
        el.innerText = txt;
        el.className = cls;
        gsap.fromTo(el, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.2, duration: 0.4, yoyo: true, repeat: 1 });
    }

    showCashoutModal(mult) {
        this.state = 'MODAL';
        const modal = document.getElementById('cashout-modal');
        const payout = this.betManager.currentBet * mult;
        document.getElementById('modal-payout').innerText = `Lucro acumulado: R$ ${payout.toFixed(2)} (x${mult})`;
        modal.style.display = 'flex';
    }

    doCashOut() {
        const prize = this.betManager.cashOut();
        document.getElementById('cashout-modal').style.display = 'none';
        this.gameOver(true, prize);
    }

    gameOver(win, prize = 0) {
        this.state = 'IDLE';
        document.getElementById('place-bet-btn').disabled = false;
        document.getElementById('status-display').innerText = win ? `VOCÊ SACOU R$ ${prize.toFixed(2)}!` : "MISSÃO FALHOU! APOSTA PERDIDA.";
        if (!win) {
            // Revelar navios
            this.ships.forEach(s => {
                s.pos.forEach(p => {
                    const [c, r] = p.split(',').map(Number);
                    this.createMarker(this.grid.getWorldPosition(c, r), true, 0.4);
                });
            });
        }
    }

    createMarker(pos, isHit, op = 1.0) {
        const mat = new THREE.MeshStandardMaterial({ color: isHit ? 0x00ff88 : 0xff4a4a, transparent: true, opacity: op });
        const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2), mat);
        marker.position.copy(pos);
        this.core.scene.add(marker);
        this.markers.push(marker);
    }

    animate() {
        const time = performance.now() * 0.001;
        requestAnimationFrame(() => this.animate());
        this.core.update(time);
        this.drone.update(time);

        // Simular atualização leve do fog ou luzes
        this.core.sunLight.intensity = 2.0 + Math.sin(time) * 0.1;
    }

    setupLeaderboard() {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, 512, 512);
        ctx.fillStyle = '#00f2ff';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('ULTIMOS VENCEDORES', 40, 60);
        ctx.font = '30px Arial';
        const winners = ["USER_772 - R$ 1.200", "Beto_Drones - R$ 850", "Maj_Santos - R$ 4.200"];
        winners.forEach((w, i) => ctx.fillText(w, 40, 150 + i * 60));

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), mat);
        mesh.position.set(-60, 20, -40);
        mesh.rotation.y = Math.PI / 4;
        this.core.scene.add(mesh);
    }
}

// Inicializar Jogo
const game = new GameManager();
game.setupLeaderboard();
