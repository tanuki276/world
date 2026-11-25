// Nucleus End - shared builders: terrain patches, GLTF scatter, snow coloring
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { heightAt, SEA_Y, fbm } from './noise.js';

const gltfLoader = new GLTFLoader();
const modelCache = new Map();
export function loadModel(url) {
  if (!modelCache.has(url)) modelCache.set(url, gltfLoader.loadAsync(url));
  return modelCache.get(url);
}

// Scatter a loaded GLTF model as InstancedMeshes (one per source mesh).
// opts.shadow=false skips the shadow pass for ground cover (grass, shrubs, small
// stones): with thousands of instances the shadow render costs as much as the
// main render. opts.vary (0..1) adds deterministic per-instance tint variation
// so repeated props do not look cloned.
export function scatterModel(gltfScene, placements, opts = {}) {
  const group = new THREE.Group();
  const meshes = [];
  gltfScene.updateMatrixWorld(true);
  gltfScene.traverse(o => { if (o.isMesh) meshes.push(o); });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const vary = opts.vary || 0;
  const tint = new THREE.Color();
  for (const src of meshes) {
    const local = src.matrixWorld.clone();
    const im = new THREE.InstancedMesh(src.geometry, src.material, placements.length);
    placements.forEach((p, i) => {
      e.set(0, p.ry || 0, 0); q.setFromEuler(e);
      const place = new THREE.Matrix4().compose(
        new THREE.Vector3(p.x, p.y, p.z), q,
        new THREE.Vector3(p.s || 1, (p.sy || p.s || 1), p.s || 1));
      m4.multiplyMatrices(place, local);
      im.setMatrixAt(i, m4);
      if (vary > 0) {
        const h1 = Math.sin(i * 127.1 + p.x * 311.7 + p.z * 74.7) * 43758.5453;
        const r1 = h1 - Math.floor(h1);
        const h2 = Math.sin(i * 269.5 + p.z * 183.3 + p.x * 41.3) * 28001.8384;
        const r2 = h2 - Math.floor(h2);
        const b = 1 - vary / 2 + r1 * vary;
        tint.setRGB(b * (1 + (r2 - 0.5) * vary * 0.6), b, b * (1 - (r2 - 0.5) * vary * 0.6));
        im.setColorAt(i, tint);
      }
    });
    if (vary > 0 && im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = opts.shadow !== false; im.receiveShadow = true;
    group.add(im);
  }
  return group;
}

export function terrainPatch({ x0, x1, z0, z1, step = 3.75, material, colorFn }) {
  const w = x1 - x0, d = z1 - z0;
  const geo = new THREE.PlaneGeometry(w, d, Math.round(w / step), Math.round(d / step));
  geo.rotateX(-Math.PI / 2);
  geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const pos = geo.attributes.position;
  const colors = colorFn ? new Float32Array(pos.count * 3) : null;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    if (colorFn) { colorFn(x, z, h, c); colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
  }
  if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 9, pos.getZ(i) / 9);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

const cSnow = new THREE.Color(0xdde7f2), cRock = new THREE.Color(0x646b74), cSand = new THREE.Color(0xb9bfae);
const cDirt = new THREE.Color(0x8a5a28), cSnowShade = new THREE.Color(0xaec2dc);
export function snowColor(x, z, h, out) {
  const s = Math.abs(heightAt(x + 2.5, z) - h) + Math.abs(heightAt(x, z + 2.5) - h);
  out.copy(cSnow);
  // patchy exposed ground: dirt and rock showing through the snow in large blotches
  const n = fbm(x * 0.014 + 52.0, z * 0.014 + 27.5);
  const m = fbm(x * 0.055 - 6.2, z * 0.055 + 18.9);
  const patch = Math.max(0, Math.min(1, (m - 0.52) * 3.0 + Math.max(0, n - 0.44) * 0.8));
  if (patch > 0) out.lerp(n > 0.64 ? cRock : cDirt, patch);
  // blue-grey snow settling in hollows
  const hollow = Math.max(0, Math.min(1, (0.5 - m) * 1.4));
  out.lerp(cSnowShade, hollow * 0.35);
  if (h < SEA_Y + 0.7) out.copy(cSand);
  if (s > 2.2) out.lerp(cRock, Math.min(1, (s - 2.2) / 2.6));
  return out;
}

export function snowMaterial() {
  const tl = new THREE.TextureLoader();
  const base = new URL('../assets/', import.meta.url).href;
  const diff = tl.load(base + 'textures/snow_01_diff.jpg');
  diff.wrapS = diff.wrapT = THREE.RepeatWrapping; diff.colorSpace = THREE.SRGBColorSpace;
  const nor = tl.load(base + 'textures/snow_01_nor.jpg');
  nor.wrapS = nor.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map: diff, normalMap: nor, vertexColors: true, roughness: 0.95 });
}

export function disposeGroup(group) {  if (!group) return;
  group.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => { for (const k in m) { if (m[k] && m[k].isTexture) m[k].dispose(); } m.dispose(); });
    }
  });
}
export { fbm };
