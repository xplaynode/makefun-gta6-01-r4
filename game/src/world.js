// Puerto Brasa city generation: road grid, buildings with signs, palms, beach and sea.
import { WORLD, DISTRICTS } from './config.js';
import { makeRandom } from './random.js';

export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  return DISTRICTS[DISTRICTS.length - 1];
}
export function isRoad(x, y) {
  const half = WORLD.roadWidth / 2;
  const mx = ((x % WORLD.roadEvery) + WORLD.roadEvery) % WORLD.roadEvery;
  const my = ((y % WORLD.roadEvery) + WORLD.roadEvery) % WORLD.roadEvery;
  return Math.abs(mx - WORLD.roadEvery / 2) < half || Math.abs(my - WORLD.roadEvery / 2) < half || x > 2820;
}
export function nearestRoadPoint(x, y) {
  const rx = Math.round((x - 200) / WORLD.roadEvery) * WORLD.roadEvery + 200;
  const ry = Math.round((y - 200) / WORLD.roadEvery) * WORLD.roadEvery + 200;
  return Math.abs(rx - x) < Math.abs(ry - y) ? { x: rx, y } : { x, y: ry };
}

const SIGNS = ['CAFE SOL', 'TALLER MINA', 'HOTEL FARO', 'PANADERIA', 'BAR BRASA', 'PESCA', 'FARMACIA', 'TATUAJES', 'MERCADO', 'CINE LUNA', 'JOYERIA', 'SURF'];
const ROOFS = ['#b5563c', '#c97b4a', '#a34a5e', '#d19a55', '#7a9a8a', '#c2b280', '#9a6a9a', '#5e8a9a'];

export function buildCity(seed = 7) {
  const rng = makeRandom(seed);
  const buildings = []; const palms = []; const crates = [];
  for (let bx = 60; bx < 2820; bx += 130) {
    for (let by = 60; by < WORLD.height - 60; by += 130) {
      const cx = bx + 55; const cy = by + 55;
      if (isRoad(cx, cy)) continue;
      if (rng() < 0.16) { palms.push({ x: cx, y: cy, s: 0.8 + rng() * 0.5 }); continue; }
      buildings.push({
        x: bx, y: by, w: 92 + rng() * 22, h: 92 + rng() * 22,
        color: ROOFS[Math.floor(rng() * ROOFS.length)],
        sign: SIGNS[Math.floor(rng() * SIGNS.length)],
        floors: 2 + Math.floor(rng() * 5),
      });
      if (rng() < 0.2) crates.push({ x: cx + 30, y: cy + 20, w: 34, h: 34, hp: 40 });
    }
  }
  for (let i = 0; i < 90; i++) palms.push({ x: 2840 + rng() * 60, y: rng() * WORLD.height, s: 0.9 + rng() * 0.6 });
  for (let i = 0; i < 40; i++) palms.push({ x: rng() * 2800, y: 1650 + rng() * 650, s: 0.8 + rng() * 0.5 });
  return { buildings, palms, crates };
}

export function collideBuildings(city, x, y, r) {
  for (const b of city.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}
export function coverAt(city, x, y) {
  for (const c of city.crates) if (Math.abs(x - c.x) < 30 && Math.abs(y - c.y) < 30) return c;
  return null;
}
