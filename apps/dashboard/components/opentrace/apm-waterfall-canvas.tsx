"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import type * as ThreeNS from "three";

/**
 * Ambient three.js scene for the OpenTrace login hero card.
 *
 * It renders a stylised 3D distributed-trace waterfall:
 *  - six nested spans floating on a time grid, receding into depth
 *  - a glowing "execution head" travelling along each span
 *  - faint parent/child connectors and drifting ingest dust
 *
 * `three` is imported dynamically so it never blocks the first paint, and the
 * whole scene is disposed when the card unmounts.
 */

type Span = {
  start: number;
  length: number;
  y: number;
  z: number;
  color: number;
  speed: number;
  offset: number;
};

const SPANS: Span[] = [
  { start: -3.7, length: 7.4, y: 0.42, z: -0.05, color: 0x10b981, speed: 0.18, offset: 0 },
  { start: -3.5, length: 2.1, y: 0.24, z: -0.22, color: 0x0ea5e9, speed: 0.3, offset: 0.12 },
  { start: -1.15, length: 2.9, y: 0.06, z: -0.39, color: 0x8b5cf6, speed: 0.24, offset: 0.34 },
  { start: -0.95, length: 1.2, y: -0.12, z: -0.56, color: 0xf59e0b, speed: 0.36, offset: 0.58 },
  { start: 1.85, length: 2.2, y: -0.3, z: -0.73, color: 0x14b8a6, speed: 0.27, offset: 0.21 },
  { start: 2.1, length: 1.0, y: -0.48, z: -0.9, color: 0x38bdf8, speed: 0.34, offset: 0.46 },
];

const DUST_COUNT = 46;

function makeGlowTexture(THREE: typeof import("three")) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.28)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function ApmWaterfallCanvas({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let teardown: (() => void) | undefined;

    void (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        return;
      }
      if (cancelled || !host.isConnected) return;

      let renderer: ThreeNS.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
      } catch {
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = "pointer-events-none absolute inset-0 h-full w-full";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
      camera.position.set(0.6, 2, 5.4);
      camera.lookAt(0, -0.1, -0.45);

      const sprite = makeGlowTexture(THREE);
      const disposables: Array<{ dispose: () => void }> = [];
      const materials: ThreeNS.Material[] = [];

      const disposeLater = <T extends { dispose: () => void }>(item: T) => {
        disposables.push(item);
        return item;
      };

      // ---------- Time grid (back plane) ----------
      const gridVertices: number[] = [];
      for (let x = -4.5; x <= 4.5 + 0.001; x += 1.5) {
        gridVertices.push(x, -0.75, -1.15, x, 0.75, -1.15);
      }
      gridVertices.push(-4.5, -0.75, -1.15, 4.5, -0.75, -1.15);
      const gridGeometry = disposeLater(new THREE.BufferGeometry());
      gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridVertices, 3));
      const gridMaterial = disposeLater(
        new THREE.LineBasicMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.09,
          depthWrite: false,
        })
      );
      materials.push(gridMaterial);
      scene.add(new THREE.LineSegments(gridGeometry, gridMaterial));

      // ---------- Parent/child connectors ----------
      const connectorVertices: number[] = [];
      for (const span of SPANS.slice(1)) {
        connectorVertices.push(span.start, SPANS[0].y, span.z, span.start, span.y, span.z);
      }
      const connectorGeometry = disposeLater(new THREE.BufferGeometry());
      connectorGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(connectorVertices, 3)
      );
      const connectorMaterial = disposeLater(
        new THREE.LineBasicMaterial({
          color: 0x2dd4bf,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
        })
      );
      materials.push(connectorMaterial);
      scene.add(new THREE.LineSegments(connectorGeometry, connectorMaterial));

      // ---------- Spans ----------
      const heads: Array<{
        geometry: ThreeNS.BufferGeometry;
        material: ThreeNS.PointsMaterial;
        positions: Float32Array;
        span: Span;
      }> = [];

      const startCaps: number[] = [];
      const startColors: number[] = [];

      for (const span of SPANS) {
        const color = new THREE.Color(span.color);
        const fade = color.clone().multiplyScalar(0.18);

        const geometry = disposeLater(new THREE.BufferGeometry());
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            [span.start, span.y, span.z, span.start + span.length, span.y, span.z],
            3
          )
        );
        geometry.setAttribute(
          "color",
          new THREE.Float32BufferAttribute([color.r, color.g, color.b, fade.r, fade.g, fade.b], 3)
        );
        const material = disposeLater(
          new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
          })
        );
        materials.push(material);
        scene.add(new THREE.Line(geometry, material));

        // travelling execution head
        const headPositions = new Float32Array([span.start, span.y, span.z]);
        const headGeometry = disposeLater(new THREE.BufferGeometry());
        headGeometry.setAttribute("position", new THREE.BufferAttribute(headPositions, 3));
        const headMaterial = disposeLater(
          new THREE.PointsMaterial({
            color: color.clone().lerp(new THREE.Color(0xffffff), 0.35),
            size: 0.17,
            map: sprite ?? undefined,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            sizeAttenuation: true,
          })
        );
        materials.push(headMaterial);
        scene.add(new THREE.Points(headGeometry, headMaterial));
        heads.push({
          geometry: headGeometry,
          material: headMaterial,
          positions: headPositions,
          span,
        });

        // static span start marker (batched)
        startCaps.push(span.start, span.y, span.z);
        startColors.push(color.r, color.g, color.b);
      }

      const capGeometry = disposeLater(new THREE.BufferGeometry());
      capGeometry.setAttribute("position", new THREE.Float32BufferAttribute(startCaps, 3));
      capGeometry.setAttribute("color", new THREE.Float32BufferAttribute(startColors, 3));
      const capMaterial = disposeLater(
        new THREE.PointsMaterial({
          vertexColors: true,
          size: 0.09,
          map: sprite ?? undefined,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          sizeAttenuation: true,
        })
      );
      materials.push(capMaterial);
      scene.add(new THREE.Points(capGeometry, capMaterial));

      // ---------- Ingest dust ----------
      const dustPositions = new Float32Array(DUST_COUNT * 3);
      const dustSpeeds = new Float32Array(DUST_COUNT);
      for (let i = 0; i < DUST_COUNT; i++) {
        dustPositions[i * 3] = -4.5 + Math.random() * 9;
        dustPositions[i * 3 + 1] = -0.7 + Math.random() * 1.4;
        dustPositions[i * 3 + 2] = -1.2 + Math.random() * 1.4;
        dustSpeeds[i] = 0.08 + Math.random() * 0.12;
      }
      const dustGeometry = disposeLater(new THREE.BufferGeometry());
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      const dustMaterial = disposeLater(
        new THREE.PointsMaterial({
          color: 0x5eead4,
          size: 0.055,
          map: sprite ?? undefined,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
          sizeAttenuation: true,
        })
      );
      materials.push(dustMaterial);
      scene.add(new THREE.Points(dustGeometry, dustMaterial));

      // ---------- Animation ----------
      const clock = new THREE.Clock();
      let inView = true;
      let running = false;

      const update = (time: number) => {
        for (const head of heads) {
          const { span, positions, geometry, material } = head;
          const progress = (span.offset + time * span.speed) % 1;
          positions[0] = span.start + progress * span.length;
          geometry.attributes.position.needsUpdate = true;
          material.opacity = 0.12 + Math.sin(progress * Math.PI) * 0.8;
        }

        for (let i = 0; i < DUST_COUNT; i++) {
          dustPositions[i * 3] += dustSpeeds[i] * 0.016;
          if (dustPositions[i * 3] > 4.6) dustPositions[i * 3] = -4.6;
        }
        dustGeometry.attributes.position.needsUpdate = true;

        camera.position.x = 0.6 + Math.sin(time * 0.1) * 0.16;
        camera.position.y = 2 + Math.sin(time * 0.13) * 0.05;
        camera.lookAt(0, -0.1, -0.45);
      };

      const renderFrame = () => {
        update(clock.getElapsedTime());
        renderer.render(scene, camera);
      };

      const start = () => {
        if (running) return;
        running = true;
        renderer.setAnimationLoop(renderFrame);
      };

      const stop = () => {
        if (!running) return;
        running = false;
        renderer.setAnimationLoop(null);
      };

      const resize = () => {
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        if (!running) {
          update(1.2);
          renderer.render(scene, camera);
        }
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (inView && !document.hidden && !reduceMotion) start();
          else stop();
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(host);

      const onVisibilityChange = () => {
        if (document.hidden) stop();
        else if (inView && !reduceMotion) start();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);

      if (reduceMotion) {
        update(1.2);
        renderer.render(scene, camera);
      } else {
        start();
      }

      teardown = () => {
        renderer.setAnimationLoop(null);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        for (const item of disposables) item.dispose();
        for (const material of materials) material.dispose();
        sprite?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        scene.clear();
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={className} />;
}
