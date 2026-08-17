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
    scene.background = new THREE.Color(0x111e33); // Céu crepuscular mais claro e visível
    scene.fog = new THREE.FogExp2(0x132238, 0.007); // Neblina mais aberta para longo alcance visual

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Iluminação Aprimorada com Alto Contraste
    const ambientLight = new THREE.AmbientLight(0xc8dcfa, 1.4);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x00f2ff, 3.2);
    moonLight.position.set(40, 90, 50);
    scene.add(moonLight);

    // Luz de Pôr do Sol / Crepúsculo no Horizonte
    const horizonLight = new THREE.DirectionalLight(0xff8844, 2.2);
    horizonLight.position.set(-50, 20, -60);
    scene.add(horizonLight);

    const explosionLight = new THREE.PointLight(0xff4a00, 0, 120);
    explosionLight.position.set(0, 3, 0);
    scene.add(explosionLight);

    // 🌊 Oceano Otimizado (40x40 para 75% menos carga de CPU)
    const oceanGeo = new THREE.PlaneGeometry(220, 220, 40, 40);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x082244,
      roughness: 0.18,
      metalness: 0.85,
      wireframe: true,
      emissive: 0x001f44,
      emissiveIntensity: 0.6
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = -1.5;
    scene.add(oceanMesh);

    // ☁️ Nuvens Volumétricas em Camadas Táticas
    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.DodecahedronGeometry(7, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x243548,
      transparent: true,
      opacity: 0.5,
      roughness: 0.85,
      depthWrite: false
    });

    for (let i = 0; i < 32; i++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 110,
        28 + Math.random() * 30,
        (Math.random() - 0.5) * 110
      );
      const s = 2.0 + Math.random() * 3.5;
      cloud.scale.set(s * 1.3, s * 0.5, s);
      cloudGroup.add(cloud);
    }
    scene.add(cloudGroup);

    // 🚢 Navio Alvo (Corveta T-22)
    const shipPivot = new THREE.Group();
    scene.add(shipPivot);

    // Ponto de montagem da câmera no convés do navio (Ship Deck Camera Mount)
    const deckCameraMount = new THREE.Object3D();
    deckCameraMount.position.set(0.4, 1.45, 1.1); // Posição do artilheiro/comandante no convés
    shipPivot.add(deckCameraMount);

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

    // Luz Estroboscópica / Farol Tático no Drone para visibilidade clara de longe
    const droneStrobe = new THREE.PointLight(0x00f2ff, 2.5, 25);
    droneRoot.add(droneStrobe);

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

    // 🔫 Metralhadora Antiaérea montada no Convés do Navio
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
    
    // Anexar a arma diretamente ao navio
    shipPivot.add(gunGroup);
    gunGroup.position.set(0.4, 1.2, 0.4);
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
        duration: 2.0,
        ease: 'power1.out'
      });

      gsap.to(puffMat, {
        opacity: 0,
        duration: 2.0,
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

    // 🎬 LÓGICA DE ANIMAÇÃO CINEMÁTICA REALISTA COM LIMPEZA DE TIMERS
    let isExploded = false;
    let tracerInterval = null;
    let flakInterval = null;
    let restartTimeout = null;
    let animTimeline = null;
    const worldDeckPos = new THREE.Vector3();
    const worldGunPos = new THREE.Vector3();

    const clearAllTimers = () => {
      if (tracerInterval) clearInterval(tracerInterval);
      if (flakInterval) clearInterval(flakInterval);
      if (restartTimeout) clearTimeout(restartTimeout);
      if (animTimeline) animTimeline.kill();
      tracerInterval = null;
      flakInterval = null;
      restartTimeout = null;
      animTimeline = null;
    };

    // Curva Bézier Cúbica suave para voo aerodinâmico entre nuvens
    const calculateFlightPath = (t, p0, p1, p2, p3) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const p = new THREE.Vector3();
      p.addScaledVector(p0, uuu);
      p.addScaledVector(p1, 3 * uu * t);
      p.addScaledVector(p2, 3 * u * tt);
      p.addScaledVector(p3, ttt);
      return p;
    };

    const startCombatAnimation = () => {
      clearAllTimers();
      isExploded = false;
      explosionLight.intensity = 0;
      particleMat.opacity = 0;

      // Trajetória Realista Aerodinâmica (Contornando Nuvens em Arco Suave)
      const p0 = new THREE.Vector3(38, 70, 125); // Alto nas nuvens ao longe
      const p1 = new THREE.Vector3(18, 56, 85);   // Curva suave à esquerda contornando nuvem
      const p2 = new THREE.Vector3(-16, 38, 45);  // Curva à direita alinhando o ataque
      const p3 = new THREE.Vector3(0, 0.5, 0);    // Convés do navio no mar

      droneRoot.position.copy(p0);
      droneRoot.visible = true;

      // Resetar partículas
      const pPos = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount * 3; i++) pPos[i] = 0;
      particleGeo.attributes.position.needsUpdate = true;

      if (viewMode === 'attack') {
        // =========================================================
        // 🚀 CENA 1: VISÃO FPV DO BICO (VOO AERODINÂMICO SUAVE E REALISTA)
        // =========================================================
        gunGroup.visible = false;
        droneModelHolder.visible = false; // Ocultar corpo do drone

        // FASE 1: VARREDURA ÓPTICA (Cruzeiro)
        if (onPhaseChange) onPhaseChange('SEARCHING');

        const tl = gsap.timeline();

        // 1. Etapa de Busca e Planeio Leve (3.0s de voo suave e contemplativo)
        const scanObj = { t: 0 };
        tl.to(scanObj, {
          t: 1,
          duration: 3.0,
          ease: 'sine.inOut',
          onUpdate: () => {
            // Voo suave com leve oscilação aerodinâmica e roll leve
            const currentPos = p0.clone().add(
              new THREE.Vector3(
                Math.sin(scanObj.t * 2.2) * 4,
                Math.cos(scanObj.t * 1.8) * 1.5,
                -scanObj.t * 12
              )
            );
            droneRoot.position.copy(currentPos);
            droneRoot.lookAt(p3);

            camera.position.copy(droneRoot.position);
            camera.lookAt(p3);

            // Leve balanço natural de asas em voo
            camera.rotation.z = Math.sin(scanObj.t * 3.5) * 0.04;
          }
        });

        // 2. Transição para LOCK-ON
        tl.add(() => {
          if (onPhaseChange) onPhaseChange('LOCKED');
        });

        tl.to({}, { duration: 0.7 });

        // 3. Etapa de Curva Aerodinâmica & Mergulho Gradual (5.4s)
        tl.add(() => {
          if (onPhaseChange) onPhaseChange('DIVING');

          flakInterval = setInterval(() => {
            if (isExploded) return;
            const burstPos = droneRoot.position.clone().add(
              new THREE.Vector3((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 20)
            );
            createFlakBurst(burstPos);
          }, 320);

          // Balas traçantes subindo visivelmente em direção ao drone
          tracerInterval = setInterval(() => {
            if (isExploded) return;
            const spawn = new THREE.Vector3((Math.random() - 0.5) * 6, 0.5 + Math.random() * 2, (Math.random() - 0.5) * 6);
            const aimPos = droneRoot.position.clone().add(
              new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8)
            );
            createTracerBullet(spawn, aimPos, 0xff4433, 0.55); // Mais lenta e visível
          }, 110);
        });

        const diveObj = { t: 0 };
        tl.to(diveObj, {
          t: 1,
          duration: 5.4,
          ease: 'power1.inOut',
          onUpdate: () => {
            const t = diveObj.t;

            // Posição com Bézier suave de 4 pontos
            const pos = calculateFlightPath(t, p0, p1, p2, p3);
            droneRoot.position.copy(pos);

            // Vetor tangente para orientação suave
            const nextT = Math.min(1, t + 0.04);
            const nextPos = calculateFlightPath(nextT, p0, p1, p2, p3);
            droneRoot.lookAt(nextPos);

            camera.position.copy(droneRoot.position);
            camera.lookAt(p3);

            // Inclinação (Roll/Banking) realista nas curvas das nuvens
            const bankAngle = Math.sin(t * Math.PI * 2) * 0.15;
            camera.rotation.z = bankAngle;

            // Vibração aerodinâmica sutil
            if (Math.random() > 0.4) {
              camera.position.x += (Math.random() - 0.5) * 0.04;
              camera.position.y += (Math.random() - 0.5) * 0.04;
            }
          },
          onComplete: () => {
            triggerExplosion(true);
            restartTimeout = setTimeout(startCombatAnimation, 3500);
          }
        });

        animTimeline = tl;
      } else {
        // =========================================================
        // 🛡️ CENA 2: VISÃO DO DEFENSOR (BALAS LENTAS & VOO VISÍVEL)
        // =========================================================
        gunGroup.visible = true;
        droneModelHolder.visible = true;

        if (onPhaseChange) onPhaseChange('DEFENDING');

        deckCameraMount.getWorldPosition(worldDeckPos);
        camera.position.copy(worldDeckPos);
        camera.lookAt(p0);

        flakInterval = setInterval(() => {
          if (isExploded) return;
          const burstPos = droneRoot.position.clone().add(
            new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 18)
          );
          createFlakBurst(burstPos);
        }, 300);

        // Disparos com balas traçantes que viajam mais lentamente no céu
        tracerInterval = setInterval(() => {
          if (isExploded) return;
          gunGroup.getWorldPosition(worldGunPos);
          const barrelPos = worldGunPos.clone().add(
            new THREE.Vector3(0, 0, -0.9).applyQuaternion(shipPivot.quaternion)
          );
          const aimPos = droneRoot.position.clone().add(
            new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4)
          );

          // 🐌 Balas traçantes com velocidade visualmente apreciável (0.52s de tempo de voo)
          createTracerBullet(barrelPos, aimPos, 0x00f2ff, 0.52);

          const flash = new THREE.PointLight(0x00f2ff, 7, 12);
          flash.position.copy(barrelPos);
          scene.add(flash);
          setTimeout(() => scene.remove(flash), 40);
        }, 120);

        const animObj = { t: 0 };
        animTimeline = gsap.to(animObj, {
          t: 1,
          duration: 7.2, // Voo mais longo e apreciável no céu
          ease: 'power1.inOut',
          onUpdate: () => {
            const t = animObj.t;
            const pos = calculateFlightPath(t, p0, p1, p2, p3);

            droneRoot.position.copy(pos);

            const nextT = Math.min(1, t + 0.04);
            const nextPos = calculateFlightPath(nextT, p0, p1, p2, p3);
            droneRoot.lookAt(nextPos);

            // Inclinação suave do corpo do drone enquanto contorna as nuvens
            droneModelHolder.rotation.z = Math.sin(t * Math.PI * 2) * 0.35;

            // Câmera do defensor fixada no convés do navio
            deckCameraMount.getWorldPosition(worldDeckPos);
            camera.position.copy(worldDeckPos);

            // Câmera e torreta no convés acompanham o drone descendo suavemente
            camera.lookAt(droneRoot.position);
            gunGroup.lookAt(droneRoot.position);

            if (Math.random() > 0.4) {
              camera.position.x += (Math.random() - 0.5) * 0.025;
              camera.position.y += (Math.random() - 0.5) * 0.025;
            }
          },
          onComplete: () => {
            triggerExplosion(false);
            restartTimeout = setTimeout(startCombatAnimation, 3200);
          }
        });
      }
    };

    // Criar Projétil Traçante Luminoso com Rastro Visível
    const createTracerBullet = (from, to, colorHex, duration) => {
      const geo = new THREE.CylinderGeometry(0.08, 0.08, 5.5, 6);
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
      
      // Limpar intervalos de ataque ao explodir
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

    // Controle de Visibilidade com IntersectionObserver (Pausa quando fora de tela)
    let isVisible = false;
    let hasStarted = false;

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !hasStarted) {
          hasStarted = true;
          startCombatAnimation();
        }
      },
      { threshold: 0.1 }
    );
    visibilityObserver.observe(container);

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
      if (!isVisible) return; // Pula cálculos e render quando fora da tela
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
      clearAllTimers();
      visibilityObserver.disconnect();
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
