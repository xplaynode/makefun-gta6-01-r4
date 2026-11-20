// Entities: traffic cars, pedestrians, PDB police units and the helicopter.
import { WORLD } from './config.js';
import { makeRandom } from './random.js';

export const CAR_COLORS = ['#e74c3c', '#f39c12', '#3498db', '#2ecc71', '#ecf0f1', '#9b59b6', '#e67e22', '#1abc9c', '#fd79a8'];
let nextId = 1;

export function makeCar(x, y, angle, rng, kind = 'traffic') {
  return {
    id: nextId++, kind, x, y, angle, speed: 0, hp: 100, color: kind === 'police' ? '#20304a' : CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)],
    w: 46, h: 24, driver: kind !== 'parked', smoking: false, burning: 0, dead: false,
    roadAxis: rng() < 0.5 ? 'x' : 'y', dir: rng() < 0.5 ? 1 : -1, turnTimer: 2 + rng() * 4, aiTimer: rng() * 2,
    ram: false, checkpoint: 0, lapTime: 0, finished: false,
  };
}
export function spawnTraffic(rng, count, cx, cy) {
  const cars = [];
  for (let i = 0; i < count; i++) {
    const onX = rng() < 0.5;
    const lane = Math.floor(rng() * 8) * WORLD.roadEvery + 200 + (rng() < 0.5 ? -22 : 22);
    const along = rng() * (onX ? WORLD.width - 400 : WORLD.height);
    const x = onX ? along : lane; const y = onX ? lane : along;
    if (Math.hypot(x - cx, y - cy) < 160) continue;
    const c = makeCar(x, y, onX ? 0 : Math.PI / 2, rng, rng() < 0.18 ? 'parked' : 'traffic');
    if (c.kind === 'parked') { c.x += 70; c.y += 70; c.driver = false; }
    cars.push(c);
  }
  return cars;
}
export function spawnPeds(rng, count) {
  const peds = [];
  for (let i = 0; i < count; i++) {
    peds.push({
      id: nextId++, x: 100 + rng() * 2700, y: 100 + rng() * (WORLD.height - 200),
      angle: rng() * Math.PI * 2, speed: 22 + rng() * 26, hp: 30, flee: 0,
      shirt: CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)], wander: rng() * 4, guard: false, dead: false,
    });
  }
  return peds;
}
export function makePolice(x, y, rng, ram = false) {
  const c = makeCar(x, y, 0, rng, 'police'); c.ram = ram; c.hp = 140; c.speed = 0; return c;
}
export function makeHelicopter(x, y) {
  return { x, y, angle: 0, orbit: 0, spotAngle: 0 };
}
export function seededRng(seed) { return makeRandom(seed); }
