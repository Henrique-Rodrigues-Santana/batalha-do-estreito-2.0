import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function ModelViewer3D({ modelType = 'drone' }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setLoading(true);

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    
    // Câmera perfeitamente alinhada
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Iluminação de Estúdio Militar
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f2ff, 3.5);
    keyLight.position.set(6, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffd700, 1.8);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff4a4a, 2.2);
    rimLight.position.set(0, -4, -6);
    scene.add(rimLight);

    // Base Holográfica Circular (Centralizada no chão do modelo)
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    const ringGeo = new THREE.RingGeometry(2.2, 2.35, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    baseGroup.add(ring);

    const innerGrid = new THREE.GridHelper(4.2, 10, 0x00f2ff, 0x0d2847);
    baseGroup.add(innerGrid);

    baseGroup.position.y = -1.2;

    // Grupo do Modelo
    const modelPivot = new THREE.Group();
    scene.add(modelPivot);

    const loader = new GLTFLoader();

    // Helper para auto-centralizar e enquadrar perfeitamente qualquer modelo
    const fitModelToFrame = (model, targetSize = 3.6) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = targetSize / (maxDim || 1);

      model.scale.set(scale, scale, scale);

      // Re-calcular centro após aplicar escala
      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = scaledBox.getCenter(new THREE.Vector3());

      // Centraliza perfeitamente no ponto (0, 0, 0)
      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;

      // Ajustar base holográfica logo abaixo do modelo
      baseGroup.position.y = scaledBox.min.y - 0.2;
    };

    if (modelType === 'drone') {
      // 🛸 CARREGAR MODELO GLB REAL: SHAHED-136
      loader.load(
        '/assets/models/shahed-136.glb',
        (gltf) => {
          const model = gltf.scene;

          model.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.metalness = 0.6;
              child.material.roughness = 0.3;
            }
          });

          fitModelToFrame(model, 3.8);
          modelPivot.add(model);
          setLoading(false);
        },
        undefined,
        (err) => {
          console.warn('Erro ao carregar drone GLB no showroom:', err);
          setLoading(false);
        }
      );
    } else if (modelType === 'corvette') {
      // 🚢 CARREGAR MODELO GLB REAL: CORVETA T-22
      loader.load(
        '/assets/models/t-22.glb',
        (gltf) => {
          const model = gltf.scene;
          fitModelToFrame(model, 3.6);
          modelPivot.add(model);
          setLoading(false);
        },
        undefined,
        () => {
          // Fallback procedural se não carregar
          const hullGeo = new THREE.BoxGeometry(1.6, 0.8, 4.0);
          const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
          const hull = new THREE.Mesh(hullGeo, hullMat);
          fitModelToFrame(hull, 3.5);
          modelPivot.add(hull);
          setLoading(false);
        }
      );
    } else if (modelType === 'carrier') {
      // Porta-Aviões / Base de Drones
      const carrierGroup = new THREE.Group();
      const deckGeo = new THREE.BoxGeometry(2.4, 0.6, 5.5);
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.2 });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      carrierGroup.add(deck);

      const towerGeo = new THREE.BoxGeometry(0.6, 1.2, 1.2);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(0.9, 0.9, 0);
      carrierGroup.add(tower);

      fitModelToFrame(carrierGroup, 3.8);
      modelPivot.add(carrierGroup);
      setLoading(false);
    } else {
      // Radar Quântico / Sonar
      const radarGroup = new THREE.Group();
      const dishGeo = new THREE.SphereGeometry(1.3, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
      dishGeo.rotateX(-Math.PI / 2);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, wireframe: true });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.y = 0.5;
      radarGroup.add(dish);

      const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = -0.4;
      radarGroup.add(pole);

      fitModelToFrame(radarGroup, 3.2);
      modelPivot.add(radarGroup);
      setLoading(false);
    }

    // Controles de Arraste / Rotação Manual
    let isDragging = false;
    let previousMouseX = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      modelPivot.rotation.y += deltaX * 0.01;
      previousMouseX = e.clientX;
    };
    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch controls para mobile
    let previousTouchX = 0;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousTouchX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousTouchX;
      modelPivot.rotation.y += deltaX * 0.015;
      previousTouchX = e.touches[0].clientX;
    };
    const onTouchEnd = () => { isDragging = false; };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Auto-Resize Observer para responsividade perfeita do canvas
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

    // Controle de Visibilidade com IntersectionObserver
    let isVisible = false;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    visibilityObserver.observe(container);

    // Loop
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isVisible) return; // Pausa rotação e renderização fora de tela
      if (!isDragging) {
        modelPivot.rotation.y += 0.008;
      }
      ring.rotation.z += 0.005;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelType]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '340px',
        cursor: 'grab',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
          color: 'var(--cyan)',
          fontFamily: 'var(--font-display)'
        }}>
          CARREGANDO MODELO GLB...
        </div>
      )}
    </div>
  );
}
