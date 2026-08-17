import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ModelViewer3D({ modelType = 'drone' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Iluminação de Estúdio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f2ff, 2.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff4a4a, 1.5);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    // Base Holográfica Circular
    const ringGeo = new THREE.RingGeometry(2.5, 2.7, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -1.5;
    scene.add(ring);

    // Modelo Gerado Proceduralmente conforme modelType
    const modelGroup = new THREE.Group();

    if (modelType === 'drone') {
      // Drone Kamikaze Shahed-136
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 2.8);
      wingShape.lineTo(3.2, -2);
      wingShape.lineTo(2.5, -2.3);
      wingShape.lineTo(0, -1.5);
      wingShape.lineTo(-2.5, -2.3);
      wingShape.lineTo(-3.2, -2);
      wingShape.closePath();

      const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 });
      wingGeo.rotateX(Math.PI / 2);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x243447, metalness: 0.85, roughness: 0.25 });
      const wingMesh = new THREE.Mesh(wingGeo, wingMat);
      modelGroup.add(wingMesh);

      // Sensor Óptico
      const sensGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const sensMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const sens = new THREE.Mesh(sensGeo, sensMat);
      sens.position.set(0, 0, -2.6);
      modelGroup.add(sens);
    } else if (modelType === 'corvette') {
      // Corveta Lança-Mísseis
      const hullGeo = new THREE.BoxGeometry(1.6, 0.8, 5);
      const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      modelGroup.add(hull);

      const bridgeGeo = new THREE.BoxGeometry(1.2, 0.7, 1.8);
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set(0, 0.7, -0.5);
      modelGroup.add(bridge);

      const cannonGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5);
      cannonGeo.rotateX(Math.PI / 2);
      const cannonMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff });
      const cannon = new THREE.Mesh(cannonGeo, cannonMat);
      cannon.position.set(0, 0.8, -1.8);
      modelGroup.add(cannon);
    } else if (modelType === 'carrier') {
      // Porta-Aviões / Base de Drones
      const deckGeo = new THREE.BoxGeometry(2.4, 0.6, 6.5);
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.2 });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      modelGroup.add(deck);

      const towerGeo = new THREE.BoxGeometry(0.6, 1.2, 1.2);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(0.9, 0.9, 0);
      modelGroup.add(tower);
    } else {
      // Radar Quântico / Sonar
      const dishGeo = new THREE.SphereGeometry(1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
      dishGeo.rotateX(-Math.PI / 2);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, wireframe: true });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.y = 0.5;
      modelGroup.add(dish);

      const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 2);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = -0.5;
      modelGroup.add(pole);
    }

    scene.add(modelGroup);

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
      modelGroup.rotation.y += deltaX * 0.01;
      previousMouseX = e.clientX;
    };
    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Loop
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isDragging) {
        modelGroup.rotation.y += 0.008;
      }
      ring.rotation.z += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
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
        height: '320px',
        cursor: 'grab',
        position: 'relative'
      }}
    />
  );
}
