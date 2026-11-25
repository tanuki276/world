// Nucleus End - global scenery only: frozen sea + the sky island (regions stream separately)
import * as THREE from 'three';
import { SEA_Y, fbm } from './noise.js';

export function buildWorld(scene) {
  const group = new THREE.Group();
  // frozen sea
  const sea = new THREE.Mesh(
    new THREE.CircleGeometry(1500, 48),
    new THREE.MeshStandardMaterial({ color: 0xa9c3d9, roughness: 0.55, metalness: 0.05 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = SEA_Y;
  sea.receiveShadow = true;
  group.add(sea);
  // ウサル・テュペレト島: sky island with the Sky Temple silhouette (distant landmark)
  const sky = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x767e8a, roughness: 1, flatShading: true });
  // jagged underside: displaced inverted cone, irregular rim, hanging rock spikes
  const rockGeo = new THREE.ConeGeometry(60, 48, 42, 5);
  {
    const p = rockGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const n = fbm(Math.cos(a) * 2.1 + 9, Math.sin(a) * 2.1 + y * 0.08);
      const r = Math.hypot(x, z);
      if (r > 1) {
        const k = 1 + (n - 0.5) * 0.42;
        p.setX(i, x * k); p.setZ(i, z * k);
      }
      p.setY(i, y + (fbm(x * 0.09 + 4, z * 0.09) - 0.5) * 4);
    }
    rockGeo.computeVertexNormals();
  }
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.rotation.x = Math.PI;
  rock.position.y = -16;
  sky.add(rock);
  for (let i = 0; i < 11; i++) {
    const a = Math.random() * Math.PI * 2, rr = 12 + Math.random() * 34;
    const len = 9 + Math.random() * 20;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(2.5 + Math.random() * 3.5, len, 6), rockMat);
    spike.rotation.x = Math.PI;
    spike.position.set(Math.cos(a) * rr, -18 - len / 2 + Math.random() * 4, Math.sin(a) * rr);
    sky.add(spike);
  }
  const topGeo = new THREE.CylinderGeometry(58, 50, 7, 42);
  {
    const p = topGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const k = 1 + (fbm(Math.cos(a) * 2.4 + 3, Math.sin(a) * 2.4) - 0.5) * 0.3;
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    topGeo.computeVertexNormals();
  }
  const top = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ color: 0xc7d2de, roughness: 1, flatShading: true }));
  top.position.y = 6;
  sky.add(top);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 13, 6), pillarMat);
    p.position.set(Math.cos(a) * 22, 16, Math.sin(a) * 22);
    sky.add(p);
  }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.85 }));
  dome.position.y = 22.5;
  sky.add(dome);
  // cloud sea around the island: soft sprites sell the altitude and hide the float
  {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g2 = cv.getContext('2d');
    const grad = g2.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.55, 'rgba(245,248,252,0.42)');
    grad.addColorStop(1, 'rgba(245,248,252,0)');
    g2.fillStyle = grad; g2.fillRect(0, 0, 128, 128);
    const cloudTex = new THREE.CanvasTexture(cv);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
      const rr = 52 + Math.random() * 46;
      const sm = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.5 + Math.random() * 0.35 });
      const spr = new THREE.Sprite(sm);
      spr.position.set(Math.cos(a) * rr, -6 + Math.random() * 14, Math.sin(a) * rr);
      const s = 55 + Math.random() * 75;
      spr.scale.set(s, s * 0.42, 1);
      sky.add(spr);
    }
    for (let i = 0; i < 5; i++) { // faint wisps below, trailing off the underside
      const sm = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.28 });
      const spr = new THREE.Sprite(sm);
      spr.position.set((Math.random() - 0.5) * 90, -26 - Math.random() * 16, (Math.random() - 0.5) * 90);
      const s = 60 + Math.random() * 60;
      spr.scale.set(s, s * 0.36, 1);
      sky.add(spr);
    }
  }
  sky.position.set(-170, 128, -300);
  group.add(sky);
  scene.add(group);
  return { group, skyIsland: sky };
}
