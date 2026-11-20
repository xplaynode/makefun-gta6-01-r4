// Puerto Brasa — static game data: the city, its people, its work.
// Every name in this file was invented for this game.

export const WORLD = { width: 3200, height: 2400, roadEvery: 400, roadWidth: 92 };
export const VIEW = { width: 1280, height: 720 };

export const DISTRICTS = [
  { name: 'Puerto Viejo', x: 0, y: 0, w: 1050, h: 780, tint: '#e8b06a' },
  { name: 'Las Palmeras', x: 1050, y: 0, w: 1050, h: 780, tint: '#d9c27a' },
  { name: 'Mercado Alto', x: 2100, y: 0, w: 760, h: 780, tint: '#e59a5f' },
  { name: 'Bahia Azul', x: 0, y: 780, w: 1050, h: 800, tint: '#cfe0a0' },
  { name: 'Colina Dorada', x: 1050, y: 780, w: 1050, h: 800, tint: '#e3cd8a' },
  { name: 'Muelle Sur', x: 2100, y: 780, w: 760, h: 800, tint: '#d8a878' },
  { name: 'Playa Brava', x: 0, y: 1580, w: 2860, h: 820, tint: '#f0d48a' },
];

export const STREET_NAMES = ['Calle Sol', 'Av. Coral', 'Calle Brasa', 'Av. Palma', 'Calle Marea', 'Av. Faro', 'Calle Viento', 'Av. Dorada'];

export const HERO = { name: 'Rafi Solano', fixer: 'Lucia Ferran' };
export const CREW = [
  { id: 'mina', name: 'Mina', role: 'mechanic', key: 'F', hint: 'F repair' },
  { id: 'toro', name: 'Toro', role: 'muscle', key: 'G', hint: 'G intimidate' },
  { id: 'alba', name: 'Alba', role: 'lookout', key: 'H', hint: 'H reveal blips' },
];
export const POLICE_NAME = 'Policia de Brasa (PDB)';

export const WEAPONS = [
  { id: 'fists', name: 'Fists', range: 46, damage: 14, spread: 0, pellets: 1, ammo: Infinity, cooldown: 0.28, auto: false },
  { id: 'pipa', name: 'Pipa', range: 62, damage: 30, spread: 0, pellets: 1, ammo: Infinity, cooldown: 0.38, auto: false },
  { id: 'brasa9', name: 'Brasa-9', range: 430, damage: 22, spread: 0.045, pellets: 1, ammo: 60, cooldown: 0.17, auto: false },
  { id: 'cazadora', name: 'Cazadora', range: 300, damage: 13, spread: 0.16, pellets: 6, ammo: 18, cooldown: 0.7, auto: false },
];

export const RESPECT_RANKS = [
  { name: 'Bronze', need: 0 }, { name: 'Plata', need: 120 },
  { name: 'Oro', need: 300 }, { name: 'Leyenda', need: 560 },
];

// Ten staged story missions: kind drives the objective logic in main.js.
export const MISSIONS = [
  { id: 'm1', title: 'First Package', kind: 'pickup', respect: 0, pay: 220, brief: 'Lucia: grab the package in Puerto Viejo and bring it back to me.', from: [420, 420], to: [1240, 420] },
  { id: 'm2', title: 'Cross-Town Run', kind: 'delivery', respect: 0, pay: 320, brief: 'Lucia: drive the parcel across town to Mercado Alto. Fast, not famous.', from: [1240, 420], to: [2440, 420] },
  { id: 'm3', title: 'Cool the Heat', kind: 'escape', respect: 60, pay: 300, brief: 'The PDB are watching. Draw heat, then lose them out of sight.', from: [1640, 820], to: [840, 1220] },
  { id: 'm4', title: 'Rival Showdown', kind: 'showdown', respect: 120, pay: 450, brief: 'A rival crew holds Bahia Azul corner. Clear them out.', from: [640, 1220], to: [640, 1220] },
  { id: 'm5', title: 'Street-Race Intro', kind: 'race', respect: 180, pay: 400, brief: 'Win the Palmeras circuit and the city starts saying your name right.', from: [1240, 820], to: [1240, 820] },
  { id: 'm6', title: 'Warehouse Raid', kind: 'raid', respect: 240, pay: 600, brief: 'Raid the Muelle Sur warehouse: take the crates, survive the guards.', from: [2440, 1220], to: [2440, 1220] },
  { id: 'm7', title: 'Escort Alba', kind: 'escort', respect: 300, pay: 550, brief: 'Alba rides with you. Get her to Colina Dorada in one piece.', from: [840, 820], to: [1640, 1220] },
  { id: 'm8', title: 'Decoy Run', kind: 'decoy', respect: 360, pay: 650, brief: 'Be the loud car. Pull the PDB west while the real load moves east.', from: [420, 2020], to: [2440, 2020] },
  { id: 'm9', title: 'Dock Heist', kind: 'heist', respect: 440, pay: 900, brief: 'Lift the dock safe at Muelle Sur and outrun whatever answers.', from: [2440, 1420], to: [840, 2020] },
  { id: 'm10', title: 'Finale Convoy', kind: 'convoy', respect: 520, pay: 1500, brief: 'Lucia: one convoy, whole city watching. Bring it home, Rafi.', from: [420, 420], to: [2640, 2020] },
];

export const RACES = [
  { id: 'r1', name: 'Palmeras Circuit', laps: 1, points: [[1240, 820], [2040, 820], [2040, 420], [1240, 420]] },
  { id: 'r2', name: 'Mercado Loop', laps: 1, points: [[2440, 420], [2440, 1220], [1640, 1220], [1640, 420]] },
  { id: 'r3', name: 'Playa Sprint', laps: 1, points: [[420, 2020], [1240, 2020], [2040, 2020], [2640, 2020]] },
];

export const SHOPS = [
  { kind: 'garage', name: 'GARAGE — Taller Mina', x: 1200, y: 760 },
  { kind: 'shop', name: 'SHOP — Tienda Sol', x: 2380, y: 760 },
  { kind: 'safehouse', name: 'SAFEHOUSE — Casa Ferran', x: 800, y: 1180 },
];

export const UPGRADES = [
  { id: 'armour', name: 'Armour', price: 400 }, { id: 'engine', name: 'Engine', price: 500 }, { id: 'nitro', name: 'Nitro', price: 350 },
];
