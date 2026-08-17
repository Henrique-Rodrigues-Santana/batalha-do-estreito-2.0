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

    // Cena & Câmera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050b14, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f2ff, 3.5);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00f2ff, 4, 60);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    const redLight = new THREE.PointLight(0xff4a4a, 2.5, 40);
    redLight.position.set(-15, 4, -5);
    scene.add(redLight);

    // 🌊 Mar Tático (Grade de Ondas)
    const gridGeometry = new THREE.PlaneGeometry(90, 90, 60, 60);
    gridGeometry.rotateX(-Math.PI / 2);

    const gridMaterial = new THREE.MeshStandardMaterial({
      color: 0x051d38,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
      emissive: 0x002d5a,
      emissiveIntensity: 0.4
    });

    const oceanMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    oceanMesh.position.y = -2;
    scene.add(oceanMesh);

    // 🛸 Carregar Modelo 3D GLB Real: Shahed-136
    const dronePivot = new THREE.Group();
    scene.add(dronePivot);

    let loadedModel = null;
    const loader = new GLTFLoader();

    loader.load(
      '/assets/models/shahed-136.glb',
      (gltf) => {
        loadedModel = gltf.scene;

        // Auto-centralizar e ajustar escala do modelo GLB
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5.0 / (maxDim || 1); // Escala para ~5 unidades no mundo

        loadedModel.scale.set(scale, scale, scale);

        // Centralizar ponto de ancoragem
        const center = box.getCenter(new THREE.Vector3());
        loadedModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        // Habilitar sombras e materiais
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
      (err) => {
        console.warn('Erro ao carregar modelo GLB no Hero:', err);
      }
    );

    dronePivot.position.set(0, 3.5, 2);
    dronePivot.rotation.x = 0.2;

    // ✨ Partículas de Poeira / Flare
    const particlesCount = 150;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 50;
      posArray[i + 1] = Math.random() * 20;
      posArray[i + 2] = (Math.random() - 0.5) * 50;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x00f2ff,
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

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

    // Loop de Animação
    let clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Ondulação do Mar
      const pos = oceanMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        const z = Math.sin(u * 0.2 + elapsedTime * 1.5) * Math.cos(v * 0.2 + elapsedTime * 1.2) * 0.6;
        pos.setY(i, z);
      }
      oceanMesh.geometry.attributes.position.needsUpdate = true;

      // Voo do Drone GLB Real
      dronePivot.position.y = 3.5 + Math.sin(elapsedTime * 2) * 0.5;
      dronePivot.position.x = Math.sin(elapsedTime * 0.8) * 3 + mouseX * 2;
      dronePivot.rotation.z = -Math.sin(elapsedTime * 0.8) * 0.2 - mouseX * 0.3;
      dronePivot.rotation.y = Math.sin(elapsedTime * 0.5) * 0.3 + mouseX * 0.4;
      dronePivot.rotation.x = 0.2 + mouseY * 0.2;

      // Partículas flutuantes
      particles.rotation.y = elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
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
