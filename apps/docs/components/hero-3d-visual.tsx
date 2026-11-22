"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";

export function Hero3DVisual({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 28;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Color definitions based on theme
    const isDark = resolvedTheme === "dark";
    const primaryColor = isDark ? 0x10b981 : 0x059669; // Emerald
    const secondaryColor = isDark ? 0x06b6d4 : 0x0284c7; // Cyan / Blue
    const wireframeColor = isDark ? 0x27272a : 0xd4d4d8; // Subtle border color

    // 1. Central Core Wireframe Sphere / Icosahedron (Microservice Topology)
    const coreGeometry = new THREE.IcosahedronGeometry(8.5, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: wireframeColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.35 : 0.45,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    // 2. Vertex Nodes (APM Monitored Endpoints)
    const nodeGeometry = new THREE.SphereGeometry(0.28, 12, 12);
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: primaryColor,
    });

    const nodeInstanced = new THREE.InstancedMesh(
      nodeGeometry,
      nodeMaterial,
      coreGeometry.attributes.position.count
    );
    const dummy = new THREE.Object3D();
    const pos = coreGeometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      dummy.position.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      dummy.updateMatrix();
      nodeInstanced.setMatrixAt(i, dummy.matrix);
    }
    nodeInstanced.instanceMatrix.needsUpdate = true;
    coreMesh.add(nodeInstanced);

    // 3. Floating Telemetry Particles (Data packets flowing in orbital space)
    const particleCount = 140;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 10 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      particleSpeeds[i * 3] = (Math.random() - 0.5) * 0.02;
      particleSpeeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      particleSpeeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: secondaryColor,
      size: 0.35,
      transparent: true,
      opacity: isDark ? 0.75 : 0.65,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 4. Smooth Mouse Parallax tracking
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

      targetRotationY = mouseX * 0.45;
      targetRotationX = mouseY * 0.35;
    };

    window.addEventListener("mousemove", onMouseMove);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", onResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous autonomous rotation
      coreMesh.rotation.y += 0.0035;
      coreMesh.rotation.x += 0.0015;

      particles.rotation.y -= 0.002;
      particles.rotation.z += 0.001;

      // Smooth inertia towards mouse target
      coreMesh.rotation.y += (targetRotationY - coreMesh.rotation.y * 0.5) * 0.03;
      coreMesh.rotation.x += (targetRotationX - coreMesh.rotation.x * 0.5) * 0.03;

      // Pulse particle positions gently
      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += Math.sin(elapsedTime + i) * 0.004;
        positions[i * 3 + 1] += Math.cos(elapsedTime + i) * 0.004;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
}
