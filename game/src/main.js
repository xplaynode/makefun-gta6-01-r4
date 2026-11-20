// Puerto Brasa — game loop and every system: driving, stealing, wanted/PDB pursuit,
// roadblocks, RAM units, helicopter, missions, combat, economy, races, crew, save.
import { WORLD, WEAPONS, MISSIONS, RACES, SHOPS, UPGRADES, HERO } from './config.js';
import { buildCity, districtAt, isRoad, collideBuildings, coverAt, nearestRoadPoint } from './world.js';
import { spawnTraffic, spawnPeds, makeCar, makePolice, makeHelicopter, seededRng } from './entities.js';
import { drawWorld, drawCar, drawPed, drawHelicopter, drawHUD, drawMenus } from './render.js';
import { SoundEngine } from './audio.js';
import { loadSave, storeSave } from './save.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 1280; canvas.height = 720;
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
const rng = seededRng(seed * 977 + 13);

const saved = loadSave();
export const S = {
  screen: 'title', time: 0, city: buildCity(seed), sound: new SoundEngine(),
  player: { x: 420, y: 470, angle: 0, hp: 100, armour: 0, speed: 0 },
  car: null, cars: [], peds: [], police: [], roadblocks: [], heli: null,
  cash: saved?.cash ?? 250, respect: saved?.respect ?? 0,
  missionIndex: saved?.missionIndex ?? 0, mission: null, missionStage: 0, target: null, objectiveText: '',
  wanted: 0, hiddenTime: 0, bustedTimer: 0, lastFine: 0,
  weapon: 0, wheelOpen: false, fireCooldown: 0, muzzle: 0, aim: 0, shotsFx: [],
  ammo: saved?.ammo ?? { brasa9: 60, cazadora: 18 },
  upgrades: saved?.upgrades ?? {}, bestTimes: saved?.bestTimes ?? {},
  crewCooldown: { mina: 0, toro: 0, alba: 0 }, revealUntil: 0, intimidateUsed: false,
  race: null, raceCars: [], message: '', messageUntil: 0, guardsLeft: 0, carrying: false,
  cam: { x: 0, y: 0 }, keys: {}, mouse: { x: 640, y: 360, down: false },
};
S.cars = spawnTraffic(rng, 46, S.player.x, S.player.y);
S.peds = spawnPeds(rng, 42);
const playerCarStart = makeCar(470, 470, 0, rng, 'traffic'); playerCarStart.color = '#f39c12'; S.cars.push(playerCarStart);

export function showMessage(text, secs = 3) { S.message = text; S.messageUntil = S.time + secs; }
export function currentMission() { return MISSIONS[S.missionIndex] || null; }
export function respectRankName() { return districtAt(S.player.x, S.player.y).name; }

export function startMission() {
  const m = currentMission(); if (!m) return;
  if (S.respect < m.respect) { showMessage('Lucia: earn ' + m.respect + ' respect first (races & jobs).', 3); return; }
  S.mission = m; S.missionStage = 0; S.intimidateUsed = false; S.carrying = false;
  if (m.kind === 'race') { startRace(RACES[0]); completeMission(); return; }
  if (['showdown', 'raid'].includes(m.kind)) {
    S.guardsLeft = m.kind === 'raid' ? 5 : 4; S.target = m.to;
    for (let i = 0; i < S.guardsLeft; i++) {
      const g = { id: 900 + i, x: m.to[0] + (rng() - 0.5) * 220, y: m.to[1] + (rng() - 0.5) * 220, angle: rng() * 6.3, speed: 20, hp: 40, flee: 0, shirt: '#a33', wander: 0, guard: true, dead: false };
      S.peds.push(g);
    }
    S.objectiveText = 'Clear the crew at ' + districtAt(m.to[0], m.to[1]).name + ' — ' + S.guardsLeft + ' left';
  } else if (m.kind === 'escape') { addWanted(2); S.target = m.to; S.objectiveText = 'Lose the PDB, then reach the safe corner'; }
  else if (m.kind === 'pickup') { S.target = m.from; S.objectiveText = 'Pick up the package marked in gold'; }
  else { S.target = m.to; S.objectiveText = m.kind === 'escort' ? 'Drive Alba safely to the gold marker' : 'Reach the gold marker'; }
  showMessage(m.title + ' — ' + m.brief, 5);
}
export function completeMission() {
  const m = S.mission || currentMission(); if (!m) return;
  S.cash += m.pay; S.respect += 40; S.missionIndex += 1; S.mission = null; S.target = null; S.carrying = false;
  S.sound.pickup(); showMessage('Mission complete: +$' + m.pay + ' — respect up. ' + (currentMission() ? 'Next: ' + currentMission().title : 'Story done — free roam!'), 5);
  storeSave(S);
}
export function addWanted(n) {
  S.wanted = Math.min(5, S.wanted + n); S.hiddenTime = 0;
  if (S.wanted >= 3) spawnRoadblocks();
  if (S.wanted >= 5 && !S.heli) S.heli = makeHelicopter(S.player.x + 300, S.player.y - 300);
}
export function spawnRoadblocks() {
  S.roadblocks = [];
  const ahead = nearestRoadPoint(S.player.x + Math.cos(S.player.angle) * 420, S.player.y + Math.sin(S.player.angle) * 420);
  for (let i = -1; i <= 1; i++) {
    const c = makePolice(ahead.x + i * 34, ahead.y + (i % 2) * 30, rng, false); c.parkedBlock = true; c.angle = Math.PI / 4;
    S.roadblocks.push(c);
  }
}
export function startRace(race) {
  if (S.race) return;
  S.race = { ...race, checkpoint: 0, elapsed: 0, started: S.time };
  S.raceCars = [];
  for (let i = 0; i < 2; i++) { const c = makeCar(race.points[0][0] - 60, race.points[0][1] + 40 + i * 36, 0, rng, 'racer'); c.checkpoint = 0; S.raceCars.push(c); }
  S.target = race.points[0]; showMessage('RACE: ' + race.name + ' — beat both rivals to the checkpoints!', 4);
}
export function buyAt(shop) {
  if (shop.kind === 'garage') {
    for (const u of UPGRADES) if (!S.upgrades[u.id] && S.cash >= u.price) { S.cash -= u.price; S.upgrades[u.id] = true; showMessage('Garage: fitted ' + u.name + ' (-$' + u.price + ')'); storeSave(S); return; }
    showMessage('Garage: all upgrades fitted, or not enough cash.');
  } else if (shop.kind === 'shop') {
    if (S.cash >= 120) { S.cash -= 120; S.player.armour = 100; S.ammo.brasa9 += 40; S.ammo.cazadora += 10; S.player.hp = Math.min(100, S.player.hp + 40); showMessage('Shop: vest, ammo and a hot meal (-$120)'); storeSave(S); }
    else showMessage('Shop: need $120.');
  } else if (shop.kind === 'safehouse') {
    if (S.cash >= 150 && S.wanted > 0) { S.cash -= 150; clearWanted(); showMessage('Casa Ferran: heat cleared (-$150)'); }
    else if (!S.mission && currentMission()) startMission();
    else showMessage('Casa Ferran: rest here. No heat to clear.');
  }
}
export function clearWanted() { S.wanted = 0; S.police = []; S.roadblocks = []; S.heli = null; S.bustedTimer = 0; }

function respawn(fine, dead) {
  S.lastFine = fine; S.cash = Math.max(0, S.cash - fine); clearWanted();
  S.player.x = 800; S.player.y = 1180; S.player.hp = 100; S.car = null;
  S.screen = dead ? 'dead' : 'busted'; storeSave(S);
}

// ---------- input ----------
addEventListener('keydown', (e) => {
  S.keys[e.key.toLowerCase()] = true;
  if (['tab', ' '].includes(e.key.toLowerCase()) || e.key === 'Tab') e.preventDefault();
  if (e.key === 'Enter' && S.screen !== 'play') { S.screen = 'play'; if (!S.mission && currentMission()) startMission(); S.sound.ensure(); }
  if ((e.key.toLowerCase() === 'p' || e.key === 'Escape') && (S.screen === 'play' || S.screen === 'pause')) S.screen = S.screen === 'play' ? 'pause' : 'play';
  if (S.screen !== 'play') return;
  const k = e.key.toLowerCase();
  if (k === 'q' || e.key === 'Tab') { S.weapon = (S.weapon + 1) % WEAPONS.length; S.wheelOpen = true; setTimeout(() => { S.wheelOpen = false; }, 900); S.sound.ui(); }
  if (k === 'r') { const n = S.sound.cycleRadio(); showMessage('Radio: ' + (n || S.sound.radioName()), 2); }
  if (k === 'e') tryEnterOrUse();
  if (k === 'f') { if (!S.car) fireWeapon(); else tryCrew('mina'); }
  if (k === 'g') tryCrew('toro');
  if (k === 'h') tryCrew('alba');
});
addEventListener('keyup', (e) => { S.keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); S.mouse.x = (e.clientX - r.left) * 1280 / r.width; S.mouse.y = (e.clientY - r.top) * 720 / r.height; });
canvas.addEventListener('mousedown', () => { S.mouse.down = true; if (S.screen === 'play' && !S.car) fireWeapon(); });
addEventListener('mouseup', () => { S.mouse.down = false; });

function tryEnterOrUse() {
  if (S.car) { S.player.x = S.car.x + 34; S.player.y = S.car.y; S.car = null; return; }
  for (const shop of SHOPS) if (Math.hypot(S.player.x - shop.x, S.player.y - shop.y) < 90) { buyAt(shop); return; }
  for (const race of RACES) if (Math.hypot(S.player.x - race.points[0][0], S.player.y - race.points[0][1]) < 80) { startRace(race); return; }
  let best = null; let bd = 64;
  for (const c of S.cars.concat(S.police, S.roadblocks)) { const d = Math.hypot(c.x - S.player.x, c.y - S.player.y); if (!c.dead && d < bd) { bd = d; best = c; } }
  if (best) {
    S.car = best; best.driver = true;
    if (best.kind === 'police' || best.wasStolen) addWanted(1);
    best.wasStolen = true; showMessage('Car taken — drive with WASD, Shift nitro' + (S.upgrades.nitro ? ' ready' : ' (garage upgrade)'), 2);
  }
}
function tryCrew(id) {
  if (S.crewCooldown[id] > 0) { showMessage('Crew recharging…', 1.5); return; }
  if (id === 'mina') { if (S.car && S.car.hp < 100) { S.car.hp = Math.min(100, S.car.hp + 45); S.car.smoking = false; S.car.burning = 0; showMessage('Mina: field repair done'); S.crewCooldown.mina = 20; } else showMessage('Mina: nothing to repair', 1.5); }
  if (id === 'toro') { if (S.wanted > 0 && S.mission && !S.intimidateUsed) { S.wanted = Math.max(0, S.wanted - 1); S.intimidateUsed = true; S.crewCooldown.toro = 30; showMessage('Toro leans in. One star melts away.'); } else showMessage('Toro: once per mission, and only with heat', 1.5); }
  if (id === 'alba') { S.revealUntil = S.time + 12; S.crewCooldown.alba = 18; showMessage('Alba: police blips revealed beyond the minimap edge'); }
  S.sound.ui();
}
export function fireWeapon() {
  if (S.fireCooldown > 0) return;
  const w = WEAPONS[S.weapon];
  if (w.ammo !== Infinity && (S.ammo[w.id] || 0) <= 0) { showMessage('No ammo — visit Tienda Sol', 2); return; }
  if (w.ammo !== Infinity) S.ammo[w.id] -= 1;
  S.fireCooldown = w.cooldown; S.muzzle = 0.07; S.sound.shot(w.id);
  const base = Math.atan2(S.mouse.y - 360, S.mouse.x - 640);
  S.aim = base;
  for (let p = 0; p < w.pellets; p++) {
    const a = base + (rng() - 0.5) * 2 * w.spread * 3;
    const tx = S.player.x + Math.cos(a) * w.range; const ty = S.player.y + Math.sin(a) * w.range;
    let hitDist = w.range; let hitPed = null; let hitCar = null;
    for (const ped of S.peds) { if (ped.dead) continue; const d = Math.hypot(ped.x - S.player.x, ped.y - S.player.y); const pa = Math.atan2(ped.y - S.player.y, ped.x - S.player.x); if (d < hitDist && Math.abs(((pa - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.14) { hitDist = d; hitPed = ped; } }
    for (const c of S.cars.concat(S.police)) { if (c.dead || c === S.car) continue; const d = Math.hypot(c.x - S.player.x, c.y - S.player.y); const pa = Math.atan2(c.y - S.player.y, c.x - S.player.x); if (d < hitDist && Math.abs(((pa - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.12) { hitDist = d; hitCar = c; hitPed = null; } }
    const ex = S.player.x + Math.cos(a) * hitDist; const ey = S.player.y + Math.sin(a) * hitDist;
    if (coverAt(S.city, (S.player.x + ex) / 2, (S.player.y + ey) / 2) && hitDist > 60) { S.shotsFx.push({ x: ex, y: ey, t: 0.15, blocked: true }); continue; }
    S.shotsFx.push({ x: ex, y: ey, t: 0.15, blocked: false });
    if (hitPed) damagePed(hitPed, w.damage);
    if (hitCar) damageCar(hitCar, w.damage);
  }
  if (w.range > 100) addWanted(1);
}
export function damagePed(ped, dmg) {
  ped.hp -= dmg; ped.flee = 5;
  if (ped.hp <= 0 && !ped.dead) {
    ped.dead = true;
    if (ped.guard && S.mission) { S.guardsLeft -= 1; S.objectiveText = 'Clear the crew — ' + Math.max(0, S.guardsLeft) + ' left'; if (S.guardsLeft <= 0) completeMission(); }
    else addWanted(1);
  }
}
export function damageCar(car, dmg) {
  car.hp -= dmg; if (car.hp < 55) car.smoking = true;
  if (car.hp <= 20 && car.burning <= 0) car.burning = 2.2;
  if (car.hp <= 0 && !car.dead) explodeCar(car);
}
export function explodeCar(car) {
  car.dead = true; car.burning = 0; S.sound.explosion();
  S.shotsFx.push({ x: car.x, y: car.y, t: 0.5, boom: true });
  for (const other of S.cars.concat(S.police)) if (other !== car && !other.dead && Math.hypot(other.x - car.x, other.y - car.y) < 95) damageCar(other, 45);
  if (Math.hypot(S.player.x - car.x, S.player.y - car.y) < 85 && S.car !== car) hurtPlayer(26);
  if (S.car === car) { hurtPlayer(35); S.car = null; }
  addWanted(1);
}
export function hurtPlayer(dmg) {
  if (S.player.armour > 0) { const absorbed = Math.min(S.player.armour, dmg * 0.6); S.player.armour -= absorbed; dmg -= absorbed; }
  S.player.hp -= dmg;
  if (S.player.hp <= 0) respawn(100, true);
}

// ---------- update ----------
function update(dt) {
  S.time += dt;
  for (const k in S.crewCooldown) S.crewCooldown[k] = Math.max(0, S.crewCooldown[k] - dt);
  S.fireCooldown = Math.max(0, S.fireCooldown - dt); S.muzzle = Math.max(0, S.muzzle - dt);
  for (const fx of S.shotsFx) fx.t -= dt; S.shotsFx = S.shotsFx.filter((f) => f.t > 0);
  const p = S.player;
  const inCar = !!S.car;
  // movement
  let mx = (S.keys['d'] ? 1 : 0) - (S.keys['a'] ? 1 : 0);
  let my = (S.keys['s'] ? 1 : 0) - (S.keys['w'] ? 1 : 0);
  if (inCar) {
    const car = S.car; const engineBoost = S.upgrades.engine ? 1.18 : 1;
    if (S.keys['w']) car.speed = Math.min(255 * engineBoost, car.speed + 190 * dt);
    else if (S.keys['s']) car.speed = Math.max(-90, car.speed - 170 * dt);
    else car.speed *= Math.pow(0.4, dt);
    if (S.keys['shift'] && S.upgrades.nitro && S.keys['w']) car.speed = Math.min(340, car.speed + 260 * dt);
    const steer = (S.keys['a'] ? -1 : 0) + (S.keys['d'] ? 1 : 0);
    if (Math.abs(car.speed) > 4) car.angle += steer * dt * 1.9 * Math.sign(car.speed);
    const nx = car.x + Math.cos(car.angle) * car.speed * dt; const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!collideBuildings(S.city, nx, ny, 20) && nx > 20 && ny > 20 && nx < WORLD.width - 20 && ny < WORLD.height - 20) { car.x = nx; car.y = ny; }
    else { if (Math.abs(car.speed) > 120) { damageCar(car, 9); addWanted(0); } car.speed *= -0.25; }
    p.x = car.x; p.y = car.y; p.angle = car.angle;
    S.sound.engine(car.speed);
    for (const ped of S.peds) if (!ped.dead && Math.hypot(ped.x - car.x, ped.y - car.y) < 24 && Math.abs(car.speed) > 60) { damagePed(ped, 60); showMessage('That was a person. The PDB noticed.', 2); }
    for (const other of S.cars) if (other !== car && !other.dead && Math.hypot(other.x - car.x, other.y - car.y) < 40) { damageCar(other, Math.abs(car.speed) * 0.05); car.speed *= 0.6; }
  } else if (mx || my) {
    const len = Math.hypot(mx, my); const sp = 168;
    const nx = p.x + mx / len * sp * dt; const ny = p.y + my / len * sp * dt;
    if (!collideBuildings(S.city, nx, p.y, 11)) p.x = nx;
    if (!collideBuildings(S.city, p.x, ny, 11)) p.y = ny;
    p.x = Math.max(14, Math.min(WORLD.width - 14, p.x)); p.y = Math.max(14, Math.min(WORLD.height - 14, p.y));
    p.angle = Math.atan2(my, mx);
  }
  if (S.mouse.down && !inCar && WEAPONS[S.weapon].id !== 'fists') fireWeapon();
  // traffic AI: follow roads, turn at junctions, flee gunfire nearby
  for (const c of S.cars) {
    if (c.dead || c === S.car || c.kind === 'parked') continue;
    c.aiTimer -= dt;
    if (!isRoad(c.x, c.y)) { const t = nearestRoadPoint(c.x, c.y); c.angle = Math.atan2(t.y - c.y, t.x - c.x); c.speed = 55; }
    else {
      if (c.aiTimer <= 0) { c.aiTimer = 1.6 + rng() * 2; if (rng() < 0.3) c.angle = Math.round(c.angle / (Math.PI / 2)) * (Math.PI / 2) + (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2); c.angle = Math.round(c.angle / (Math.PI / 2)) * (Math.PI / 2); }
      c.speed = Math.min(105, c.speed + 60 * dt);
    }
    c.x += Math.cos(c.angle) * c.speed * dt; c.y += Math.sin(c.angle) * c.speed * dt;
    if (c.x < 30 || c.y < 30 || c.x > WORLD.width - 30 || c.y > WORLD.height - 30) { c.angle += Math.PI; c.x = Math.max(30, Math.min(WORLD.width - 30, c.x)); c.y = Math.max(30, Math.min(WORLD.height - 30, c.y)); }
    if (c.burning > 0) { c.burning -= dt; if (c.burning <= 0) explodeCar(c); }
  }
  // pedestrians stroll and flee
  for (const ped of S.peds) {
    if (ped.dead) continue;
    ped.wander -= dt;
    const dPlayer = Math.hypot(p.x - ped.x, p.y - ped.y);
    if (ped.flee > 0 || (S.muzzle > 0 && dPlayer < 240)) { ped.flee = Math.max(ped.flee - dt, 2); ped.angle = Math.atan2(ped.y - p.y, ped.x - p.x); ped.x += Math.cos(ped.angle) * 120 * dt; ped.y += Math.sin(ped.angle) * 120 * dt; }
    else if (ped.guard) { if (dPlayer < 300) { ped.angle = Math.atan2(p.y - ped.y, p.x - ped.x); if (dPlayer > 130) { ped.x += Math.cos(ped.angle) * 55 * dt; ped.y += Math.sin(ped.angle) * 55 * dt; } else if (Math.random() < dt * 0.7) { hurtPlayer(6); S.shotsFx.push({ x: p.x, y: p.y, t: 0.12, blocked: false }); } } }
    else { if (ped.wander <= 0) { ped.wander = 2 + rng() * 3; ped.angle = rng() * Math.PI * 2; } ped.x += Math.cos(ped.angle) * ped.speed * dt; ped.y += Math.sin(ped.angle) * ped.speed * dt; }
    ped.x = Math.max(16, Math.min(WORLD.width - 16, ped.x)); ped.y = Math.max(16, Math.min(WORLD.height - 16, ped.y));
  }
  updateWanted(dt);
  updateMission(dt);
  updateRace(dt);
  // camera: smooth follow with lookahead
  const look = inCar ? 0.35 : 0.12;
  const tx = p.x + Math.cos(p.angle) * (inCar ? Math.abs(S.car.speed) * look : 20) - 640;
  const ty = p.y + Math.sin(p.angle) * (inCar ? Math.abs(S.car.speed) * look : 20) - 360;
  S.cam.x += (tx - S.cam.x) * Math.min(1, dt * 5); S.cam.y += (ty - S.cam.y) * Math.min(1, dt * 5);
  S.cam.x = Math.max(0, Math.min(WORLD.width - 1280, S.cam.x)); S.cam.y = Math.max(0, Math.min(WORLD.height - 720, S.cam.y));
}

function updateWanted(dt) {
  // spawn patrols to match wanted level
  const want = S.wanted === 0 ? 0 : 1 + S.wanted;
  if (S.wanted > 0 && S.police.length < want && Math.random() < dt * 1.4) {
    const a = rng() * Math.PI * 2; const ram = S.wanted >= 4 && S.police.some((c) => !c.ram) && rng() < 0.6;
    S.police.push(makePolice(S.player.x + Math.cos(a) * 620, S.player.y + Math.sin(a) * 620, rng, ram));
    if (Math.random() < 0.4) S.sound.siren();
  }
  if (S.wanted >= 3 && S.roadblocks.length === 0 && Math.random() < dt * 0.25) spawnRoadblocks();
  if (S.wanted >= 5 && !S.heli) S.heli = makeHelicopter(S.player.x + 260, S.player.y - 260);
  if (S.wanted < 5) S.heli = null;
  let seen = false;
  for (const c of S.police.concat(S.roadblocks)) {
    if (c.dead) continue;
    if (c.burning > 0) { c.burning -= dt; if (c.burning <= 0) explodeCar(c); continue; }
    if (c.parkedBlock) continue;
    const d = Math.hypot(S.player.x - c.x, S.player.y - c.y);
    if (d < 520) seen = true;
    const targetAngle = Math.atan2(S.player.y - c.y, S.player.x - c.x);
    let diff = ((targetAngle - c.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    c.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
    const top = c.ram ? 285 : 248;
    c.speed = Math.min(top, c.speed + 200 * dt);
    // RAM/PIT: aim at a point beside the player's rear quarter to spin them
    let aimX = S.player.x; let aimY = S.player.y;
    if (c.ram && S.car) { aimX = S.player.x - Math.cos(S.car.angle) * 26 + Math.cos(S.car.angle + Math.PI / 2) * 20; aimY = S.player.y - Math.sin(S.car.angle) * 26 + Math.sin(S.car.angle + Math.PI / 2) * 20; }
    if (d < 46 && S.car && c.ram) { S.car.angle += 1.5 * dt * 4; S.car.speed *= 0.82; damageCar(S.car, 8 * dt * 4); }
    c.x += Math.cos(c.angle) * c.speed * dt; c.y += Math.sin(c.angle) * c.speed * dt;
    c.x = Math.max(20, Math.min(WORLD.width - 20, c.x)); c.y = Math.max(20, Math.min(WORLD.height - 20, c.y));
  }
  if (S.heli) {
    S.heli.orbit += dt * 0.7;
    S.heli.x = S.player.x + Math.cos(S.heli.orbit) * 190; S.heli.y = S.player.y + Math.sin(S.heli.orbit) * 150;
    S.heli.angle = S.heli.orbit + Math.PI / 2; seen = true;
  }
  // busted: held slow and close; hiding decays stars
  const nearCop = S.police.some((c) => !c.dead && Math.hypot(c.x - S.player.x, c.y - S.player.y) < 74);
  const mySpeed = S.car ? Math.abs(S.car.speed) : (S.keys['w'] || S.keys['a'] || S.keys['s'] || S.keys['d'] ? 150 : 0);
  if (S.wanted > 0 && nearCop && mySpeed < 42) { S.bustedTimer += dt; if (S.bustedTimer > 2.2) { respawn(120 + S.wanted * 60, false); return; } }
  else S.bustedTimer = Math.max(0, S.bustedTimer - dt);
  if (S.wanted > 0 && !seen) { S.hiddenTime += dt; if (S.hiddenTime > 7) { S.wanted -= 1; S.hiddenTime = 0; if (S.wanted === 0) clearWanted(); else { S.police = S.police.slice(0, Math.max(0, S.police.length - 2)); if (S.wanted < 3) S.roadblocks = []; if (S.wanted < 5) S.heli = null; } showMessage('Heat fading — stars decay while you stay hidden', 2); } }
  else S.hiddenTime = Math.max(0, S.hiddenTime - dt * 2);
}

function updateMission(dt) {
  const m = S.mission; if (!m || !S.target) return;
  const d = Math.hypot(S.player.x - S.target[0], S.player.y - S.target[1]);
  if (m.kind === 'pickup' && S.missionStage === 0 && d < 52) { S.carrying = true; S.missionStage = 1; S.target = m.to; S.objectiveText = 'Package aboard — deliver it to Lucia'; S.sound.pickup(); return; }
  if (m.kind === 'escape') { if (S.wanted === 0 && d < 70) completeMission(); else if (S.wanted === 0) S.objectiveText = 'Heat lost — reach the safe corner'; return; }
  if (['delivery', 'decoy', 'heist', 'convoy', 'escort'].includes(m.kind) && d < 64) {
    if (m.kind === 'heist' || m.kind === 'convoy') addWanted(m.kind === 'heist' ? 3 : 4);
    completeMission(); return;
  }
  if (m.kind === 'pickup' && S.missionStage === 1 && d < 64) completeMission();
}
function updateRace(dt) {
  const r = S.race; if (!r) return;
  r.elapsed += dt;
  const cp = r.points[r.checkpoint];
  if (S.car && Math.hypot(S.player.x - cp[0], S.player.y - cp[1]) < 78) {
    r.checkpoint += 1; S.sound.pickup();
    if (r.checkpoint >= r.points.length) {
      const t = Math.round(r.elapsed * 10) / 10;
      if (!S.bestTimes[r.id] || t < S.bestTimes[r.id]) S.bestTimes[r.id] = t;
      S.cash += 200; S.respect += 25; showMessage('Race won! ' + t + 's — best ' + S.bestTimes[r.id] + 's, +$200', 5);
      S.race = null; S.target = null; storeSave(S); return;
    }
    S.target = r.points[r.checkpoint];
  }
  for (const c of S.raceCars) {
    if (c.finished) continue;
    const target = r.points[c.checkpoint % r.points.length];
    const a = Math.atan2(target[1] - c.y, target[0] - c.x);
    c.angle = a; c.speed = 205; c.x += Math.cos(a) * c.speed * dt; c.y += Math.sin(a) * c.speed * dt;
    if (Math.hypot(c.x - target[0], c.y - target[1]) < 70) { c.checkpoint += 1; if (c.checkpoint >= r.points.length) { c.finished = true; if (S.race) { showMessage('A rival finished first — race lost. Try again at a race start.', 4); S.race = null; S.target = null; } } }
  }
}

// ---------- render ----------
function render() {
  drawWorld(ctx, S, S.cam);
  // shop markers
  for (const shop of SHOPS) {
    const x = shop.x - S.cam.x; const y = shop.y - S.cam.y;
    ctx.fillStyle = shop.kind === 'garage' ? '#5aa2e7' : shop.kind === 'shop' ? '#2ecc71' : '#ffd94a';
    ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill();
    ctx.fillStyle = '#14101c'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(shop.kind.toUpperCase(), x, y + 3); ctx.textAlign = 'left';
    ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText(shop.name + ' (E)', x - 52, y - 26);
  }
  if (S.target) {
    const x = S.target[0] - S.cam.x; const y = S.target[1] - S.cam.y;
    ctx.strokeStyle = '#ffd94a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 24 + Math.sin(S.time * 4) * 5, 0, 7); ctx.stroke();
    ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('OBJECTIVE', x, y - 34); ctx.textAlign = 'left';
  }
  for (const c of S.cars) drawCar(ctx, c, S.cam, false);
  for (const c of S.police) drawCar(ctx, c, S.cam, false);
  for (const c of S.roadblocks) drawCar(ctx, c, S.cam, false);
  for (const c of S.raceCars) drawCar(ctx, c, S.cam, false);
  for (const ped of S.peds) if (!ped.dead) drawPed(ctx, ped, S.cam, false);
  drawHelicopter(ctx, S, S.cam);
  if (S.car) drawCar(ctx, S.car, S.cam, true); else drawPed(ctx, { ...S.player, shirt: '#ffd94a' }, S.cam, true);
  // muzzle flash + hit sparks + explosions
  if (S.muzzle > 0 && !S.car) {
    const fx = S.player.x - S.cam.x + Math.cos(S.aim) * 22; const fy = S.player.y - S.cam.y + Math.sin(S.aim) * 22;
    ctx.fillStyle = 'rgba(255,220,90,.95)'; ctx.beginPath(); ctx.arc(fx, fy, 10, 0, 7); ctx.fill();
  }
  for (const fx of S.shotsFx) {
    ctx.fillStyle = fx.boom ? 'rgba(255,120,20,.8)' : fx.blocked ? 'rgba(200,200,200,.8)' : 'rgba(255,240,150,.9)';
    ctx.beginPath(); ctx.arc(fx.x - S.cam.x, fx.y - S.cam.y, fx.boom ? 52 : 6, 0, 7); ctx.fill();
  }
  drawHUD(ctx, S);
  drawMenus(ctx, S);
}

// ---------- boot: screenshot scenes or live play ----------
const shotName = params.get('shot');
if (shotName) {
  stageShot(shotName, S, { startMission, addWanted, startRace, makePolice, rng });
  render();
  window.__shotReady = true;
} else {
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (S.screen === 'play') update(dt);
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
export { S as state };
