# Deadwood Signal — project memory

Creator: Georgia Rachel. Canonical repository: georgiarachel07/pixel-zombie-survivor. This directory owns source. README.md owns controls, game rules, architecture and credits; tests/*.test.js own regressions. Existing localStorage key remains georgia-rachel-deadwood-v1 so prior gold/shop progress is preserved.

Current work: Iteration 2 is implemented locally; publication and browser QA are pending. Five stages, exact 120s boss intervals independent of mode.pace, class-specific sprites/equipment/animations, geometric melee with knockback/bleed, expanded items and nine class skills. BossDirector.js owns timing; World.js owns map hazards/cover/doors; Combat.js owns geometry; ClassSkills.js owns signature skills; WeaponVisuals.js owns rotated held equipment.

Controls: WASD/arrows move, Space dash, E class skill, F spend a key to unlock a nearby door. Players start with two keys. Boss chests add a key. Boss signals disperse regular mobs and suppress regular spawning for six seconds. Boss roster repeats; overlapping survivors retain bars. Survival ends after defeating final boss; Speedrun has a hard countdown. Megaton chest appears after both associated halves die.

Validation: 30 system tests pass locally, including all nine skills, timed spawn boundaries across modes, guaranteed chests, melee geometry/knockback, map hazards and backward-compatible core systems. Final formatted syntax/import check and hosted browser QA remain pending. Universal 60 FPS and full 20-minute balance are not established.

Constraints: browser-only native ES modules, direct vendored PixelFX with licenses, original procedural score with separate boss arrangement. Preserve real commit dates. No fabricated backdated contribution history.
