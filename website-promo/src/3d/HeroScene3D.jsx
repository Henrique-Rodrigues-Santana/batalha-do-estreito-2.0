import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function HeroScene3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensões
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 🌅 Cena & Céu Alaranjado de Guerra (War-Torn Sunset)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0a05); // Alaranjado escuro profundo
    scene.fog = new THREE.FogExp2(0x240e06, 0.018); // Neblina atmosférica quente

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 7.5, 21);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 💡 Iluminação Cinematográfica de Pôr do Sol
    const ambientLight = new THREE.AmbientLight(0xff7733, 1.2);
    scene.add(ambientLight);

    // Sol Poente no Horizonte (Luz Dourada/Alaranjada Intensa)
    const sunsetSun = new THREE.DirectionalLight(0xff5500, 4.5);
    sunsetSun.position.set(0, 15, -40);
    scene.add(sunsetSun);

    // Luz de Borda / Rim Light Azul-Ciano Tático
    const rimLight = new THREE.DirectionalLight(0x00f2ff, 2.0);
    rimLight.position.set(-20, 25, 20);
    scene.add(rimLight);

    // Luz de Flash das Explosões Antiaéreas
    const flakFlashLight = new THREE.PointLight(0xffaa00, 0, 80);
    scene.add(flakFlashLight);

    // Luz de Propulsão do Motor
    const exhaustLight = new THREE.PointLight(0xff6600, 3, 15);
    scene.add(exhaustLight);

    // 🌊 Mar Revolto Tempestuoso Otimizado (42x42 para 65% menos carga de CPU)
    const oceanGeo = new THREE.PlaneGeometry(120, 120, 42, 42);
    oceanGeo.rotateX(-Math.PI / 2);

    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0a1828,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: true,
      emissive: 0x220c02, // Reflexo do fogo e céu alaranjado nas águas
      emissiveIntensity: 0.6
    });

    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = -2.8;
    scene.add(oceanMesh);

    // ☁️ Nuvens de Guerra Volumétricas em Camadas (War Clouds)
    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.DodecahedronGeometry(6.5, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x2d1810, // Nuvens escuras com tom de fumaça e fogo
      roughness: 0.95,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    const clouds = [];
    for (let i = 0; i < 28; i++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      const cx = (Math.random() - 0.5) * 80;
      const cy = 2 + Math.random() * 22;
      const cz = -35 + Math.random() * 55;
      cloud.position.set(cx, cy, cz);

      const s = 1.4 + Math.random() * 2.8;
      cloud.scale.set(s * (1 + Math.random() * 0.5), s * 0.45, s);
      cloud.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      cloudGroup.add(cloud);
      clouds.push({
        mesh: cloud,
        speed: 0.02 + Math.random() * 0.03,
        rotSpeed: (Math.random() - 0.5) * 0.005
      });
    }
    scene.add(cloudGroup);

    // 🛸 Drone Shahed-136
    const dronePivot = new THREE.Group();
    scene.add(dronePivot);

    const exhaustPoint = new THREE.Object3D();
    exhaustPoint.position.set(0, 0.15, -2.5); // Traseira
    dronePivot.add(exhaustPoint);

    // 🔥 Chama de Propulsão do Motor
    const flameGeo = new THREE.ConeGeometry(0.24, 1.6, 16);
    flameGeo.rotateX(-Math.PI / 2);
    flameGeo.translate(0, 0, -0.8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    exhaustPoint.add(flameMesh);

    const flameCoreGeo = new THREE.ConeGeometry(0.12, 0.9, 12);
    flameCoreGeo.rotateX(-Math.PI / 2);
    flameCoreGeo.translate(0, 0, -0.45);
    const flameCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffcc,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const flameCoreMesh = new THREE.Mesh(flameCoreGeo, flameCoreMat);
    exhaustPoint.add(flameCoreMesh);

    let loadedModel = null;
    const loader = new GLTFLoader();
    loader.load(
      '/assets/models/shahed-136.glb',
      (gltf) => {
        loadedModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5.2 / (maxDim || 1);

        loadedModel.scale.set(scale, scale, scale);
        const center = box.getCenter(new THREE.Vector3());
        loadedModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        loadedModel.rotation.y = Math.PI; // Bico apontando para a frente (+Z)

        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.metalness = 0.7;
              child.material.roughness = 0.3;
            }
          }
        });
        dronePivot.add(loadedModel);
      },
      undefined,
      (err) => console.warn('Hero 3D GLB load:', err)
    );

    dronePivot.position.set(0, 3.5, 2);
    dronePivot.rotation.x = 0.2;

    // 💨 Rastro de Fumaça Volumétrica do Motor
    const createSmokeTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(230, 210, 190, 0.8)');
      grad.addColorStop(0.5, 'rgba(120, 90, 80, 0.4)');
      grad.addColorStop(0.8, 'rgba(60, 45, 40, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    const smokeTexture = createSmokeTexture();
    const maxSmokePuffs = 140;
    const smokePuffs = [];

    const smokeGeo = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(maxSmokePuffs * 3);
    const smokeColors = new Float32Array(maxSmokePuffs * 3);
    const smokeSizes = new Float32Array(maxSmokePuffs);

    for (let i = 0; i < maxSmokePuffs; i++) {
      smokePositions[i * 3 + 1] = -100;
      smokePuffs.push({
        active: false,
        pos: new THREE.Vector3(0, -100, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1.8 + Math.random() * 0.8,
        size: 0.4 + Math.random() * 0.3,
        maxSize: 3.8 + Math.random() * 2.0
      });
    }

    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    smokeGeo.setAttribute('color', new THREE.BufferAttribute(smokeColors, 3));
    smokeGeo.setAttribute('size', new THREE.BufferAttribute(smokeSizes, 1));

    const smokeMaterial = new THREE.PointsMaterial({
      size: 1.6,
      map: smokeTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.NormalBlending
    });
    const smokeMesh = new THREE.Points(smokeGeo, smokeMaterial);
    scene.add(smokeMesh);

    // 💥 SISTEMA DE ARTILHARIA ANTIAÉREA (Flak Bursts & Tracers)
    // 1. Tiros Traçantes Incandescentes (AAA Tracers cortando o céu)
    const maxTracers = 18;
    const tracerGeo = new THREE.BufferGeometry();
    const tracerPos = new Float32Array(maxTracers * 6);
    const tracerColors = new Float32Array(maxTracers * 6);
    const tracers = [];

    for (let i = 0; i < maxTracers; i++) {
      tracers.push({
        active: false,
        origin: new THREE.Vector3(),
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        length: 2.5 + Math.random() * 2.0,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.0
      });
    }

    tracerGeo.setAttribute('position', new THREE.BufferAttribute(tracerPos, 3));
    tracerGeo.setAttribute('color', new THREE.BufferAttribute(tracerColors, 3));

    const tracerMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });
    const tracerLines = new THREE.LineSegments(tracerGeo, tracerMat);
    scene.add(tracerLines);

    // 2. Explosões de Bateria Antiaérea no Ar (Flak Explosions & Shrapnel)
    const maxFlakCount = 6;
    const flakBursts = [];
    const flakParticlesPerBurst = 35;
    const totalFlakParticles = maxFlakCount * flakParticlesPerBurst;

    const flakGeo = new THREE.BufferGeometry();
    const flakPositions = new Float32Array(totalFlakParticles * 3);
    const flakColors = new Float32Array(totalFlakParticles * 3);
    const flakSizes = new Float32Array(totalFlakParticles);

    for (let i = 0; i < totalFlakParticles; i++) {
      flakPositions[i * 3 + 1] = -100;
    }

    for (let b = 0; b < maxFlakCount; b++) {
      const particles = [];
      for (let p = 0; p < flakParticlesPerBurst; p++) {
        particles.push({
          pos: new THREE.Vector3(),
          vel: new THREE.Vector3(),
          size: 0.5 + Math.random() * 1.5
        });
      }
      flakBursts.push({
        active: false,
        center: new THREE.Vector3(),
        life: 0,
        maxLife: 1.8,
        particles
      });
    }

    flakGeo.setAttribute('position', new THREE.BufferAttribute(flakPositions, 3));
    flakGeo.setAttribute('color', new THREE.BufferAttribute(flakColors, 3));
    flakGeo.setAttribute('size', new THREE.BufferAttribute(flakSizes, 1));

    const flakMat = new THREE.PointsMaterial({
      size: 2.2,
      map: smokeTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.NormalBlending
    });
    const flakMesh = new THREE.Points(flakGeo, flakMat);
    scene.add(flakMesh);

    // Função para disparar uma explosão antiaérea no ar
    const triggerFlakBurst = () => {
      const burst = flakBursts.find(b => !b.active);
      if (!burst) return;

      // Posição ao redor do drone (perto mas sem colidir)
      const bx = (Math.random() - 0.5) * 22 + (Math.random() > 0.5 ? 6 : -6);
      const by = 2 + Math.random() * 10;
      const bz = (Math.random() - 0.5) * 20 - 4;
      burst.center.set(bx, by, bz);
      burst.active = true;
      burst.life = 0;

      // Flash instantâneo de iluminação
      flakFlashLight.position.copy(burst.center);
      flakFlashLight.intensity = 18;

      burst.particles.forEach(p => {
        p.pos.copy(burst.center);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 7.5;
        p.vel.set(
          Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
          (Math.random() - 0.3) * speed,
          Math.sin(angle) * speed
        );
      });
    };

    // Função para disparar um traçante antiaéreo
    const spawnTracer = () => {
      const tracer = tracers.find(t => !t.active);
      if (!tracer) return;

      tracer.active = true;
      tracer.life = 0;
      // Sai do mar / horizonte
      const ox = (Math.random() - 0.5) * 35;
      const oy = -3.5;
      const oz = -25 + Math.random() * 10;
      tracer.origin.set(ox, oy, oz);
      tracer.pos.copy(tracer.origin);

      // Sobe com ângulo agressivo em direção ao céu cruzando o campo de visão
      tracer.vel.set(
        (Math.random() - 0.5) * 15,
        28 + Math.random() * 18,
        22 + Math.random() * 20
      );
    };

    // ✨ Partículas de Brasas e Fagulhas no Ar (Ember Sparks)
    const embersCount = 80;
    const emberPos = new Float32Array(embersCount * 3);
    for (let i = 0; i < embersCount * 3; i += 3) {
      emberPos[i] = (Math.random() - 0.5) * 40;
      emberPos[i + 1] = Math.random() * 15;
      emberPos[i + 2] = (Math.random() - 0.5) * 40;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      size: 0.18,
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const emberMesh = new THREE.Points(emberGeo, emberMat);
    scene.add(emberMesh);

    // Mouse interativo
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Controle de Visibilidade com IntersectionObserver (Pausa quando fora de tela)
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Loop de Animação
    const clock = new THREE.Clock();
    let frameId = null;
    let lastSmokeSpawn = 0;
    let lastTracerSpawn = 0;
    let lastFlakSpawn = 0;
    const worldExhaustPos = new THREE.Vector3();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isVisible) return; // Pula cálculos e render quando fora da tela
      const elapsedTime = clock.getElapsedTime();

      // 🌊 Mar Revolto e Tempestuoso (Ondas Altas Multicamadas)
      const oceanPositions = oceanMesh.geometry.attributes.position;
      for (let i = 0; i < oceanPositions.count; i++) {
        const u = oceanPositions.getX(i);
        const v = oceanPositions.getZ(i);
        // Swell do mar revolto
        const wave1 = Math.sin(u * 0.25 + elapsedTime * 2.2) * Math.cos(v * 0.25 + elapsedTime * 1.8) * 0.9;
        const wave2 = Math.sin(u * 0.5 - elapsedTime * 3.0 + v * 0.3) * 0.45;
        const wave3 = Math.sin(Math.sqrt(u * u + v * v) * 0.3 - elapsedTime * 2.5) * 0.35;
        oceanPositions.setY(i, wave1 + wave2 + wave3);
      }
      oceanPositions.needsUpdate = true;

      // ☁️ Movimento e Iluminação das Nuvens
      clouds.forEach(c => {
        c.mesh.position.z += c.speed;
        c.mesh.rotation.y += c.rotSpeed;
        if (c.mesh.position.z > 25) {
          c.mesh.position.z = -40;
          c.mesh.position.x = (Math.random() - 0.5) * 80;
        }
      });

      // 🛸 Voo do Drone com Guinadas Táticas
      dronePivot.position.y = 3.5 + Math.sin(elapsedTime * 2.5) * 0.6;
      dronePivot.position.x = Math.sin(elapsedTime * 0.9) * 3.2 + mouseX * 2.8;
      dronePivot.position.z = 2 + Math.cos(elapsedTime * 1.3) * 0.9 - mouseY * 1.8;

      dronePivot.rotation.z = -Math.sin(elapsedTime * 0.9) * 0.28 - mouseX * 0.45;
      dronePivot.rotation.y = Math.sin(elapsedTime * 0.6) * 0.38 + mouseX * 0.5;
      dronePivot.rotation.x = 0.2 + mouseY * 0.28 + Math.sin(elapsedTime * 3.5) * 0.06;

      // Obter posição mundial do motor
      exhaustPoint.getWorldPosition(worldExhaustPos);
      exhaustLight.position.copy(worldExhaustPos);

      // Pulso do Afterburner
      const flicker = 0.8 + Math.random() * 0.4 + Math.sin(elapsedTime * 45) * 0.15;
      flameMesh.scale.set(flicker, flicker, flicker * (1.2 + Math.random() * 0.3));
      flameCoreMesh.scale.set(flicker * 0.9, flicker * 0.9, flicker * 1.1);
      exhaustLight.intensity = 2.8 * flicker;

      // 💥 Disparos de Artilharia Antiaérea (Temporizados)
      if (elapsedTime - lastTracerSpawn > 0.28) {
        lastTracerSpawn = elapsedTime;
        if (Math.random() > 0.3) spawnTracer();
      }

      if (elapsedTime - lastFlakSpawn > 1.3) {
        lastFlakSpawn = elapsedTime;
        triggerFlakBurst();
      }

      // Diminuir flash da explosão suavemente
      if (flakFlashLight.intensity > 0) {
        flakFlashLight.intensity *= 0.86;
        if (flakFlashLight.intensity < 0.1) flakFlashLight.intensity = 0;
      }

      // 💨 Atualizar Fumaça do Motor
      if (elapsedTime - lastSmokeSpawn > 0.02) {
        lastSmokeSpawn = elapsedTime;
        const puff = smokePuffs.find(p => !p.active) || smokePuffs[0];
        puff.active = true;
        puff.life = 0;
        puff.pos.copy(worldExhaustPos);

        const backwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(dronePivot.quaternion);
        puff.vel.set(
          backwardVec.x * 6 + (Math.random() - 0.5) * 1.2,
          backwardVec.y * 6 + 0.5 + Math.random() * 0.6,
          backwardVec.z * 6 + (Math.random() - 0.5) * 1.2
        );
      }

      const sPositions = smokeGeo.attributes.position.array;
      const sColors = smokeGeo.attributes.color.array;
      const sSizes = smokeGeo.attributes.size.array;

      for (let i = 0; i < maxSmokePuffs; i++) {
        const p = smokePuffs[i];
        if (p.active) {
          p.life += 0.03;
          const progress = p.life / p.maxLife;
          if (progress >= 1) {
            p.active = false;
            sPositions[i * 3 + 1] = -100;
            sSizes[i] = 0;
            continue;
          }
          p.pos.x += p.vel.x * 0.03;
          p.pos.y += p.vel.y * 0.03;
          p.pos.z += p.vel.z * 0.03;
          p.vel.multiplyScalar(0.96);

          sPositions[i * 3] = p.pos.x;
          sPositions[i * 3 + 1] = p.pos.y;
          sPositions[i * 3 + 2] = p.pos.z;
          sSizes[i] = THREE.MathUtils.lerp(p.size, p.maxSize, progress);

          if (progress < 0.15) {
            sColors[i * 3] = 1.0;
            sColors[i * 3 + 1] = 0.55;
            sColors[i * 3 + 2] = 0.15;
          } else if (progress < 0.45) {
            const t = (progress - 0.15) / 0.3;
            sColors[i * 3] = THREE.MathUtils.lerp(0.9, 0.45, t);
            sColors[i * 3 + 1] = THREE.MathUtils.lerp(0.45, 0.35, t);
            sColors[i * 3 + 2] = THREE.MathUtils.lerp(0.2, 0.3, t);
          } else {
            const fade = 1 - (progress - 0.45) / 0.55;
            sColors[i * 3] = 0.4 * fade;
            sColors[i * 3 + 1] = 0.3 * fade;
            sColors[i * 3 + 2] = 0.25 * fade;
          }
        }
      }
      smokeGeo.attributes.position.needsUpdate = true;
      smokeGeo.attributes.color.needsUpdate = true;
      smokeGeo.attributes.size.needsUpdate = true;

      // 💥 Atualizar Traçantes Antiaéreos
      const tPos = tracerGeo.attributes.position.array;
      const tCol = tracerGeo.attributes.color.array;

      for (let i = 0; i < maxTracers; i++) {
        const t = tracers[i];
        if (t.active) {
          t.life += 0.025;
          if (t.life >= t.maxLife) {
            t.active = false;
            tPos[i * 6 + 1] = -100;
            tPos[i * 6 + 4] = -100;
            continue;
          }

          t.pos.x += t.vel.x * 0.025;
          t.pos.y += t.vel.y * 0.025;
          t.pos.z += t.vel.z * 0.025;

          // Ponto inicial e final do segmento traçante
          const headX = t.pos.x;
          const headY = t.pos.y;
          const headZ = t.pos.z;

          const normVel = t.vel.clone().normalize().multiplyScalar(t.length);
          const tailX = headX - normVel.x;
          const tailY = headY - normVel.y;
          const tailZ = headZ - normVel.z;

          tPos[i * 6] = tailX;
          tPos[i * 6 + 1] = tailY;
          tPos[i * 6 + 2] = tailZ;
          tPos[i * 6 + 3] = headX;
          tPos[i * 6 + 4] = headY;
          tPos[i * 6 + 5] = headZ;

          // Cor incandescente (vermelho-laranja/amarelo traçante)
          tCol[i * 6] = 1.0;
          tCol[i * 6 + 1] = 0.25;
          tCol[i * 6 + 2] = 0.05;
          tCol[i * 6 + 3] = 1.0;
          tCol[i * 6 + 4] = 0.9;
          tCol[i * 6 + 5] = 0.3;
        }
      }
      tracerGeo.attributes.position.needsUpdate = true;
      tracerGeo.attributes.color.needsUpdate = true;

      // 💥 Atualizar Explosões de Flak
      const fPos = flakGeo.attributes.position.array;
      const fCol = flakGeo.attributes.color.array;
      const fSize = flakGeo.attributes.size.array;

      for (let b = 0; b < maxFlakCount; b++) {
        const burst = flakBursts[b];
        const baseIndex = b * flakParticlesPerBurst;

        if (burst.active) {
          burst.life += 0.03;
          const progress = burst.life / burst.maxLife;

          if (progress >= 1) {
            burst.active = false;
            for (let p = 0; p < flakParticlesPerBurst; p++) {
              fPos[(baseIndex + p) * 3 + 1] = -100;
              fSize[baseIndex + p] = 0;
            }
            continue;
          }

          for (let p = 0; p < flakParticlesPerBurst; p++) {
            const idx = baseIndex + p;
            const part = burst.particles[p];

            part.pos.x += part.vel.x * 0.03;
            part.pos.y += part.vel.y * 0.03;
            part.pos.z += part.vel.z * 0.03;
            part.vel.multiplyScalar(0.94); // Resistência do ar

            fPos[idx * 3] = part.pos.x;
            fPos[idx * 3 + 1] = part.pos.y;
            fPos[idx * 3 + 2] = part.pos.z;

            fSize[idx] = THREE.MathUtils.lerp(part.size * 0.5, part.size * 4.5, progress);

            // Flash inicial amarelo-fogo -> Fumaça preta volumétrica densa -> Dissipação
            if (progress < 0.12) {
              fCol[idx * 3] = 1.0;
              fCol[idx * 3 + 1] = 0.8;
              fCol[idx * 3 + 2] = 0.2;
            } else if (progress < 0.4) {
              const t = (progress - 0.12) / 0.28;
              fCol[idx * 3] = THREE.MathUtils.lerp(1.0, 0.2, t);
              fCol[idx * 3 + 1] = THREE.MathUtils.lerp(0.5, 0.12, t);
              fCol[idx * 3 + 2] = THREE.MathUtils.lerp(0.1, 0.08, t);
            } else {
              const fade = 1 - (progress - 0.4) / 0.6;
              fCol[idx * 3] = 0.15 * fade;
              fCol[idx * 3 + 1] = 0.1 * fade;
              fCol[idx * 3 + 2] = 0.08 * fade;
            }
          }
        }
      }
      flakGeo.attributes.position.needsUpdate = true;
      flakGeo.attributes.color.needsUpdate = true;
      flakGeo.attributes.size.needsUpdate = true;

      // Brasas
      const em = emberGeo.attributes.position.array;
      for (let i = 0; i < embersCount; i++) {
        em[i * 3 + 1] += 0.04;
        em[i * 3] += Math.sin(elapsedTime + i) * 0.02;
        if (em[i * 3 + 1] > 18) em[i * 3 + 1] = 0;
      }
      emberGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      oceanGeo.dispose();
      oceanMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      smokeTexture.dispose();
      smokeGeo.dispose();
      smokeMaterial.dispose();
      flameGeo.dispose();
      flameMat.dispose();
      flameCoreGeo.dispose();
      flameCoreMat.dispose();
      tracerGeo.dispose();
      tracerMat.dispose();
      flakGeo.dispose();
      flakMat.dispose();
      emberGeo.dispose();
      emberMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
}


