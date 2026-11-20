// Deterministic seeded random so screenshot scenes and city layout are stable.
export function makeRandom(seed) {
  let s = (seed >>> 0) || 12345;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function pick(rng, list) { return list[Math.floor(rng() * list.length) % list.length]; }
export function range(rng, lo, hi) { return lo + rng() * (hi - lo); }
