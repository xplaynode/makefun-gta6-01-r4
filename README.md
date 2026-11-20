[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/xplaynode/makefun-gta6-01-r4/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# Puerto Brasa

A 2D top-down open-world crime game in a sun-soaked coastal city at golden hour, rendered on canvas with soft shadows. You are Rafi Solano, a driver-for-hire rebuilding his name across the seven districts of Puerto Brasa — Puerto Viejo, Las Palmeras, Mercado Alto, Bahia Azul, Colina Dorada, Muelle Sur and Playa Brava — working for fixer Lucia Ferran, with a crew of three: Mina (mechanic, field repair on F), Toro (muscle, intimidation clears one wanted star once per mission on G) and Alba (lookout, reveals police blips beyond the minimap edge on H).

Systems: a road-grid city with named streets, signed buildings, palms, beach and sea; traffic AI and pedestrians who stroll and flee; cars you can steal (E) and drive with a smooth chase camera; a 0–5 star wanted system run by the Policia de Brasa (PDB) with patrol pursuit, roadblocks at 3+ stars, RAM/PIT units at 4+ stars and a helicopter with a moving spotlight cone at 5 stars — get held slow and close and you are busted, hide out of sight and the stars decay; ten staged story missions; four-weapon combat (Fists, Pipa, Brasa-9 pistol, Cazadora shotgun) with mouse aim, muzzle flash, hit sparks, cover crates and cars that smoke, burn and explode in chains; cash, a garage (Armour / Engine / Nitro upgrades), a shop (vest, ammo, health), a safehouse that clears heat, and district respect ranks Bronze → Plata → Oro → Leyenda; three repeatable street races against two AI racers with saved best times; a HUD with cash, health/armour, weapon and ammo, wanted stars, a mission tracker, crew ability icons and a canvas minimap; WebAudio sound effects plus a three-station procedural radio (R); and a localStorage save for cash, respect, mission progress, garage upgrades, ammo and race best times.

## Controls

- WASD — move on foot / drive · Mouse — aim · Click or F — fire (on foot)
- E — enter/steal a car, use a garage/shop/safehouse, start a race
- Q or Tab — cycle the weapon wheel · Shift — nitro while driving (after the garage upgrade)
- F — Mina field repair (in car) · G — Toro intimidation · H — Alba lookout blips
- R — cycle radio · P / Esc — pause · Enter — start, respawn after busted/wasted

## Missions

1. First Package — package pickup in Puerto Viejo
2. Cross-Town Run — delivery to Mercado Alto
3. Cool the Heat — draw PDB heat, then lose it
4. Rival Showdown — clear a rival crew in Bahia Azul
5. Street-Race Intro — win the Palmeras circuit
6. Warehouse Raid — crates and guards at Muelle Sur
7. Escort Alba — drive Alba to Colina Dorada
8. Decoy Run — pull the PDB west across Playa Brava
9. Dock Heist — lift the Muelle Sur dock safe
10. Finale Convoy — bring Lucia's convoy home

After the chain, free roam continues with races, shops and the wanted system live.

## Run it

```sh
node serve.ts            # serves game/ at http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the dossier into out/
```

No build step and no network loads: everything the game uses is under `game/`.
