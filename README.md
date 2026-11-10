# Deadwood Signal

**A pixel zombie survivor created by Georgia Rachel.**

**[Play Deadwood Signal](https://georgiarachel07.github.io/pixel-zombie-survivor/)** · Free in your browser.

Play in a modern desktop or mobile browser. Move with **WASD / arrows**, dash with **Space**, pause with **Escape**. Touch devices have a movement stick and dash button. Weapons aim and fire automatically. Music starts only after a click; toggle it with **Music: off**.

## Run locally

Requires Node.js 18 or later. No package installation or build step is needed.

```sh
npm start
```

Open `http://127.0.0.1:4173`. ES modules require an HTTP server; opening `index.html` directly from the filesystem will not work.

```sh
npm test
npm run check
```

## Play

- Nine heroes: Soldier, Warrior, Archer, Rogue, Mage, Paladin, Ninja, Farmer and Arbalist. Farmer unlocks at 250 lifetime gold, Arbalist at 750.
- Forest terrain and a dungeon with obstacles, rooms and doorways.
- Standard: survive 20 minutes. Quick: survive 10 minutes with double XP and gold. Speedrun: kill 1,000 enemies before a 15-minute countdown expires.
- Collect XP gems and choose one of three upgrades. Weapons and passive items level to five. Carry up to six weapons.
- Boss chests evolve a max-level weapon with its matching passive; recipes are in the in-game Field Guide.
- Gold is banked on death, victory, or extraction from the pause screen. The shop permanently upgrades health, damage, movement speed, pickup radius, and armor. Save data lives in localStorage on the current browser/device; it does not synchronize across devices.
- Original procedural minor-key chiptune music and synthesized effects use the Web Audio API. No external audio samples or copyrighted recordings are bundled.

## Boss events

| Boss | Standard | Quick | Behavior |
|---|---:|---:|---|
| Panzersoldat | 02:00 | 01:00 | Armor, claw drag and telegraphed flame cone |
| Margwa | 05:00 | 02:30 | Three heads; damage only during glowing-mouth windows |
| Pentagon Thief | 08:00 | 04:00 | Steals primary weapon; 12 seconds to defeat before escape. A kill restores its level/evolution; escape returns a level-one weapon. |
| Megaton | 11:00 | 05:30 | Radioactive projectiles; splits into Bomber and Blaster; defeat both for the chest |
| George A. Romero | 15:00 | 07:30 | Health scales with stage/time, enrages when hit, awards Wunderwaffe |

These are unofficial fan-inspired boss names. The project is not affiliated with or endorsed by the owners of any referenced franchise. Artwork, music, and implementation are original; no franchise assets are included.

## Architecture

Native ES modules, HTML5 Canvas 2D, fixed 60 Hz simulation with catch-up limits. `Player.js`, `EnemyManager.js`, `WeaponSystem.js`, `UI.js`, and `FXManager.js` separate the main systems. `SpatialHash.js` uses typed-array linked cell lists for targeting and collision queries. Enemy, projectile, pickup, particle and floating-text pools have fixed capacities. Dungeon navigation uses a shared breadth-first flow field. Sprites are drawn once into cached small canvases. Rendering culls off-screen enemies and pickups.

The enemy pool holds **1,800 simultaneous enemies**. This is a capacity, not a promise of 60 FPS on every device. Actual performance depends on browser, hardware, visible entities and active effects. PixelFX effects are capped at five concurrent live instances.

## PixelFX

`FXManager.js` directly imports the actual [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) core and effects. `createFx`, `createFrame`, `clearFrame` and `composite` update and render live procedural explosions, lightning, holy rings, tornadoes, bullet impacts and disintegration. Vendored modules allow the game to run without a CDN dependency. Source licenses and notices remain in `vendor/pixelfx/`.

## Hosting

This project is a static website. On GitHub: **Settings → Pages → Deploy from a branch → main → / (root)**. It can also be served on any static host. No API keys, database, accounts, payments or backend are required. Optional Google Fonts have system-font fallbacks; gameplay needs no third-party network calls.

## Credits

Creator: **Georgia Rachel**. Original game sprites and procedural music. PixelFX: Patch contributors, MIT; included effects/core also acknowledge Hugo Duprez / Sprite Fusion and rehan-remade / Hollow Crown where applicable. See `THIRD_PARTY_NOTICES.md`.

Development history uses actual creation dates. Project status and verification notes are maintained in `PROJECT_MEMORY.md`.
