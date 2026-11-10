# Deadwood Signal

**A pixel zombie survivor created by Georgia Rachel.**

**[Play Deadwood Signal](https://georgiarachel07.github.io/pixel-zombie-survivor/)** · Free in your browser.

Play in a modern desktop or mobile browser. Move with **WASD / arrows**, dash with **Space**, activate your class skill with **E**, unlock a nearby door with **F**, and pause with **Escape**. Touch devices have a movement stick and dash button. Weapons aim and fire automatically. Music starts only after a click; toggle it with **Music: off**.

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
- Five distinct stages: open Forest, Dungeon catacombs, foggy Graveyard, Volcanic Fortress, and Abandoned Military Base.
- Graveyard tombstones are destructible; grave risings have a one-second warning every 18 seconds. Lava hurts both sides and has safe narrow bridges. Barrels in the base explode and can chain-react. Dungeon/base doors use keys (start with two; enemies and boss chests drop more); enemies can bash doors down.
- Standard: survive 20 minutes. Quick: survive 10 minutes with double XP and gold. Speedrun: kill 1,000 enemies before a 15-minute countdown expires.
- Collect XP gems and choose one of three upgrades. Weapons and passive items level to five. Carry up to six weapons.
- Boss chests evolve a max-level weapon with its matching passive; recipes are in the in-game Field Guide.
- Gold is banked on death, victory, or extraction from the pause screen. The shop permanently upgrades health, damage, movement speed, pickup radius, and armor. Save data lives in localStorage on the current browser/device; it does not synchronize across devices.
- Original procedural minor-key chiptune music and synthesized effects use the Web Audio API. No external audio samples or copyrighted recordings are bundled.

## Timed bosses

Bosses spawn at **02:00, 04:00, 06:00, 08:00, 10:00**, then repeat every two minutes in every mode. The clock uses elapsed simulation time, independently of difficulty pace and Speedrun's countdown. At each signal, regular hordes disperse and stop spawning for six seconds. Boss HP bars and a distinct faster, darker boss score activate for the encounter.

The rotation is Panzersoldat → Margwa → Pentagon Thief → Megaton → George A. Romero. All defeated bosses guarantee a gold-containing evolution chest; Megaton grants its chest after both halves are defeated. If a previous boss survives to the next signal, both encounters remain active and have separate health bars. Survival missions require the final timed boss to be defeated; Speedrun still fails when its countdown expires.

| Boss | Mechanics |
|---|---|
| Panzersoldat | Armor, claw drag, telegraphed directional flame cone |
| Margwa | Three heads; only glowing-mouth windows accept damage |
| Pentagon Thief | Steals the primary weapon and tries to escape in 12 seconds |
| Megaton | Radioactive blasts; Bomber and Blaster split phase |
| George A. Romero | Scaling HP, enrage on hit, Wunderwaffe reward |

These are unofficial fan-inspired boss names. The project is not affiliated with or endorsed by the owners of any referenced franchise. Artwork, music, and implementation are original; no franchise assets are included.

## Class skills and combat

Every class has a distinct original pixel sprite, visible equipment, and direction-aware held weapon animation. Weapons rotate independently of body facing to the precise target angle. Greatswords sweep through actual arc hitboxes; daggers cross-slash; holy swords and pitchforks thrust into narrow world-space hitboxes. Hits apply directional knockback and chainsaw/dagger hits bleed over time.

| Class | Starter | Signature skill (E) | Base cooldown |
|---|---|---|---|
| Soldier | Assault Rifle | Tactical Airdrop: delayed crushing supply crate; collectible 6s rapid-fire buff | 22s |
| Warrior | Greatsword | Whirlwind Strike: full-circle damage and knockback | 15s |
| Archer | Longbow | Arrow Rain: area volley after 1s | 18s |
| Rogue | Dual Daggers | Shadow Dash: teleport through enemies, 1.5s immunity, bleeding trail | 14s |
| Paladin | Holy Sword + Holy Circle | Divine Aegis: 4s immunity and expanding damage aura | 24s |
| Mage | Fireball / Arcane Staff | Supernova: expanding incendiary ring | 20s |
| Ninja | Shuriken | Shadow Clones: two movement/attack-mirroring clones for 6s | 24s |
| Farmer | Pitchfork | Harvest Bounty: marked enemies guarantee 3x gold and XP at death | 18s |
| Arbalist | Heavy Crossbow | Ballista Bolt: giant armor-piercing screen-crossing bolt | 16s |

Class skills can be ranked up in level-up choices. Hourglass reduces active cooldowns 8% per rank. Compass extends gem pull, Plate reduces damage, Boots boost speed and dodge, Crit Lens increases critical chance and multiplier, and Life Steal Medallion rolls healing on each kill. Battery remains available for damage/evolutions. Added Chain Saw and Necromancy Orb; tornadoes pull enemies, Thunderbolts select among high-HP on-screen targets, and robot companions fire lasers.

## Architecture

Native ES modules, HTML5 Canvas 2D, fixed 60 Hz simulation with catch-up limits. `Player.js`, `EnemyManager.js`, `WeaponSystem.js`, `UI.js`, and `FXManager.js` separate the main systems. `SpatialHash.js` uses typed-array linked cell lists for targeting and collision queries. Enemy, projectile, pickup, particle and floating-text pools have fixed capacities. Structured-stage navigation uses a shared breadth-first flow field, invalidated by destroyed cover and opened doors. BossDirector.js owns exact timed signals, ClassSkills.js owns skill cooldowns and timed effects, Combat.js owns geometric hit tests, and WeaponVisuals.js owns rotated equipment animation. Sprites are drawn once into cached small canvases. Rendering culls off-screen enemies and pickups.

The enemy pool holds **1,800 simultaneous enemies**. This is a capacity, not a promise of 60 FPS on every device. Actual performance depends on browser, hardware, visible entities and active effects. PixelFX effects are capped at five concurrent live instances.

## PixelFX

`FXManager.js` directly imports the actual [patch-gg/pixelfx](https://github.com/patch-gg/pixelfx) core and effects. `createFx`, `createFrame`, `clearFrame` and `composite` update and render live procedural explosions, lightning, holy rings, tornadoes, bullet impacts and disintegration. Vendored modules allow the game to run without a CDN dependency. Source licenses and notices remain in `vendor/pixelfx/`.

## Hosting

This project is a static website. On GitHub: **Settings → Pages → Deploy from a branch → main → / (root)**. It can also be served on any static host. No API keys, database, accounts, payments or backend are required. Optional Google Fonts have system-font fallbacks; gameplay needs no third-party network calls.

## Credits

Creator: **Georgia Rachel**. Original game sprites and procedural music. PixelFX: Patch contributors, MIT; included effects/core also acknowledge Hugo Duprez / Sprite Fusion and rehan-remade / Hollow Crown where applicable. See `THIRD_PARTY_NOTICES.md`.

Development history uses actual creation dates. Project status and verification notes are maintained in `PROJECT_MEMORY.md`.
