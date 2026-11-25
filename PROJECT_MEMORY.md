# Deadwood Signal — project memory

Creator: Georgia Rachel. Canonical repository: georgiarachel07/pixel-zombie-survivor. This directory owns source. README.md owns controls, game rules, architecture and credits; tests/*.test.js own regressions. Save key remains georgia-rachel-deadwood-v1, preserving existing gold/shop progress.

Iteration 4: held keys maintain one temporary portal directly beside the player on every map; pickup collection forms it immediately. WeaponVisuals.js animates hands with weapons; WeaponSystem.js renders Greatsword, knife, and pitchfork combat models for level-up attacks. All five bosses now use high-health, resistant two-phase fights with phase-two palettes/aura, faster aggression, expanded signature attacks, and a distinct phase-two boss score.

Controls: WASD/arrows move, Space dash, E class skill, F spend a key to stabilize a nearby portal. Starts with two keys. Bosses disperse regular mobs and suppress waves/rising graves for six seconds. Roster repeats; surviving encounters retain HP bars. Survival ends after the final boss; Speedrun has a hard countdown. Megaton chest follows defeat of both associated halves.

Deployment: v2.2.0 is the next verified release target. Versioned module/CSS URLs prevent mixed cached releases.

Validation: 40 system tests pass; syntax and relative imports are verified for 50 modules. Regressions cover every signature skill, all timed boss boundaries across modes, guaranteed chests, dynamic portals on all five maps, phase-two boss transformations, melee weapon models, pulling twisters, drone lasers, life-siphon orbs, stats and existing saved systems. Run npm test and npm run check after edits. Full 20-minute balance and a universal 1,000-visible-enemy 60 FPS guarantee remain unverified.

Constraints: native browser ES modules, no backend; direct vendored PixelFX with licenses; original music. Use real commit dates; no fabricated historical contributions.

