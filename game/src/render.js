// Rendering: golden-hour city, soft shadows, entities, HUD, minimap, menus.
import { WORLD, DISTRICTS, STREET_NAMES, WEAPONS, CREW, RESPECT_RANKS, POLICE_NAME } from './config.js';
import { districtAt } from './world.js';

export function rankFor(respect) {
  let r = RESPECT_RANKS[0];
  for (const k of RESPECT_RANKS) if (respect >= k.need) r = k;
  return r;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}

export function drawWorld(ctx, S, cam) {
  const { city } = S;
  // ground: district tints
  for (const d of DISTRICTS) { ctx.fillStyle = d.tint; ctx.fillRect(d.x - cam.x, d.y - cam.y, d.w, d.h); }
  // sea + beach on the east edge
  const seaGrad = ctx.createLinearGradient(2860 - cam.x, 0, WORLD.width - cam.x, 0);
  seaGrad.addColorStop(0, '#f2d98c'); seaGrad.addColorStop(0.25, '#7ec8c0'); seaGrad.addColorStop(1, '#2a7a9a');
  ctx.fillStyle = seaGrad; ctx.fillRect(2860 - cam.x, -cam.y, WORLD.width - 2860, WORLD.height);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let y = 40; y < WORLD.height; y += 90) ctx.fillRect(2960 - cam.x + Math.sin(y * 0.05 + S.time) * 8, y - cam.y, 120, 4);
  // roads
  ctx.fillStyle = '#4a4048';
  for (let x = 200; x < WORLD.width; x += WORLD.roadEvery) ctx.fillRect(x - WORLD.roadWidth / 2 - cam.x, -cam.y, WORLD.roadWidth, WORLD.height);
  for (let y = 200; y < WORLD.height; y += WORLD.roadEvery) ctx.fillRect(-cam.x, y - WORLD.roadWidth / 2 - cam.y, 2900, WORLD.roadWidth);
  ctx.strokeStyle = 'rgba(255,220,120,.75)'; ctx.setLineDash([18, 16]); ctx.lineWidth = 3;
  for (let x = 200; x < 2900; x += WORLD.roadEvery) { ctx.beginPath(); ctx.moveTo(x - cam.x, -cam.y); ctx.lineTo(x - cam.x, WORLD.height - cam.y); ctx.stroke(); }
  for (let y = 200; y < WORLD.height; y += WORLD.roadEvery) { ctx.beginPath(); ctx.moveTo(-cam.x, y - cam.y); ctx.lineTo(2900 - cam.x, y - cam.y); ctx.stroke(); }
  ctx.setLineDash([]);
  // street names
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  STREET_NAMES.forEach((n, i) => { const x = 200 + i * WORLD.roadEvery; if (x < 2900) ctx.fillText(n, x - cam.x, 120 - cam.y); });
  // soft shadows then buildings
  for (const b of city.buildings) {
    if (b.x - cam.x < -180 || b.y - cam.y < -180 || b.x - cam.x > 1460 || b.y - cam.y > 900) continue;
    ctx.fillStyle = 'rgba(60,20,40,.28)'; ctx.fillRect(b.x - cam.x + 14, b.y - cam.y + 16, b.w, b.h);
    ctx.fillStyle = b.color; ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, 10);
    ctx.fillStyle = '#fff2cf'; ctx.font = 'bold 10px sans-serif';
    if (b.w > 84) ctx.fillText(b.sign, b.x - cam.x + b.w / 2, b.y - cam.y + b.h / 2 + 3);
  }
  // crates (cover)
  for (const c of city.crates) {
    ctx.fillStyle = 'rgba(60,20,40,.25)'; ctx.fillRect(c.x - cam.x - 14, c.y - cam.y - 8, 36, 36);
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(c.x - cam.x - 17, c.y - cam.y - 17, 34, 34);
    ctx.strokeStyle = '#5e4520'; ctx.strokeRect(c.x - cam.x - 17, c.y - cam.y - 17, 34, 34);
  }
  // palms
  for (const p of city.palms) {
    if (p.x - cam.x < -60 || p.y - cam.y < -60 || p.x - cam.x > 1340 || p.y - cam.y > 780) continue;
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(p.x - cam.x, p.y - cam.y); ctx.lineTo(p.x - cam.x + 5, p.y - cam.y - 16 * p.s); ctx.stroke();
    ctx.strokeStyle = '#2e8a4a'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.4; ctx.beginPath(); ctx.moveTo(p.x - cam.x + 5, p.y - cam.y - 16 * p.s); ctx.lineTo(p.x - cam.x + 5 + Math.cos(a) * 18 * p.s, p.y - cam.y - 16 * p.s + Math.sin(a) * 7 * p.s); ctx.stroke(); }
  }
  // golden-hour wash
  const wash = ctx.createLinearGradient(0, 0, 1280, 720);
  wash.addColorStop(0, 'rgba(255,150,60,.10)'); wash.addColorStop(1, 'rgba(120,40,120,.10)');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, 1280, 720);
}

export function drawCar(ctx, car, cam, isPlayer = false) {
  const x = car.x - cam.x; const y = car.y - cam.y;
  if (x < -90 || y < -90 || x > 1370 || y > 810) return;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(40,10,30,.30)'; ctx.fillRect(-car.w / 2 + 5, -car.h / 2 + 7, car.w, car.h);
  ctx.rotate(car.angle);
  ctx.fillStyle = car.dead ? '#333' : car.color; roundRect(ctx, -car.w / 2, -car.h / 2, car.w, car.h, 7); ctx.fill();
  ctx.fillStyle = '#bfe8f2'; ctx.fillRect(-6, -car.h / 2 + 4, 16, car.h - 8);
  ctx.fillStyle = '#222'; ctx.fillRect(-car.w / 2 + 3, -car.h / 2 - 3, 9, 6); ctx.fillRect(-car.w / 2 + 3, car.h / 2 - 3, 9, 6);
  ctx.fillRect(car.w / 2 - 12, -car.h / 2 - 3, 9, 6); ctx.fillRect(car.w / 2 - 12, car.h / 2 - 3, 9, 6);
  if (car.kind === 'police') { ctx.fillStyle = '#fff'; ctx.fillRect(-14, -5, 28, 10); ctx.fillStyle = '#d33'; ctx.fillRect(-14, -5, 7, 10); ctx.fillStyle = '#36c'; ctx.fillRect(7, -5, 7, 10); }
  if (car.ram) { ctx.fillStyle = '#d33'; ctx.fillRect(car.w / 2 - 4, -car.h / 2, 4, car.h); }
  if (isPlayer) { ctx.fillStyle = '#ffd94a'; ctx.beginPath(); ctx.moveTo(0, -car.h / 2 - 14); ctx.lineTo(-6, -car.h / 2 - 24); ctx.lineTo(6, -car.h / 2 - 24); ctx.fill(); }
  ctx.restore();
  if (car.smoking || car.hp < 55) { ctx.fillStyle = 'rgba(80,80,80,.55)'; ctx.beginPath(); ctx.arc(x + Math.sin(performance.now() / 200 + car.id) * 4, y - 18, 8 + (55 - Math.min(car.hp, 55)) * 0.15, 0, 7); ctx.fill(); }
  if (car.burning > 0) { ctx.fillStyle = 'rgba(255,110,20,.85)'; ctx.beginPath(); ctx.arc(x, y - 6, 16 + Math.sin(performance.now() / 60) * 4, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,210,60,.9)'; ctx.beginPath(); ctx.arc(x, y - 10, 8, 0, 7); ctx.fill(); }
}

export function drawPed(ctx, p, cam, isPlayer = false) {
  const x = p.x - cam.x; const y = p.y - cam.y;
  if (x < -40 || y < -40 || x > 1320 || y > 760) return;
  ctx.fillStyle = 'rgba(40,10,30,.28)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 5, 9, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = isPlayer ? '#ffd94a' : (p.shirt || '#7ab');
  ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#f2c79a'; ctx.beginPath(); ctx.arc(x + Math.cos(p.angle) * 3, y + Math.sin(p.angle) * 3, 4.5, 0, 7); ctx.fill();
  if (p.guard) { ctx.fillStyle = '#d33'; ctx.fillRect(x - 7, y - 14, 14, 4); }
}

export function drawHelicopter(ctx, S, cam) {
  if (!S.heli) return;
  const h = S.heli; const x = h.x - cam.x; const y = h.y - cam.y;
  // spotlight cone first (under the heli)
  const gx = S.player.x - cam.x; const gy = S.player.y - cam.y;
  const grad = ctx.createRadialGradient(gx, gy, 10, gx, gy, 130);
  grad.addColorStop(0, 'rgba(255,244,180,.42)'); grad.addColorStop(1, 'rgba(255,244,180,0)');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(gx - 110, gy + 60); ctx.lineTo(gx + 110, gy + 60); ctx.fill();
  ctx.beginPath(); ctx.arc(gx, gy, 95, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.rotate(h.angle);
  ctx.fillStyle = '#20304a'; roundRect(ctx, -26, -10, 52, 20, 9); ctx.fill();
  ctx.fillRect(-46, -3, 22, 6);
  ctx.strokeStyle = 'rgba(20,20,20,.8)'; ctx.lineWidth = 3;
  const r = performance.now() / 30;
  ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(Math.cos(r) * 4 - 4, -26); ctx.lineTo(Math.cos(r) * 4 + 4, 26); ctx.stroke();
  ctx.restore();
}

export function drawHUD(ctx, S) {
  const p = S.player;
  ctx.textAlign = 'left';
  // top-left panel: cash, health, armour, weapon
  ctx.fillStyle = 'rgba(16,10,22,.68)'; roundRect(ctx, 14, 14, 300, 118, 10); ctx.fill();
  ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('$' + Math.floor(S.cash), 28, 44);
  ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
  ctx.fillText('Respect ' + Math.floor(S.respect) + ' — ' + rankFor(S.respect).name, 150, 44);
  ctx.fillStyle = '#3a2432'; ctx.fillRect(28, 56, 180, 13);
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(28, 56, 180 * Math.max(0, p.hp) / 100, 13);
  ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText('HEALTH', 214, 67);
  ctx.fillStyle = '#3a2432'; ctx.fillRect(28, 76, 180, 11);
  ctx.fillStyle = '#5aa2e7'; ctx.fillRect(28, 76, 180 * Math.max(0, p.armour) / 100, 11);
  ctx.fillStyle = '#fff'; ctx.fillText('ARMOUR', 214, 85);
  const w = WEAPONS[S.weapon];
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(w.name + (w.ammo === Infinity ? '' : '  ' + Math.max(0, S.ammo[w.id]) + ' rnds'), 28, 112);
  ctx.fillStyle = '#cfe'; ctx.font = '12px sans-serif';
  ctx.fillText('Radio: ' + S.sound.radioName() + ' (R)', 150, 112);
  // wanted stars top-right
  ctx.font = '30px sans-serif'; ctx.textAlign = 'right';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i < S.wanted ? '#ffd94a' : 'rgba(255,255,255,.25)'; ctx.fillText('★', 1252 - (4 - i) * 34, 48); }
  ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
  if (S.wanted > 0) ctx.fillText(POLICE_NAME, 1252, 68);
  ctx.textAlign = 'left';
  // crew icons
  CREW.forEach((c, i) => {
    ctx.fillStyle = S.crewCooldown[c.id] > 0 ? 'rgba(30,30,40,.6)' : 'rgba(255,217,74,.85)';
    roundRect(ctx, 14 + i * 62, 142, 54, 40, 8); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.font = 'bold 11px sans-serif'; ctx.fillText(c.name, 20 + i * 62, 158);
    ctx.font = '9px sans-serif'; ctx.fillText(c.hint, 20 + i * 62, 172);
  });
  // mission tracker
  if (S.mission) {
    ctx.fillStyle = 'rgba(16,10,22,.68)'; roundRect(ctx, 14, 560, 430, 66, 10); ctx.fill();
    ctx.fillStyle = '#ffd94a'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('MISSION: ' + S.mission.title, 28, 584);
    ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
    ctx.fillText(S.objectiveText || '', 28, 606);
  } else if (S.screen === 'play') {
    ctx.fillStyle = 'rgba(16,10,22,.55)'; roundRect(ctx, 14, 560, 430, 44, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
    ctx.fillText('Free roam — visit Casa Ferran or a race start. Lucia has no job pending.', 28, 587);
  }
  if (S.message && S.messageUntil > S.time) {
    ctx.fillStyle = 'rgba(16,10,22,.8)'; roundRect(ctx, 390, 70, 500, 40, 10); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(S.message, 640, 96); ctx.textAlign = 'left';
  }
  if (S.race) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText('RACE ' + S.race.name + ' — checkpoint ' + (S.race.checkpoint + 1) + '/' + S.race.points.length + ' — ' + S.race.elapsed.toFixed(1) + 's', 470, 660);
  }
  drawMinimap(ctx, S);
  if (S.wheelOpen) drawWheel(ctx, S);
}

export function drawMinimap(ctx, S) {
  const mx = 1092; const my = 492; const mw = 174; const mh = 174; const sc = mw / WORLD.width;
  ctx.fillStyle = 'rgba(14,10,20,.78)'; roundRect(ctx, mx - 6, my - 6, mw + 12, mh + 30, 10); ctx.fill();
  for (const d of DISTRICTS) { ctx.fillStyle = d.tint; ctx.globalAlpha = 0.75; ctx.fillRect(mx + d.x * sc, my + d.y * (mh / WORLD.height), d.w * sc, d.h * (mh / WORLD.height)); }
  ctx.globalAlpha = 1; ctx.fillStyle = '#2a7a9a'; ctx.fillRect(mx + 2860 * sc, my, (WORLD.width - 2860) * sc, mh);
  ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif';
  ctx.fillText(districtAt(S.player.x, S.player.y).name, mx + 4, my + mh + 16);
  const dot = (x, y, color, r = 3) => { const px = mx + x * sc; const py = my + y * (mh / WORLD.height); if (px >= mx && px <= mx + mw && py >= my && py <= my + mh) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); } };
  for (const c of S.cars) if (c.kind === 'traffic') dot(c.x, c.y, '#ddd', 2);
  const reveal = S.revealUntil > S.time;
  for (const c of S.police) dot(c.x, c.y, '#ff5252', 3.5);
  if (S.heli) dot(S.heli.x, S.heli.y, '#ff2222', 4);
  if (reveal) for (const c of S.police) dot(c.x + 26, c.y + 26, '#ff9', 2);
  if (S.target) dot(S.target[0], S.target[1], '#ffd94a', 5);
  dot(S.player.x, S.player.y, '#ffffff', 4);
  ctx.strokeStyle = '#ffd94a'; ctx.beginPath(); ctx.arc(mx + S.player.x * sc, my + S.player.y * (mh / WORLD.height), 6, 0, 7); ctx.stroke();
}

export function drawWheel(ctx, S) {
  ctx.fillStyle = 'rgba(10,6,16,.72)'; ctx.beginPath(); ctx.arc(640, 330, 120, 0, 7); ctx.fill();
  WEAPONS.forEach((w, i) => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / WEAPONS.length);
    const x = 640 + Math.cos(a) * 78; const y = 330 + Math.sin(a) * 78;
    ctx.fillStyle = i === S.weapon ? '#ffd94a' : 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fill();
    ctx.fillStyle = i === S.weapon ? '#1a1020' : '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(w.name, x, y + 4);
  });
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif';
  ctx.fillText('WEAPON WHEEL — Q / Tab cycles', 548, 480);
}

export function drawMenus(ctx, S) {
  if (S.screen === 'title') {
    const g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, 'rgba(255,140,60,.88)'); g.addColorStop(0.6, 'rgba(190,60,110,.88)'); g.addColorStop(1, 'rgba(40,16,60,.94)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = 'bold 84px sans-serif'; ctx.fillText('PUERTO BRASA', 640, 240);
    ctx.font = '22px sans-serif'; ctx.fillStyle = '#ffe9a8';
    ctx.fillText('Rafi Solano, driver-for-hire. Seven districts. One name to rebuild.', 640, 292);
    ctx.fillStyle = '#fff'; ctx.font = '17px sans-serif';
    const lines = ['ENTER — start / continue    WASD — move & drive    E — enter / steal car', 'Mouse aim, click or F — fire    Q / Tab — weapon wheel    Shift — nitro (in car)', 'F repair (Mina) · G intimidate (Toro) · H lookout blips (Alba) · R radio · P pause', 'Missions for fixer Lucia Ferran pay cash and district respect: Bronze → Plata → Oro → Leyenda'];
    lines.forEach((l, i) => ctx.fillText(l, 640, 370 + i * 30));
    ctx.font = 'bold 19px sans-serif'; ctx.fillStyle = '#ffd94a'; ctx.fillText('Press ENTER to play', 640, 540);
    ctx.textAlign = 'left';
  }
  if (S.screen === 'pause') {
    ctx.fillStyle = 'rgba(10,6,16,.72)'; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 320); ctx.font = '18px sans-serif'; ctx.fillText('P or Esc to resume — progress is saved automatically', 640, 366); ctx.textAlign = 'left';
  }
  if (S.screen === 'busted') {
    ctx.fillStyle = 'rgba(20,10,40,.78)'; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('BUSTED', 640, 320);
    ctx.fillStyle = '#fff'; ctx.font = '19px sans-serif';
    ctx.fillText('The Policia de Brasa held you. Fine paid: $' + S.lastFine + ' — press ENTER to respawn at Casa Ferran.', 640, 372);
    ctx.textAlign = 'left';
  }
  if (S.screen === 'dead') {
    ctx.fillStyle = 'rgba(40,6,10,.78)'; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('WASTED', 640, 320);
    ctx.fillStyle = '#fff'; ctx.font = '19px sans-serif';
    ctx.fillText('Press ENTER to wake up at Casa Ferran (hospital bill $100).', 640, 372);
    ctx.textAlign = 'left';
  }
}
