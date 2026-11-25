// Nucleus End - deterministic noise & island height field (shared by world/player)
export function hash2(x, z) {
  let h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return h - Math.floor(h);
}
function smooth(t) { return t * t * (3 - 2 * t); }
export function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  const u = smooth(xf), v = smooth(zf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; // 0..1
}
export function fbm(x, z, oct = 4) {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += amp * vnoise(x * f, z * f); amp *= 0.5; f *= 2.03; }
  return s; // ~0..1
}
export const VILLAGE = { x: 0, z: 185, r: 58, h: 6.0 };
export const STEPPE = { x: 0, z: -50, r: 175, h: 7.5 };
export function heightAt(x, z) {
  const dCenter = Math.hypot(x, z);
  // island falloff into the sea
  const fall = Math.max(0, Math.min(1, (390 - dCenter) / 130));
  let h = fbm(x * 0.011 + 7.3, z * 0.011 + 2.9) * 15 - 3.5;
  // northern ridge (mountains toward the temples / volcano side), beyond the steppe
  const north = Math.max(0, Math.min(1, (-z - 175) / 170));
  h += north * north * (fbm(x * 0.02 + 1.7, z * 0.02 + 8.4) * 36 + 10);
  // southern shore gentler
  const south = Math.max(0, Math.min(1, (z - 120) / 200));
  h = h * (1 - south * 0.45);
  h = h * fall - (1 - fall) * 6;
  // steppe basin: a wide, gentle dry plain (ユヴァシレフ草原)
  const ds = Math.hypot(x - STEPPE.x, z - STEPPE.z);
  if (ds < STEPPE.r + 70) {
    const t = smooth(Math.max(0, Math.min(1, (ds - STEPPE.r * 0.6) / 70)));
    const plain = STEPPE.h + (fbm(x * 0.03 + 3.1, z * 0.03 + 6.7) - 0.5) * 2.2;
    h = plain * (1 - t) + h * t;
  }
  // village plateau
  const dv = Math.hypot(x - VILLAGE.x, z - VILLAGE.z);
  if (dv < VILLAGE.r + 30) {
    const t = smooth(Math.max(0, Math.min(1, (dv - VILLAGE.r * 0.55) / 30)));
    h = VILLAGE.h * (1 - t) + h * t;
  }
  return h;
}
export const SEA_Y = 1.1;
