// Region: 南の海岸 + シヴェシュッタ村 (snowy south)
import * as THREE from 'three';
import { terrainPatch, snowColor, snowMaterial, scatterModel, loadModel, disposeGroup } from '../util.js';
import { buildVillage } from '../village.js';
import { heightAt, SEA_Y, VILLAGE } from '../noise.js';

export async function build(scene, ctx) {
  const group = new THREE.Group();
  const mat = snowMaterial();
  group.add(terrainPatch({ x0: -450, x1: 450, z0: 100, z1: 460, material: mat, colorFn: snowColor }));
  const village = buildVillage(group);
  ctx.village = village;
  // real pines (Poly Haven CC0, photogrammetry — heavy, loaded only with this region)
  const pine = await loadModel(new URL('../../assets/models/pine_tree_01/pine_tree_01_mid.glb', import.meta.url).href);
  const pp = [];
  let guard = 0;
  while (pp.length < 60 && guard++ < 4000) {
    const x = -430 + Math.random() * 860, z = 105 + Math.random() * 345;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.6 || h > 30) continue;
    if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < 56) continue;
    if (Math.abs(heightAt(x + 2.5, z) - h) > 2.2) continue;
    pp.push({ x, y: h - 0.15, z, ry: Math.random() * Math.PI * 2, s: 0.85 + Math.random() * 0.5 });
  }
  group.add(scatterModel(pine.scene, pp, { vary: 0.12 }));
  const rock = await loadModel(new URL('../../assets/models/rock_07/rock_07_1k.gltf', import.meta.url).href);
  const rp = [];
  for (let i = 0; i < 12; i++) {
    const x = (Math.random() - 0.5) * 700, z = 300 + Math.random() * 130;
    rp.push({ x, y: heightAt(x, z) - 0.3, z, ry: Math.random() * Math.PI * 2, s: 0.8 + Math.random() * 1.6 });
  }
  group.add(scatterModel(rock.scene, rp, { vary: 0.08 }));
  // young pines fill the gaps between the big photogrammetry pines
  const sapling = await loadModel(new URL('../../assets/models/pine_sapling_medium/pine_sapling_medium_mid.glb', import.meta.url).href);
  const sp = [];
  guard = 0;
  while (sp.length < 150 && guard++ < 10000) {
    const x = -430 + Math.random() * 860, z = 105 + Math.random() * 345;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.6 || h > 30) continue;
    if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < 54) continue;
    if (Math.abs(heightAt(x + 2.5, z) - h) > 2.2) continue;
    sp.push({ x, y: h - 0.1, z, ry: Math.random() * Math.PI * 2, s: 1.3 + Math.random() * 1.1 });
  }
  group.add(scatterModel(sapling.scene, sp, { shadow: false, vary: 0.2 }));
  // stumps and small stones scattered over the snow
  const stump = await loadModel(new URL('../../assets/models/tree_stump_01/tree_stump_01_1k.gltf', import.meta.url).href);
  const tp = [];
  for (let i = 0; i < 48; i++) {
    const x = (Math.random() - 0.5) * 780, z = 120 + Math.random() * 320;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.5) { i--; continue; }
    if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < 50) { i--; continue; }
    tp.push({ x, y: h - 0.05, z, ry: Math.random() * Math.PI * 2, s: 0.8 + Math.random() * 0.7 });
  }
  group.add(scatterModel(stump.scene, tp, { vary: 0.1 }));
  const stones = await loadModel(new URL('../../assets/models/sand_rocks_small_01/sand_rocks_small_01_mid.glb', import.meta.url).href);
  const kp = [];
  for (let i = 0; i < 110; i++) {
    const x = (Math.random() - 0.5) * 820, z = 110 + Math.random() * 330;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.4) { i--; continue; }
    kp.push({ x, y: h - 0.08, z, ry: Math.random() * Math.PI * 2, s: 0.7 + Math.random() * 0.9 });
  }
  group.add(scatterModel(stones.scene, kp, { shadow: false, vary: 0.15 }));
  // village props: barrels and crates beside the houses
  const barrels = await loadModel(new URL('../../assets/models/wooden_barrels_01/wooden_barrels_01_1k.gltf', import.meta.url).href);
  const bp = [[-11, 171], [18, 163], [-27, 192], [26, 201], [-4, 211], [17, 220], [-19, 161], [33, 190]].map(([x, z]) =>
    ({ x, y: heightAt(x, z) - 0.03, z, ry: Math.random() * Math.PI * 2, s: 0.9 + Math.random() * 0.3 }));
  group.add(scatterModel(barrels.scene, bp, { vary: 0.1 }));
  const crates = await loadModel(new URL('../../assets/models/wooden_crate_01/wooden_crate_01_1k.gltf', import.meta.url).href);
  const cp = [[12, 171], [-20, 200], [31, 186], [-33, 182], [7, 222], [-13, 219], [24, 172], [-29, 207]].map(([x, z]) =>
    ({ x, y: heightAt(x, z) - 0.03, z, ry: Math.random() * Math.PI * 2, s: 1 + Math.random() * 0.5 }));
  group.add(scatterModel(crates.scene, cp, { vary: 0.1 }));
  // dormant shrubs poking through the snow
  const shrub = await loadModel(new URL('../../assets/models/shrub_01/shrub_01_mid.glb', import.meta.url).href);
  const shp = [];
  guard = 0;
  while (shp.length < 80 && guard++ < 5000) {
    const x = (Math.random() - 0.5) * 820, z = 110 + Math.random() * 330;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.5) continue;
    if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < 52) continue;
    shp.push({ x, y: h - 0.08, z, ry: Math.random() * Math.PI * 2, s: 0.8 + Math.random() * 0.8 });
  }
  group.add(scatterModel(shrub.scene, shp, { shadow: false, vary: 0.25 }));
  scene.add(group);
  return { group, dispose() { ctx.village = null; disposeGroup(group); } };
}
