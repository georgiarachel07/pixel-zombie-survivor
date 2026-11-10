# Deadwood Signal — project memory

Creator: Georgia Rachel. Canonical repository: georgiarachel07/pixel-zombie-survivor. This directory owns source. README.md owns controls, game rules, architecture and credits; tests/*.test.js own regressions. Save key remains georgia-rachel-deadwood-v1, preserving existing gold/shop progress.

Iteration 2: five stages; exact 120-second boss intervals independent of mode.pace; distinct class sprites, equipment and target-angle animations; geometric melee, knockback/bleed; expanded items; nine class skills. BossDirector.js owns timing, World.js owns maps/cover/hazards/doors, Combat.js owns geometry, ClassSkills.js owns signatures, WeaponVisuals.js owns held equipment. Native PixelFX and procedural boss music are retained.

Controls: WASD/arrows move, Space dash, E class skill, F spend a key on a nearby locked door. Starts with two keys. Bosses disperse regular mobs and suppress waves/rising graves for six seconds. Roster repeats; surviving encounters retain HP bars. Survival ends after the final boss; Speedrun has a hard countdown. Megaton chest follows defeat of both associated halves.

Deployment: v2.0.1 was published and browser-tested in a separate tab, preserving the user's active v1 run. Browser confirmed distinct portraits, all five stage options, Tactical Airdrop cooldown, graveyard/fog, Warrior Whirlwind and Ninja clones in the military base, without console errors. v2.0.2 additionally uses safe stage spawn placement and keeps the arena/actions inside short desktop viewports. Versioned module/CSS URLs prevent mixed cached releases.

Validation: 36 system tests pass; syntax and relative imports are verified for 49 modules. Regressions cover every signature skill, all timed boss boundaries across modes, guaranteed chests, stage hazards, safe stage spawn points, melee, pulling twisters, drone lasers, life-siphon orbs, stats and existing saved systems. Run npm test and npm run check after edits. Full 20-minute balance and a universal 1,000-visible-enemy 60 FPS guarantee remain unverified.

Constraints: native browser ES modules, no backend; direct vendored PixelFX with licenses; original music. Use real commit dates; no fabricated historical contributions.
