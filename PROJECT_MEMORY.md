# Deadwood Signal — project memory

Creator: Georgia Rachel. Canonical repository: georgiarachel07/pixel-zombie-survivor. This directory owns source. README.md owns controls, game rules, architecture and credits; tests/*.test.js own regressions. Save key remains georgia-rachel-deadwood-v1, preserving existing gold/shop progress.

Iteration 3: five stages; exact 120-second boss intervals independent of mode.pace; five pooled zombie variants (thrower, crawler, runner, tank, exploder); elevated five-boss roster; distinct class sprites and Greatsword visual swings. World.js owns maps, hazards and locked portals; portal activation transfers to the next combat zone or an active boss arena. Combat.js owns geometry, ClassSkills.js owns signatures, WeaponVisuals.js owns held equipment. Native PixelFX and procedural boss music are retained.

Controls: WASD/arrows move, Space dash, E class skill, F spend a key to stabilize a nearby portal. Starts with two keys. Bosses disperse regular mobs and suppress waves/rising graves for six seconds. Roster repeats; surviving encounters retain HP bars. Survival ends after the final boss; Speedrun has a hard countdown. Megaton chest follows defeat of both associated halves.

Deployment: v2.1.0 is published on GitHub Pages. Browser confirmed the live page serves the v2.1.0 footer and Portal control label. Versioned module/CSS URLs prevent mixed cached releases.

Validation: 38 system tests pass; syntax and relative imports are verified for 50 modules. Regressions cover every signature skill, all timed boss boundaries across modes, guaranteed chests, stage hazards, safe stage spawn points, melee, pulling twisters, drone lasers, life-siphon orbs, stats, portal activation and all five new enemy variants. Run npm test and npm run check after edits. Full 20-minute balance and a universal 1,000-visible-enemy 60 FPS guarantee remain unverified.

Constraints: native browser ES modules, no backend; direct vendored PixelFX with licenses; original music. Use real commit dates; no fabricated historical contributions.

