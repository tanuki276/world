// Nucleus End - Web edition, Stage 1 (exploration): bootstrap + region streaming
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { createPlayer } from './player.js';
import { createStorm } from './storm.js';
import { createRegionManager } from './region-manager.js';
import { heightAt, SEA_Y, VILLAGE } from './noise.js';

const $ = id => document.getElementById(id);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbcd2e8);
scene.fog = new THREE.Fog(0xc3d5e8, 60, 620);

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 3000);
const hemi = new THREE.HemisphereLight(0xdceeff, 0x5d6a58, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 1.9);
sun.position.set(120, 190, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
sun.shadow.camera.far = 520;
scene.add(sun, sun.target);

const world = buildWorld(scene);
const player = createPlayer(camera, renderer.domElement);
// spawn is (6, 292) facing north inside player.js (yaw 0.35)

// ?pos=x,z teleports the player (used for region/streaming checks)
const params = new URLSearchParams(location.search);
if (params.get('pos')) {
  const [px, pz] = params.get('pos').split(',').map(Number);
  if (isFinite(px) && isFinite(pz)) player.pos.set(px, 0, pz);
}

const ctx = {
  playerPos: player.pos,
  creatures: null,   // registered by the steppe region while it is loaded
  village: null,     // registered by the south region while it is loaded
  onLoading: n => { $('loading').style.opacity = n > 0 ? '1' : '0'; }
};
const manager = createRegionManager(scene, ctx);
const storm = createStorm(scene, {
  hemi, sun,
  creatures: { mutateNear: (x, z, r) => (ctx.creatures ? ctx.creatures.mutateNear(x, z, r) : 0) },
  flashEl: $('flash'),
  // storm.js passes full message strings (not kind codes), so show them as-is.
  onEvent: msg => showToast(msg)
});
window.__NE = { manager, ctx, player, renderer, scene, camera, storm };
if (params.get('storm') === '1') setTimeout(() => storm.force(), 1200);

function showToast(msg, ms = 3400) {
  const t = $('toast'); t.textContent = msg; t.style.opacity = '1';
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => t.style.opacity = '0', ms);
}
let objectiveStage = 0, nearNpc = null, dlgIdx = -1, stormHintShown = false;
function setObjective(txt) { $('objective').textContent = '目的 ― ' + txt; }
setObjective('北へ進み、シヴェシュッタ村へ向かえ');

function zoneAt(p) {
  if (Math.hypot(p.x - VILLAGE.x, p.z - VILLAGE.z) < 58) return 'シヴェシュッタ村';
  if (p.z < -150) return '北の山並み';
  if (p.z < 60 && p.z >= -150) return 'ユヴァシレフ草原';
  if (p.z > 250) return '南の海岸';
  return 'シェネタプラ島';
}
let lastZone = '';
function refreshZone() {
  const z = zoneAt(player.pos);
  if (z !== lastZone) {
    lastZone = z;
    const zel = $('zone');
    zel.textContent = z; zel.style.opacity = '1';
    clearTimeout(refreshZone._h);
    refreshZone._h = setTimeout(() => zel.style.opacity = '0', 2600);
    if (z === 'シヴェシュッタ村' && objectiveStage === 0) { objectiveStage = 1; setObjective('村人 全員に話を聞け (0/3)'); }
    if (z === 'ユヴァシレフ草原' && objectiveStage === 2) { objectiveStage = 3; setObjective('草原を探索せよ ― 雷雨と変異生物に注意'); }
    if (z === 'ユヴァシレフ草原' && !stormHintShown) { stormHintShown = true; setTimeout(() => showToast('この島では数百年に一度、全てを焼く「アスラティ雷雨」が来るという'), 800); }
  }
}
function talk(npc) {
  dlgIdx++;
  const lines = npc.dialogue.lines;
  if (dlgIdx >= lines.length) { endTalk(); return; }
  $('dlg-name').textContent = npc.dialogue.name;
  $('dlg-text').textContent = lines[dlgIdx];
  $('dialogue').style.display = 'block';
  if (dlgIdx === lines.length - 1 && !npc.talked) {
    npc.talked = true;
    if (objectiveStage === 1 && ctx.village) {
      const n = ctx.village.npcs.filter(v => v.talked).length;
      setObjective('村人 全員に話を聞け (' + n + '/3)');
      if (n >= 3) { objectiveStage = 2; setObjective('村を出て北へ ― ユヴァシレフ草原を抜け、天空神殿を目指せ'); showToast('村人の話を聞いた。全員が「原子核」の神話を信じている'); }
    }
  }
}
function endTalk() { dlgIdx = -1; $('dialogue').style.display = 'none'; }
addEventListener('keydown', ev => {
  if (ev.code === 'KeyE') {
    if (dlgIdx >= 0 && nearNpc) talk(nearNpc);
    else if (nearNpc) { dlgIdx = -1; talk(nearNpc); }
  }
  if (ev.code === 'KeyT') storm.force();
});
$('start').addEventListener('click', () => {
  showToast('シェネタプラ島に上陸した ― 北の村を目指せ');
});
// ---- Touch controls (iPad): left stick to move, drag right side to look ----
// ?touch=1 forces it on for testing; otherwise it follows the coarse pointer.
const isTouch = params.get('touch') === '1' || matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) {
  document.body.classList.add('touch');
  $('help').innerHTML = '左スティック 移動 / 右側をドラッグ 視点<br>話すボタンで会話 / 雷雨ボタンで雷雨を呼ぶ';
  const stick = $('stick'), nub = $('stick-nub');
  const R = 48; let stickId = null;
  const setStick = t => {
    const r = stick.getBoundingClientRect();
    let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = dx / len * R; dy = dy / len * R; }
    nub.style.left = (38 + dx) + 'px'; nub.style.top = (38 + dy) + 'px';
    player.setTouchMove(dx / R, -dy / R);
  };
  const endStick = () => { stickId = null; nub.style.left = '38px'; nub.style.top = '38px'; player.setTouchMove(0, 0); };
  stick.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; stickId = t.identifier; setStick(t); }, { passive: false });
  stick.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === stickId) setStick(t); }, { passive: false });
  stick.addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === stickId) endStick(); });
  stick.addEventListener('touchcancel', endStick);
  let lookId = null, lx = 0, ly = 0;
  renderer.domElement.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) {
      if (t.clientX > innerWidth * 0.45 && lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
    }
  }, { passive: true });
  renderer.domElement.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === lookId) { player.addLook(t.clientX - lx, t.clientY - ly); lx = t.clientX; ly = t.clientY; }
    }
    if (lookId !== null) e.preventDefault();
  }, { passive: false });
  const endLook = e => { for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; };
  renderer.domElement.addEventListener('touchend', endLook);
  renderer.domElement.addEventListener('touchcancel', endLook);
  // Talk / storm buttons do exactly what the E / T keys do on PC.
  $('btn-talk').addEventListener('click', () => { if (!nearNpc) return; if (dlgIdx >= 0) talk(nearNpc); else { dlgIdx = -1; talk(nearNpc); } });
  $('btn-storm').addEventListener('click', () => storm.force());
  $('dialogue').addEventListener('click', () => { if (dlgIdx >= 0 && nearNpc) talk(nearNpc); });
  $('prompt').style.pointerEvents = 'auto';
  $('prompt').addEventListener('click', () => { if (nearNpc) { dlgIdx = -1; talk(nearNpc); } });
}
const camParam = params.get('cam');
if (camParam) {
  const [cx, cz, cyaw, cpitch] = camParam.split(',').map(Number);
  const cy = heightAt(cx, cz) + 2.2;
  camera.position.set(cx, cy, cz);
  camera.rotation.order = 'YXZ';
  camera.rotation.set((cpitch || 0) * Math.PI / 180, (cyaw || 0) * Math.PI / 180, 0);
  $('start').style.display = 'none';
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
const clock = new THREE.Clock();
let shadowTick = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (!camParam) {
    player.update(dt);
    if (player.pos.y < SEA_Y + 0.4) player.pos.y = SEA_Y + 0.4;
    refreshZone();
    nearNpc = null;
    const npcs = ctx.village ? ctx.village.npcs : [];
    for (const n of npcs) {
      if (n.group.position.distanceTo(player.pos) < 3.4) { nearNpc = n; break; }
    }
    $('prompt').style.opacity = nearNpc ? '1' : '0';
    if (isTouch) $('btn-talk').style.opacity = nearNpc ? '1' : '0.35';
    if (nearNpc) $('prompt').textContent = '[E] ' + nearNpc.dialogue.name + ' と話す';
  }
  manager.update(player.pos, dt);
  world.skyIsland.position.y = 128 + Math.sin(t * 0.24) * 2.4;
  storm.update(dt, player.pos);
  if (++shadowTick % 12 === 0 && !camParam) {
    sun.position.set(player.pos.x + 120, 190, player.pos.z + 60);
    sun.target.position.copy(player.pos);
  }
  renderer.render(scene, camera);
}
loop();
