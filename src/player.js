// Nucleus End - first-person exploration controls
import * as THREE from 'three';
import { heightAt, SEA_Y } from './noise.js';

export function createPlayer(camera, dom) {
  const pos = new THREE.Vector3(6, 0, 292);
  pos.y = heightAt(pos.x, pos.z) + 1.7;
  let yaw = 0.35, pitch = -0.02; // face north toward the village
  const keys = {};
  let locked = false;
  // Touch input (iPad): virtual joystick sets this, look-drag calls addLook.
  // x: strafe right (+1), y: forward (+1). PC path is untouched.
  const touch = { x: 0, y: 0 };
  const isFinePointer = matchMedia('(pointer: fine)').matches;
  addEventListener('keydown', e => { keys[e.code] = true; });
  addEventListener('keyup', e => { keys[e.code] = false; });
  dom.addEventListener('click', () => { if (!locked && isFinePointer) dom.requestPointerLock(); });
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === dom; });
  document.addEventListener('mousemove', e => {
    if (!locked) return;
    yaw -= e.movementX * 0.0021;
    pitch = Math.max(-1.35, Math.min(1.35, pitch - e.movementY * 0.0021));
  });
  return {
    pos, keys,
    get yaw() { return yaw; },
    setTouchMove(x, y) { touch.x = x; touch.y = y; },
    addLook(dx, dy) {
      yaw -= dx * 0.0021;
      pitch = Math.max(-1.35, Math.min(1.35, pitch - dy * 0.0021));
    },
    update(dt) {
      const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
      const sp = (sprint ? 11.5 : 5.6) * dt;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      const rx = -fz, rz = fx;
      let mx = 0, mz = 0;
      if (keys['KeyW'] || keys['ArrowUp']) { mx += fx; mz += fz; }
      if (keys['KeyS'] || keys['ArrowDown']) { mx -= fx; mz -= fz; }
      if (keys['KeyA'] || keys['ArrowLeft']) { mx -= rx; mz -= rz; }
      if (keys['KeyD'] || keys['ArrowRight']) { mx += rx; mz += rz; }
      if (touch.x || touch.y) { mx += fx * touch.y + rx * touch.x; mz += fz * touch.y + rz * touch.x; }
      const L = Math.hypot(mx, mz);
      if (L > 0) {
        const nx = pos.x + (mx / L) * sp, nz = pos.z + (mz / L) * sp;
        if (heightAt(nx, nz) > SEA_Y - 0.4) { pos.x = nx; pos.z = nz; }
      }
      pos.x = Math.max(-430, Math.min(430, pos.x));
      pos.z = Math.max(-430, Math.min(430, pos.z));
      const targetY = heightAt(pos.x, pos.z) + 1.7;
      pos.y += (targetY - pos.y) * Math.min(1, dt * 10);
      camera.position.copy(pos);
      camera.rotation.set(0, 0, 0);
      camera.rotateY(yaw); camera.rotateX(pitch);
    }
  };
}
