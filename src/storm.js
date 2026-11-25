// Nucleus End - アスラティ雷雨: the storm that burns and mutates whatever it touches
import * as THREE from 'three';
import { heightAt } from './noise.js';

export function createStorm(scene, opts) {
  const { hemi, sun, creatures, flashEl, onEvent } = opts;
  const flash = new THREE.PointLight(0xcfe0ff, 0, 260, 1.2);
  scene.add(flash);
  const scorchM = new THREE.MeshBasicMaterial({ color: 0x14161a, transparent: true, opacity: 0.85 });
  let mode = 'idle'; // idle -> gathering -> striking -> clearing
  let t = 0, nextIn = 55 + Math.random() * 40, strikeT = 0, strikes = 0;
  let audio = null;
  function thunder(delay) {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime + delay;
      const dur = 1.6 + Math.random();
      const buf = audio.createBuffer(1, Math.floor(audio.sampleRate * dur), audio.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.03 * w) / 1.03; d[i] = last * 3.2 * Math.pow(1 - i / d.length, 1.4); }
      const src = audio.createBufferSource(); src.buffer = buf;
      const f = audio.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
      src.connect(f); f.connect(audio.destination); src.start(t0);
    } catch (e) {}
  }
  function setSky(k) { // k: 0 = clear, 1 = storm
    scene.background.setRGB(0.62 - 0.38 * k, 0.70 - 0.40 * k, 0.80 - 0.42 * k);
    scene.fog.color.copy(scene.background);
    hemi.intensity = 0.85 - 0.45 * k;
    sun.intensity = 1.6 - 1.05 * k;
  }
  function strike(playerPos) {
    const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 34;
    const x = playerPos.x + Math.cos(a) * r, z = playerPos.z + Math.sin(a) * r;
    const h = heightAt(x, z);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2 + Math.random() * 1.6, 12), scorchM);
    disc.rotation.x = -Math.PI / 2; disc.position.set(x, h + 0.06, z);
    scene.add(disc);
    flash.position.set(x, h + 16, z);
    flash.intensity = 900;
    if (flashEl) { flashEl.style.opacity = '0.75'; setTimeout(() => { flashEl.style.opacity = '0.25'; }, 60); setTimeout(() => { flashEl.style.opacity = '0'; }, 150); }
    thunder(0.15 + Math.random() * 0.5);
    const n = creatures.mutateNear(x, z, 20);
    if (onEvent) onEvent(n > 0 ? `雷が落ちた。近くの獣が変異した (${n}体)` : '雷が落ちた。地面が焼けた。');
    strikes++;
  }
  return {
    get mode() { return mode; },
    force() { if (mode === 'idle') { mode = 'gathering'; t = 0; if (onEvent) onEvent('空が暗くなる。アスラティ雷雨が近づいている…'); } },
    update(dt, playerPos) {
      flash.intensity = Math.max(0, flash.intensity - dt * 5200);
      t += dt;
      if (mode === 'idle') {
        if (t >= nextIn) { mode = 'gathering'; t = 0; if (onEvent) onEvent('空が暗くなる。アスラティ雷雨が近づいている…'); }
      } else if (mode === 'gathering') {
        setSky(Math.min(1, t / 6));
        if (t >= 6) { mode = 'striking'; t = 0; strikeT = 0; strikes = 0; }
      } else if (mode === 'striking') {
        strikeT -= dt;
        if (strikeT <= 0) { strike(playerPos); strikeT = 1.6 + Math.random() * 1.8; }
        if (t >= 19) { mode = 'clearing'; t = 0; if (onEvent) onEvent('雷雨が去っていく…'); }
      } else if (mode === 'clearing') {
        setSky(1 - Math.min(1, t / 6));
        if (t >= 6) { mode = 'idle'; t = 0; nextIn = 80 + Math.random() * 50; setSky(0); }
      }
    }
  };
}
