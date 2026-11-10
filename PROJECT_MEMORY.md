# Deadwood Signal — project memory

Creator: Georgia Rachel. Canonical repository: `georgiarachel07/pixel-zombie-survivor`. This directory is the canonical source. `README.md` owns controls, feature descriptions, architecture, credits and deployment instructions; `tests/systems.test.js` owns system regression checks.

Current status: game published on GitHub Pages at https://georgiarachel07.github.io/pixel-zombie-survivor/. Initial deployment succeeded (GitHub Actions run 42827618376). Browser QA confirmed forest Soldier gameplay, auto-fire/kills, XP level-up choices, movement/dash, pause/extraction, persisted wallet after reload, shop affordability states, mobile-width menu, and Mage dungeon Speedrun with live PixelFX explosions. No browser console errors appeared during these checks. Final source includes tested pool-saturation and rare-weapon reward fixes, readable formatting, and a README play link.

Constraints: browser-only JavaScript ES modules, no backend or build dependency; direct vendored PixelFX integration with licenses; procedural original music; accurate commit dates. Save data is local to the browser. 1,800-enemy pool capacity does not establish a universal 60 FPS performance guarantee.

Validation: all 14 regression tests passed after final gameplay changes; syntax and relative imports verified for 44 modules. All six used PixelFX effect modules rendered in live simulations. Run `npm test` and `npm run check` after changes, then browser-check affected flows. Boss logic, evolution, pickups, storage and spatial hashing have deterministic system tests. Full 20-minute balance and a device-specific 1,000-visible-enemy 60 FPS benchmark remain unverified.
