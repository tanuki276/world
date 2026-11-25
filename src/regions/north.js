// Region: 北の山並み + ヴェリー・ヴァイラシェル大火山 (snowy north)
import * as THREE from 'three';
import { terrainPatch, snowColor, snowMaterial, scatterModel, loadModel, disposeGroup } from '../util.js';
import { heightAt, SEA_Y, fbm } from '../noise.js';

export async function build(scene, ctx) {
  const group = new THREE.Group();
  const mat = snowMaterial();
  group.add(terrainPatch({ x0: -450, x1: 450, z0: -462.5, z1: -200, material: mat, colorFn: snowColor }));
  // real pines (Poly Haven CC0, photogrammetry — heavy, loaded only with this region)
  const pine = await loadModel(new URL('../../assets/models/pine_tree_01/pine_tree_01_mid.glb', import.meta.url).href);
  const pp = [];
  let guard = 0;
  while (pp.length < 50 && guard++ < 4000) {
    const x = -430 + Math.random() * 860, z = -455 + Math.random() * 250;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.6 || h > 32) continue;
    if (Math.abs(heightAt(x + 2.5, z) - h) > 2.2) continue;
    pp.push({ x, y: h - 0.15, z, ry: Math.random() * Math.PI * 2, s: 0.85 + Math.random() * 0.5 });
  }
  group.add(scatterModel(pine.scene, pp, { vary: 0.12 }));
  const rock = await loadModel(new URL('../../assets/models/rock_07/rock_07_1k.gltf', import.meta.url).href);
  const rp = [];
  for (let i = 0; i < 24; i++) {
    const x = (Math.random() - 0.5) * 760, z = -210 - Math.random() * 230;
    rp.push({ x, y: heightAt(x, z) - 0.4, z, ry: Math.random() * Math.PI * 2, s: 1.2 + Math.random() * 2.6 });
  }
  group.add(scatterModel(rock.scene, rp, { vary: 0.08 }));
  // young pines, stumps, boulders and small stones fill out the northern woods
  const sapling = await loadModel(new URL('../../assets/models/pine_sapling_medium/pine_sapling_medium_mid.glb', import.meta.url).href);
  const sp = [];
  guard = 0;
  while (sp.length < 130 && guard++ < 10000) {
    const x = -430 + Math.random() * 860, z = -455 + Math.random() * 250;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.6 || h > 32) continue;
    if (Math.abs(heightAt(x + 2.5, z) - h) > 2.2) continue;
    sp.push({ x, y: h - 0.1, z, ry: Math.random() * Math.PI * 2, s: 1.3 + Math.random() * 1.1 });
  }
  group.add(scatterModel(sapling.scene, sp, { shadow: false, vary: 0.2 }));
  const stump = await loadModel(new URL('../../assets/models/tree_stump_01/tree_stump_01_1k.gltf', import.meta.url).href);
  const tp = [];
  for (let i = 0; i < 52; i++) {
    const x = (Math.random() - 0.5) * 800, z = -215 - Math.random() * 235;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.5) { i--; continue; }
    tp.push({ x, y: h - 0.05, z, ry: Math.random() * Math.PI * 2, s: 0.8 + Math.random() * 0.7 });
  }
  group.add(scatterModel(stump.scene, tp, { vary: 0.1 }));
  const boulder = await loadModel(new URL('../../assets/models/boulder_01/boulder_01_1k.gltf', import.meta.url).href);
  const bop = [];
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 760, z = -210 - Math.random() * 230;
    bop.push({ x, y: heightAt(x, z) - 0.5, z, ry: Math.random() * Math.PI * 2, s: 1 + Math.random() * 1.2 });
  }
  group.add(scatterModel(boulder.scene, bop, { vary: 0.08 }));
  const stones = await loadModel(new URL('../../assets/models/sand_rocks_small_01/sand_rocks_small_01_mid.glb', import.meta.url).href);
  const kp = [];
  for (let i = 0; i < 110; i++) {
    const x = (Math.random() - 0.5) * 820, z = -210 - Math.random() * 240;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.4) { i--; continue; }
    kp.push({ x, y: h - 0.08, z, ry: Math.random() * Math.PI * 2, s: 0.7 + Math.random() * 0.9 });
  }
  group.add(scatterModel(stones.scene, kp, { shadow: false, vary: 0.15 }));
  const shrub = await loadModel(new URL('../../assets/models/shrub_01/shrub_01_mid.glb', import.meta.url).href);
  const shp = [];
  guard = 0;
  while (shp.length < 70 && guard++ < 5000) {
    const x = (Math.random() - 0.5) * 820, z = -215 - Math.random() * 240;
    const h = heightAt(x, z);
    if (h < SEA_Y + 0.5) continue;
    shp.push({ x, y: h - 0.08, z, ry: Math.random() * Math.PI * 2, s: 0.8 + Math.random() * 0.8 });
  }
  group.add(scatterModel(shrub.scene, shp, { shadow: false, vary: 0.25 }));
  // ヴェリー・ヴァイラシェル大火山: jagged dark cone with a glowing crater, base buried
  const vx = -255, vz = -385;
  const vGeo = new THREE.ConeGeometry(92, 110, 36, 4);
  {
    const p = vGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const k = 1 + (fbm(Math.cos(a) * 2.6 + 5.5, Math.sin(a) * 2.6 + y * 0.05) - 0.5) * 0.38;
      p.setX(i, x * k); p.setZ(i, z * k);
      p.setY(i, y + (fbm(x * 0.08 + 1.3, z * 0.08) - 0.5) * 5);
    }
    vGeo.computeVertexNormals();
  }
  const volcano = new THREE.Mesh(vGeo,
    new THREE.MeshStandardMaterial({ color: 0x3d3a40, roughness: 1, flatShading: true }));
  volcano.position.set(vx, heightAt(vx, vz) + 16, vz);
  const crater = new THREE.Mesh(
    new THREE.CircleGeometry(17, 20),
    new THREE.MeshBasicMaterial({ color: 0xff5a26 }));
  crater.rotation.x = -Math.PI / 2;
  crater.position.set(vx, volcano.position.y + 55.4, vz);
  const glow = new THREE.PointLight(0xff6a33, 900, 260, 1.6);
  glow.position.copy(crater.position).y += 6;
  group.add(volcano, crater, glow);
  scene.add(group);
  return { group, dispose() { disposeGroup(group); } };
}
