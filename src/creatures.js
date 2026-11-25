// Nucleus End - mutants of the steppe (changed by the Asurati storm)
import * as THREE from 'three';
import { heightAt, SEA_Y } from './noise.js';

export function buildCreatures(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const creatures = [];
  const bodyM = new THREE.MeshStandardMaterial({ color: 0x3d3a44, roughness: 0.9 });
  const eyeM = new THREE.MeshStandardMaterial({ color: 0xffd76a, emissive: 0xffb52e, emissiveIntensity: 2.2 });
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 10), bodyM.clone());
    body.scale.set(1.25, 0.85, 1.7); body.position.y = 0.85; body.castShadow = true;
    g.add(body);
    for (const sx of [-0.32, 0.32]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeM);
      eye.position.set(sx, 1.05, -1.35);
      g.add(eye);
    }
    const spikes = new THREE.Group();
    for (let s = 0; s < 5; s++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.7, 5), new THREE.MeshStandardMaterial({ color: 0x7766aa, emissive: 0x4433aa, emissiveIntensity: 0 }));
      spike.position.set((Math.random() - 0.5) * 1.1, 1.55, (Math.random() - 0.5) * 1.6);
      spike.rotation.x = (Math.random() - 0.5) * 0.7;
      spikes.add(spike);
    }
    spikes.visible = false;
    g.add(spikes);
    const x = (Math.random() - 0.5) * 260, z = -40 - Math.random() * 130;
    g.position.set(x, heightAt(x, z), z);
    group.add(g);
    creatures.push({
      group: g, spikes, body, x, z,
      dir: Math.random() * Math.PI * 2,
      speed: 0.7 + Math.random() * 0.6,
      mutated: false,
      turnT: 2 + Math.random() * 4
    });
  }
  return {
    group, creatures,
    update(dt, playerPos) {
      for (const c of creatures) {
        c.turnT -= dt;
        if (c.turnT <= 0) { c.dir += (Math.random() - 0.5) * 1.6; c.turnT = 2 + Math.random() * 4; }
        // drift away from the player when close
        const dp = Math.hypot(playerPos.x - c.x, playerPos.z - c.z);
        let dir = c.dir;
        if (dp < 9) dir = Math.atan2(c.x - playerPos.x, c.z - playerPos.z);
        const sp = c.speed * (c.mutated ? 1.5 : 1);
        c.x += Math.sin(dir) * sp * dt;
        c.z += Math.cos(dir) * sp * dt;
        if (heightAt(c.x, c.z) < SEA_Y + 0.4) { c.dir += Math.PI; }
        c.group.position.set(c.x, heightAt(c.x, c.z), c.z);
        c.group.rotation.y = dir;
        c.group.position.y += Math.sin(performance.now() * 0.004 + c.x) * 0.05;
      }
    },
    mutateNear(x, z, r) {
      let n = 0;
      for (const c of creatures) {
        if (!c.mutated && Math.hypot(c.x - x, c.z - z) < r) {
          c.mutated = true; c.spikes.visible = true;
          c.spikes.children.forEach(s => { s.material.emissiveIntensity = 1.6; });
          c.body.material.color.set(0x54456b);
          n++;
        }
      }
      return n;
    }
  };
}
