// Deterministic screenshot scenes behind ?shot=cover|foot|chase|combat&seed=N.
// Each scene arranges the real game state (cars, police, mission, HUD) and the
// caller renders one frame, then sets window.__shotReady.
import { MISSIONS, RACES } from './config.js';
import { makeCar, makePolice, makeHelicopter } from './entities.js';

export function stageShot(name, S, helpers) {
  const { rng } = helpers;
  S.screen = 'play';
  S.cash = 1840; S.respect = 340;
  S.player.hp = 82; S.player.armour = 55;
  S.ammo = { brasa9: 34, cazadora: 9 };
  if (name === 'cover') {
    // Wide city vista at golden hour, player car mid-street, HUD + minimap visible.
    const car = S.cars[0]; car.x = 1400; car.y = 1000; car.angle = 0; car.color = '#e74c3c';
    S.car = car; S.player.x = car.x; S.player.y = car.y; S.player.angle = 0;
    S.mission = MISSIONS[1]; S.target = MISSIONS[1].to;
    S.objectiveText = 'Drive the parcel to Mercado Alto';
    S.cam.x = Math.max(0, car.x - 640); S.cam.y = Math.max(0, car.y - 360);
    return;
  }
  if (name === 'foot') {
    // On foot mid-mission in Mercado Alto, tracker + respect visible, peds around.
    S.car = null; S.player.x = 2200; S.player.y = 600; S.player.angle = 0.6;
    S.mission = MISSIONS[0]; S.missionStage = 0; S.target = [2320, 520];
    S.objectiveText = 'Pick up the package marked in gold';
    for (let i = 0; i < 8; i++) { const p = S.peds[i]; p.x = 2260 + i * 24; p.y = 540 + (i % 3) * 44; p.guard = false; }
    S.cam.x = Math.max(0, S.player.x - 640); S.cam.y = Math.max(0, S.player.y - 360);
    return;
  }
  if (name === 'chase') {
    // 4-5 star chase: roadblock ahead, RAM unit alongside, helicopter spotlight.
    const car = S.cars[0]; car.x = 1400; car.y = 1000; car.angle = 0; car.speed = 180; car.color = '#3498db';
    S.car = car; S.player.x = car.x; S.player.y = car.y; S.player.angle = 0;
    S.wanted = 5;
    S.police = [makePolice(1130, 950, rng, false), makePolice(1200, 1070, rng, false), makePolice(1440, 1090, rng, true)];
    S.roadblocks = [makePolice(1840, 968, rng, false), makePolice(1840, 1032, rng, false)];
    for (const b of S.roadblocks) b.parkedBlock = true;
    S.heli = makeHelicopter(1580, 830);
    S.mission = MISSIONS[2]; S.target = MISSIONS[2].to;
    S.objectiveText = 'Lose the PDB, then reach the safe corner';
    S.cam.x = Math.max(0, car.x - 520); S.cam.y = Math.max(0, car.y - 360);
    return;
  }
  // combat: weapon wheel open, mid-firefight, burning wreck, cover crates nearby.
  S.car = null; S.player.x = 1000; S.player.y = 1060; S.player.angle = 0.3; S.player.hp = 64; S.player.armour = 30;
  S.weapon = 2; S.wheelOpen = true; S.muzzle = 0.07; S.aim = 0.3;
  const wreck = S.cars[1]; wreck.x = 1420; wreck.y = 920; wreck.burning = 1.5; wreck.smoking = true; wreck.hp = 12;
  const guardCar = S.cars[2]; guardCar.x = 1500; guardCar.y = 1010;
  S.shotsFx.push({ x: 1400, y: 930, t: 9, blocked: false });
  for (let i = 0; i < 3; i++) { const g = S.peds[i]; g.x = 1330 + i * 46; g.y = 1000 + i * 12; g.guard = true; g.shirt = '#a33'; }
  S.city.crates.push({ x: 1090, y: 1120, w: 34, h: 34, hp: 40 }, { x: 1090, y: 1160, w: 34, h: 34, hp: 40 });
  S.mission = MISSIONS[3]; S.target = MISSIONS[3].to; S.guardsLeft = 2;
  S.objectiveText = 'Clear the crew at Bahia Azul — 2 left';
  S.wanted = 2; S.police = [makePolice(760, 940, rng, false)];
  S.cam.x = Math.max(0, S.player.x - 500); S.cam.y = Math.max(0, S.player.y - 360);
}
