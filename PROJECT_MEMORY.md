# Deadwood Signal — project memory

Creator: Georgia Rachel. Canonical repository: `georgiarachel07/pixel-zombie-survivor`. This directory is the canonical source. `README.md` owns controls, feature descriptions, architecture, credits and deployment instructions; `tests/systems.test.js` owns system regression checks.

Current status: local implementation is being validated; GitHub publication and Pages deployment are pending. Do not claim a public playable URL until verified.

Constraints: browser-only JavaScript ES modules, no backend or build dependency; direct vendored PixelFX integration with licenses; procedural original music; accurate commit dates. Save data is local to the browser. 1,800-enemy pool capacity does not establish a universal 60 FPS performance guarantee.

Validation: run `npm test` and `npm run check`, then browser-check menus, deployment, movement, upgrades, pause/extract, audio controls and responsive layout. Boss logic, evolution, pickups, storage and spatial hashing have deterministic system tests. Full 20-minute visual balance testing is not yet complete.
