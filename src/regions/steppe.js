// Region: ユヴァシレフ草原 (dry steppe — real grass texture, tufts, dead trees, rocks)
import * as THREE from 'three';
import { terrainPatch, loadModel, scatterModel, disposeGroup, fbm } from '../util.js';
import { buildCreatures } from '../creatures.js';
import { heightAt, SEA_Y, STEPPE } from '../noise.js';

const cDry = new THREE.Color(0xb3a37f), cLush = new THREE.Color(0x7d8f4e),
      cSnowP = new THREE.Color(0xe9eff7), cEdge = new THREE.Color(0xdde7f2),
      cBare = new THREE.Color(0x96754e);

export async function build(scene, ctx) {
  const group = new THREE.Group();
  const tl = new THREE.TextureLoader();
  const base = new URL('../../assets/', import.meta.url).href;
  const diff = tl.load(base + 'textures/aerial_grass_rock_diff.jpg');
  diff.wrapS = diff.wrapT = THREE.RepeatWrapping; diff.colorSpace = THREE.SRGBColorSpace;
  const nor = tl.load(base + 'textures/aerial_grass_rock_nor.jpg');
  nor.wrapS = nor.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshStandardMaterial({ map: diff, normalMap: nor, vertexColors: true, roughness: 1 });
  group.add(terrainPatch({
    x0: -450, x1: 450, z0: -200, z1: 100, material: mat,
    colorFn: (x, z, h, out) => {
      const n = fbm(x * 0.03 + 8.8, z * 0.03 + 1.2);
      out.copy(cDry).lerp(cLush, Math.max(0, Math.min(1, (n - 0.32) * 1.9)));
      const bare = fbm(x * 0.045 - 14.5, z * 0.045 + 7.3);
      if (bare > 0.6) out.lerp(cBare, Math.min(0.8, (bare - 0.6) * 2.6)); // bare soil patches
      if (n > 0.68) out.lerp(cSnowP, Math.min(0.65, (n - 0.68) * 2.2)); // patchy snow remnants
      const edge = Math.max(0, Math.min(1, (Math.abs(z + 50) - 125) / 55));
      out.lerp(cEdge, edge * 0.5); // soften the seam toward the snowy neighbours
      return out;
    }
  }));
  // real grass tufts (Poly Haven CC0, simplified) — clustered so the steppe reads as meadows, not confetti
  const grass = await loadModel(base + 'models/grass_medium_01/grass_medium_01_mid.glb');
  const gp = [];
  const centers = [];
  for (let i = 0; i < 110; i++) centers.push([(Math.random() - 0.5) * 640, -50 + (Math.random() - 0.5) * 290]);
  let guard = 0;
  while (gp.length < 4200 && guard++ < 30000) {
    let x, z;
    if (Math.random() < 0.65) {
      const c = centers[(Math.random() * centers.length) | 0];
      const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.6) * 13;
      x = c[0] + Math.cos(a) * r; z = c[1] + Math.sin(a) * r;
    } else { x = (Math.random() - 0.5) * 660; z = -50 + (Math.random() - 0.5) * 300; }
    if (Math.hypot(x - STEPPE.x, z - STEPPE.z) > STEPPE.r + 45) continue;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.5) continue;
    gp.push({ x, y: h - 0.05, z, ry: Math.random() * Math.PI, s: 0.85 + Math.random() * 0.95 });
  }
  group.add(scatterModel(grass.scene, gp, { shadow: false, vary: 0.38 }));
  // dead trees (Poly Haven CC0)
  const dead = await loadModel(base + 'models/dead_tree_trunk/dead_tree_trunk_1k.gltf');
  const dp = [];
  for (let i = 0; i < 14; i++) {
    const x = (Math.random() - 0.5) * 430, z = -50 + (Math.random() - 0.5) * 260;
    dp.push({ x, y: heightAt(x, z) - 0.1, z, ry: Math.random() * Math.PI * 2, s: 0.9 + Math.random() * 0.9 });
  }
  group.add(scatterModel(dead.scene, dp, { vary: 0.1 }));
  // real rocks (Poly Haven CC0)
  const rock = await loadModel(base + 'models/rock_face_01/rock_face_01_1k.gltf');
  const rp = [];
  for (let i = 0; i < 9; i++) {
    const x = (Math.random() - 0.5) * 540, z = -50 + (Math.random() - 0.5) * 280;
    rp.push({ x, y: heightAt(x, z) - 0.5, z, ry: Math.random() * Math.PI * 2, s: 1.5 + Math.random() * 2.4 });
  }
  group.add(scatterModel(rock.scene, rp, { vary: 0.08 }));
  // second dead-tree variant
  const dead2 = await loadModel(base + 'models/dead_tree_trunk_02/dead_tree_trunk_02_1k.gltf');
  const d2 = [];
  for (let i = 0; i < 28; i++) {
    const x = (Math.random() - 0.5) * 460, z = -50 + (Math.random() - 0.5) * 270;
    d2.push({ x, y: heightAt(x, z) - 0.1, z, ry: Math.random() * Math.PI * 2, s: 0.9 + Math.random() * 0.9 });
  }
  group.add(scatterModel(dead2.scene, d2, { vary: 0.1 }));
  // dry shrubs across the basin
  const shrub = await loadModel(base + 'models/shrub_01/shrub_01_mid.glb');
  const shp = [];
  guard = 0;
  while (shp.length < 320 && guard++ < 16000) {
    const x = (Math.random() - 0.5) * 680, z = -50 + (Math.random() - 0.5) * 310;
    if (Math.hypot(x - STEPPE.x, z - STEPPE.z) > STEPPE.r + 50) continue;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.5) continue;
    shp.push({ x, y: h - 0.08, z, ry: Math.random() * Math.PI * 2, s: 0.8 + Math.random() * 0.8 });
  }
  group.add(scatterModel(shrub.scene, shp, { shadow: false, vary: 0.25 }));
  // dry branches and small stones
  const branch = await loadModel(base + 'models/dry_branches_medium_01/dry_branches_medium_01_1k.gltf');
  const brp = [];
  for (let i = 0; i < 90; i++) {
    const x = (Math.random() - 0.5) * 560, z = -50 + (Math.random() - 0.5) * 280;
    brp.push({ x, y: heightAt(x, z) - 0.05, z, ry: Math.random() * Math.PI * 2, s: 1 + Math.random() * 0.8 });
  }
  group.add(scatterModel(branch.scene, brp, { shadow: false, vary: 0.15 }));
  const stones = await loadModel(base + 'models/sand_rocks_small_01/sand_rocks_small_01_mid.glb');
  const kp = [];
  for (let i = 0; i < 120; i++) {
    const x = (Math.random() - 0.5) * 600, z = -50 + (Math.random() - 0.5) * 290;
    kp.push({ x, y: heightAt(x, z) - 0.08, z, ry: Math.random() * Math.PI * 2, s: 0.7 + Math.random() * 0.9 });
  }
  group.add(scatterModel(stones.scene, kp, { shadow: false, vary: 0.15 }));
  const creatures = buildCreatures(group);
  ctx.creatures = creatures;
  scene.add(group);
  return {
    group,
    update(dt, c) { creatures.update(dt, c.playerPos); },
    dispose() { ctx.creatures = null; disposeGroup(group); }
  };
}
