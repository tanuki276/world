// Nucleus End - シヴェシュッタ村: houses and villagers who all believe the myth
import * as THREE from 'three';
import { VILLAGE, heightAt } from './noise.js';

export const DIALOGUES = [
  {
    name: '村長格の老人',
    lines: [
      'よく来た。あんたが神殿へ行く人か。',
      '空を見なさい。天に浮かぶテュペレト島。あの最奥にある「原子核」を壊せば、この雷雨の世は終わる。先祖代々の言い伝えだ。',
      '疑う者はこの村にはおらん。皆、そう信じて生きてきた。'
    ]
  },
  {
    name: '村人',
    lines: [
      'アスラティの雷は数百年に一度、全部を焼くんだ。',
      '前に雷が落ちた辺りじゃ、獣の形が変わっちまった。あの草原の獣には近づくなよ。'
    ]
  },
  {
    name: '村人',
    lines: [
      '天空神殿は、誰かが建てたものじゃないそうだ。自然にできた建造物なんだと。',
      '不思議なこともあるもんだ。昔からあそこにあって、中には原子核がある。'
    ]
  }
];

export function buildVillage(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const tl = new THREE.TextureLoader();
  const texBase = new URL('../assets/textures/', import.meta.url).href;
  function texMat(name, rx, ry) {
    const diff = tl.load(texBase + name + '_diff.jpg');
    diff.wrapS = diff.wrapT = THREE.RepeatWrapping; diff.colorSpace = THREE.SRGBColorSpace; diff.repeat.set(rx, ry);
    const nor = tl.load(texBase + name + '_nor.jpg');
    nor.wrapS = nor.wrapT = THREE.RepeatWrapping; nor.repeat.set(rx, ry);
    return new THREE.MeshStandardMaterial({ map: diff, normalMap: nor, roughness: 0.95 });
  }
  const wallM = texMat('weathered_plank_siding', 2, 1);
  const roofM = texMat('roof_planks', 2, 1);
  const woodM = texMat('dark_wooden_planks', 1, 1);
  const lampM = new THREE.MeshStandardMaterial({ color: 0xffca7a, emissive: 0xff9c3a, emissiveIntensity: 1.6 });

  const houseSpots = [
    [-16, 168, 0.4], [14, 166, -0.3], [-24, 196, 1.2], [22, 198, -1.0],
    [-8, 214, 0.1], [10, 218, 3.0], [-30, 178, 0.9], [30, 182, -0.8]
  ];
  for (const [x, z, rot] of houseSpots) {
    const h = heightAt(x, z);
    const house = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 3.6, 6), wallM);
    base.position.y = 1.8; base.castShadow = true; base.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4), roofM);
    roof.position.y = 4.9; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.15), woodM);
    door.position.set(0, 1.1, 3.05);
    house.add(base, roof, door);
    house.position.set(x, h, z);
    house.rotation.y = rot;
    group.add(house);
  }
  // lamps
  for (const [x, z] of [[-5, 178], [6, 190], [-12, 204], [14, 206]]) {
    const h = heightAt(x, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.4, 6), woodM);
    pole.position.set(x, h + 1.7, z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), lampM);
    bulb.position.set(x, h + 3.5, z);
    const light = new THREE.PointLight(0xffb45e, 12, 16, 1.8);
    light.position.set(x, h + 3.5, z);
    group.add(pole, bulb, light);
  }

  // fences: post-and-rail runs around the village (south approach with a path gap, west edge)
  {
    const postG = new THREE.BoxGeometry(0.14, 1.15, 0.14);
    const runs = [
      { x0: -36, z0: 156, x1: -5, z1: 156 }, { x0: 6, z0: 156, x1: 36, z1: 156 },
      { x0: -38, z0: 160, x1: -38, z1: 212 }, { x0: 38, z0: 164, x1: 38, z1: 214 }
    ];
    for (const r of runs) {
      const len = Math.hypot(r.x1 - r.x0, r.z1 - r.z0);
      const n = Math.max(2, Math.round(len / 2.4));
      const ang = Math.atan2(r.z1 - r.z0, r.x1 - r.x0);
      for (let i = 0; i <= n; i++) {
        const x = r.x0 + (r.x1 - r.x0) * (i / n), z = r.z0 + (r.z1 - r.z0) * (i / n);
        const post = new THREE.Mesh(postG, woodM);
        post.position.set(x, heightAt(x, z) + 0.55, z);
        post.castShadow = true;
        group.add(post);
      }
      for (const ry of [0.38, 0.82]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.06), woodM);
        const mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2;
        rail.position.set(mx, heightAt(mx, mz) + ry, mz);
        rail.rotation.y = -ang;
        group.add(rail);
      }
    }
  }

  // villagers
  const npcs = [];
  const bodyM = new THREE.MeshStandardMaterial({ color: 0x4c5a6a, roughness: 1 });
  const headM = new THREE.MeshStandardMaterial({ color: 0xc9a586, roughness: 0.9 });
  const npcSpots = [[-4, 176, 0.6], [9, 196, 2.6], [-14, 190, -0.8]];
  npcSpots.forEach(([x, z, ry], i) => {
    const h = heightAt(x, z);
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.44, 1.25, 8), bodyM);
    body.position.y = 0.63; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), headM);
    head.position.y = 1.5;
    g.add(body, head);
    g.position.set(x, h, z);
    g.rotation.y = ry;
    group.add(g);
    npcs.push({ group: g, x, z, dialogue: DIALOGUES[i], talked: false });
  });

  return { group, npcs };
}
