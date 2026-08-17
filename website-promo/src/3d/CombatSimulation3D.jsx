import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

export default function CombatSimulation3D({ viewMode = 'attack', onPhaseChange, onImpact, onSignalLost }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050b14, 0.012);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x00f2ff, 2.8);
    moonLight.position.set(40, 80, 40);
    scene.add(moonLight);

    const explosionLight = new THREE.PointLight(0xff4a00, 0, 120);
    explosionLight.position.set(0, 3, 0);
    scene.add(explosionLight);

    // 🌊 Oceano
    const oceanGeo = new THREE.PlaneGeometry(200, 200, 80, 80);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x051d38,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
      emissive: 0x001a33,
      emissiveIntensity: 0.5
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = -1.5;
    scene.add(oceanMesh);

    // ☁️ Nuvens
    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.DodecahedronGeometry(7, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x1a2634,
      transparent: true,
      opacity: 0.4,
      roughness: 0.9,
      depthWrite: false
    });

    for (let i = 0; i < 30; i++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 100,
        35 + Math.random() * 25,
        (Math.random() - 0.5) * 100
      );
      const s = 1.8 + Math.random() * 3.0;
      cloud.scale.set(s, s * 0.4, s);
      cloudGroup.add(cloud);
    }
    scene.add(cloudGroup);

    // 🚢 Navio Alvo (Corveta T-22)
    const shipPivot = new THREE.Group();
    scene.add(shipPivot);

    const loader = new GLTFLoader();

    loader.load('/assets/models/t-22.glb', (gltf) => {
      const ship = gltf.scene;
      const box = new THREE.Box3().setFromObject(ship);
      const size = box.getSize(new THREE.Vector3());
      const scale = 6.2 / (Math.max(size.x, size.y, size.z) || 1);
      ship.scale.set(scale, scale, scale);

      const center = box.getCenter(new THREE.Vector3());
      ship.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      shipPivot.add(ship);
    });

    // 🛸 Drone Shahed-136
    const droneRoot = new THREE.Group();
    const droneModelHolder = new THREE.Group();
    droneRoot.add(droneModelHolder);
    scene.add(droneRoot);

    loader.load('/assets/models/shahed-136.glb', (gltf) => {
      const drone = gltf.scene;
      const box = new THREE.Box3().setFromObject(drone);
      const size = box.getSize(new THREE.Vector3());
      const scale = 2.8 / (Math.max(size.x, size.y, size.z) || 1);
      drone.scale.set(scale, scale, scale);

      const center = box.getCenter(new THREE.Vector3());
      drone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      drone.rotation.y = Math.PI; // Bico para frente

      droneModelHolder.add(drone);
    });

    // 🔫 Metralhadora do Defensor
    const gunGroup = new THREE.Group();
    const barrelGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.2 });
    const barrel1 = new THREE.Mesh(barrelGeo, barrelMat);
    barrel1.position.set(0.12, -0.2, -0.8);
    const barrel2 = new THREE.Mesh(barrelGeo, barrelMat);
    barrel2.position.set(-0.12, -0.2, -0.8);
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.6), barrelMat);
    gunBody.position.set(0, -0.2, -0.3);
    gunGroup.add(barrel1, barrel2, gunBody);
    scene.add(gunGroup);
    gunGroup.visible = false;

    // Grupos de Efeitos
    const tracerGroup = new THREE.Group();
    scene.add(tracerGroup);

    const flakGroup = new THREE.Group();
    scene.add(flakGroup);

    // Partículas de Impacto Final
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;

      particleVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          Math.random() * 15 + 5,
          (Math.random() - 0.5) * 20
        )
      );
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.45,
      color: 0xff3300,
      transparent: true,
      opacity: 0
    });
    const explosionParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(explosionParticles);

    // Flak Burst no Ar
    const createFlakBurst = (pos) => {
      const flak = new THREE.Group();
      flak.position.copy(pos);

      const flashLight = new THREE.PointLight(0xff6600, 8, 20);
      flak.add(flashLight);

      const puffGeo = new THREE.DodecahedronGeometry(1.8, 1);
      const puffMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.8,
        roughness: 1
      });
      const puff = new THREE.Mesh(puffGeo, puffMat);
      flak.add(puff);

      flakGroup.add(flak);

      gsap.to(puff.scale, {
        x: 3.5,
        y: 3.5,
        z: 3.5,
        duration: 1.8,
        ease: 'power1.out'
      });

      gsap.to(puffMat, {
        opacity: 0,
        duration: 1.8,
        ease: 'power2.in',
        onComplete: () => {
          flakGroup.remove(flak);
          puffGeo.dispose();
          puffMat.dispose();
        }
      });

      gsap.to(flashLight, {
        intensity: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    // 🎬 LÓGICA DE ANIMAÇÃO CINEMÁTICA
    let isExploded = false;
    let tracerInterval = null;
    let flakInterval = null;
    let animTimeline = null;

    const startCombatAnimation = () => {
      isExploded = false;
      explosionLight.intensity = 0;
      particleMat.opacity = 0;
      if (tracerInterval) clearInterval(tracerInterval);
      if (flakInterval) clearInterval(flakInterval);

      // Trajetória
      const cruisePos = new THREE.Vector3(25, 75, 110);
      const midPos = new THREE.Vector3(-12, 38, 45); // Ponto de desvio
      const targetPos = new THREE.Vector3(0, 0.5, 0);

      droneRoot.position.copy(cruisePos);
      droneRoot.visible = true;

      // Resetar partículas
      const pPos = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount * 3; i++) pPos[i] = 0;
      particleGeo.attributes.position.needsUpdate = true;

      if (viewMode === 'attack') {
        // =========================================================
        // 🚀 CENA 1: VISÃO FPV DO BICO + HUD HMD (VARREDURA -> LOCK -> MERGULHO)
        // =========================================================
        gunGroup.visible = false;

        // Ocultar corpo do drone para a câmera estar 100% no bico/óptica frontal
        droneModelHolder.visible = false;

        // FASE 1: VARREDURA ÓPTICA (Cruzeiro)
        if (onPhaseChange) onPhaseChange('SEARCHING');

        // Timeline de 3 etapas
        const tl = gsap.timeline();

        // 1. Etapa de Busca (2.2s de varredura no céu)
        const scanObj = { t: 0 };
        tl.to(scanObj, {
          t: 1,
          duration: 2.2,
          ease: 'none',
          onUpdate: () => {
            // Movimento suave de varredura
            const p = cruisePos.clone().add(new THREE.Vector3(Math.sin(scanObj.t * 3) * 3, Math.cos(scanObj.t * 2) * 1.5, -scanObj.t * 10));
            droneRoot.position.copy(p);
            droneRoot.lookAt(targetPos);

            // Câmera fixada no bico
            camera.position.copy(droneRoot.position);
            camera.lookAt(targetPos);
          }
        });

        // 2. Transição para LOCK-ON
        tl.add(() => {
          if (onPhaseChange) onPhaseChange('LOCKED');
        });

        // Pequena pausa dramática do Lock (0.6s)
        tl.to({}, { duration: 0.6 });

        // 3. Etapa de Mergulho & Evasão com Flak (4.2s)
        tl.add(() => {
          if (onPhaseChange) onPhaseChange('DIVING');

          // Disparos Flak da 2ª Guerra explodindo no ar
          flakInterval = setInterval(() => {
            if (isExploded) return;
            const burstPos = droneRoot.position.clone().add(
              new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 18)
            );
            createFlakBurst(burstPos);
          }, 280);

          // Metralhadoras com traçantes
          tracerInterval = setInterval(() => {
            if (isExploded) return;
            const spawn = new THREE.Vector3((Math.random() - 0.5) * 5, 0.5 + Math.random() * 2, (Math.random() - 0.5) * 5);
            const aimPos = droneRoot.position.clone().add(
              new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10)
            );
            createTracerBullet(spawn, aimPos, 0xff3b30, 0.18);
          }, 65);
        });

        const diveObj = { t: 0 };
        tl.to(diveObj, {
          t: 1,
          duration: 4.2,
          ease: 'power2.in',
          onUpdate: () => {
            const t = diveObj.t;
            const p0 = droneRoot.position.clone();
            const p1 = midPos;
            const p2 = targetPos;

            // Curva Bézier de arremetida e mergulho
            const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
            const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
            const z = (1 - t) * (1 - t) * p0.z + 2 * (1 - t) * t * p1.z + t * t * p2.z;

            droneRoot.position.set(x, y, z);

            const nextT = Math.min(1, t + 0.05);
            const nextX = (1 - nextT) * (1 - nextT) * p0.x + 2 * (1 - nextT) * nextT * p1.x + nextT * nextT * p2.x;
            const nextY = (1 - nextT) * (1 - nextT) * p0.y + 2 * (1 - nextT) * nextT * p1.y + nextT * nextT * p2.y;
            const nextZ = (1 - nextT) * (1 - nextT) * p0.z + 2 * (1 - nextT) * nextT * p1.z + nextT * nextT * p2.z;

            droneRoot.lookAt(nextX, nextY, nextZ);

            // Câmera 100% no bico do drone
            camera.position.copy(droneRoot.position);
            camera.lookAt(targetPos);

            // Tremor de alta velocidade e ondas de choque
            if (Math.random() > 0.3) {
              camera.position.x += (Math.random() - 0.5) * 0.08;
              camera.position.y += (Math.random() - 0.5) * 0.08;
            }
          },
          onComplete: () => {
            triggerExplosion(true);
            setTimeout(startCombatAnimation, 3500);
          }
        });

        animTimeline = tl;
      } else {
        // =========================================================
        // 🛡️ CENA 2: VISÃO DO DEFENSOR (CANHÃO ANTIAÉREO NO CONVÉS)
        // =========================================================
        gunGroup.visible = true;
        droneModelHolder.visible = true; // Modelo visível para quem está olhando do navio

        if (onPhaseChange) onPhaseChange('DEFENDING');

        camera.position.set(0.6, 1.8, 1.4);
        camera.lookAt(cruisePos);

        // Flaks disparados pelo navio explodindo no céu
        flakInterval = setInterval(() => {
          if (isExploded) return;
          const burstPos = droneRoot.position.clone().add(
            new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 16)
          );
          createFlakBurst(burstPos);
        }, 280);

        // Rajadas contínuas de balas traçantes azuis com recuo
        tracerInterval = setInterval(() => {
          if (isExploded) return;
          const barrelPos = camera.position.clone().add(
            new THREE.Vector3(0, -0.3, -1.0).applyQuaternion(camera.quaternion)
          );
          const aimPos = droneRoot.position.clone().add(
            new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4)
          );

          createTracerBullet(barrelPos, aimPos, 0x00f2ff, 0.12);

          const flash = new THREE.PointLight(0x00f2ff, 7, 10);
          flash.position.copy(barrelPos);
          scene.add(flash);
          setTimeout(() => scene.remove(flash), 35);
        }, 85);

        const animObj = { t: 0 };
        animTimeline = gsap.to(animObj, {
          t: 1,
          duration: 5.8,
          ease: 'power1.inOut',
          onUpdate: () => {
            const t = animObj.t;
            const p0 = cruisePos;
            const p1 = midPos;
            const p2 = targetPos;

            const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
            const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
            const z = (1 - t) * (1 - t) * p0.z + 2 * (1 - t) * t * p1.z + t * t * p2.z;

            droneRoot.position.set(x, y, z);
            droneRoot.lookAt(targetPos);
            droneModelHolder.rotation.z = Math.sin(t * Math.PI * 2) * 0.4;

            camera.lookAt(droneRoot.position);

            const gunOffset = new THREE.Vector3(0.28, -0.28, -0.7).applyQuaternion(camera.quaternion);
            gunGroup.position.copy(camera.position).add(gunOffset);
            gunGroup.lookAt(droneRoot.position);

            if (Math.random() > 0.3) {
              gunGroup.position.x += (Math.random() - 0.5) * 0.03;
              gunGroup.position.y += (Math.random() - 0.5) * 0.03;
            }
          },
          onComplete: () => {
            triggerExplosion(false);
            setTimeout(startCombatAnimation, 3200);
          }
        });
      }
    };

    // Criar Projétil Traçante
    const createTracerBullet = (from, to, colorHex, duration) => {
      const geo = new THREE.CylinderGeometry(0.06, 0.06, 4.5, 6);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
      const bullet = new THREE.Mesh(geo, mat);

      bullet.position.copy(from);
      bullet.lookAt(to);
      tracerGroup.add(bullet);

      gsap.to(bullet.position, {
        x: to.x,
        y: to.y,
        z: to.z,
        duration: duration,
        ease: 'none',
        onComplete: () => {
          tracerGroup.remove(bullet);
          geo.dispose();
          mat.dispose();
        }
      });
    };

    // Explosão e Impacto
    const triggerExplosion = (isAttackerFPV) => {
      isExploded = true;
      droneRoot.visible = false;
      explosionLight.intensity = 30;
      particleMat.opacity = 1;
      if (tracerInterval) clearInterval(tracerInterval);
      if (flakInterval) clearInterval(flakInterval);

      gsap.to(camera.position, {
        x: '+=0.9',
        y: '+=0.9',
        duration: 0.04,
        yoyo: true,
        repeat: 14
      });

      gsap.to(explosionLight, {
        intensity: 0,
        duration: 1.5,
        ease: 'power2.out'
      });

      if (onImpact) onImpact();
      if (isAttackerFPV && onSignalLost) onSignalLost();
    };

    startCombatAnimation();

    // Auto-Resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Loop
    let clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Ondas
      const pos = oceanMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        const z = Math.sin(u * 0.2 + elapsedTime * 1.5) * Math.cos(v * 0.2 + elapsedTime * 1.2) * 0.4;
        pos.setY(i, z);
      }
      oceanMesh.geometry.attributes.position.needsUpdate = true;

      // Nuvens
      cloudGroup.rotation.y = elapsedTime * 0.015;

      // Balanço Navio
      shipPivot.rotation.z = Math.sin(elapsedTime * 1.2) * 0.03;
      shipPivot.rotation.x = Math.cos(elapsedTime * 0.8) * 0.02;

      // Partículas
      if (isExploded) {
        const pPos = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          pPos[i * 3] += particleVelocities[i].x * 0.03;
          pPos[i * 3 + 1] += particleVelocities[i].y * 0.03;
          pPos[i * 3 + 2] += particleVelocities[i].z * 0.03;
          particleVelocities[i].y -= 0.18;
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (animTimeline) animTimeline.kill();
      if (tracerInterval) clearInterval(tracerInterval);
      if (flakInterval) clearInterval(flakInterval);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [viewMode]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    />
  );
}
