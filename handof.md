# Toll Empire handoff notes

This file records the project context needed to continue development. The game owner prefers Bangla or romanized Bangla for conversation and wants actionable progress rather than repeated permission questions.

## Project and workflow

- Repository: [09rakib/TOLL-EMPIRE-GAME](https://github.com/09rakib/TOLL-EMPIRE-GAME)
- Current working branch: `codex/isometric-2-5d`. Keep work on the active branch unless the owner asks otherwise; never force-push.
- The owner explicitly asked for completed changes to be committed and pushed after each task. Run the checks that apply before pushing.
- Keep secrets, phone pairing codes, local saves, signing keys, screenshots from a personal device and generated release ZIPs out of Git.
- Preserve player saves when changing gameplay or storage.
- Root `AGENTS.md` is the project workflow authority; read it before doing work if its instructions may have changed.

## Game and technology

Toll Empire is a mobile-first city-building and toll-management game. The player is the mayor and plans a city: roads, homes, toll booths, offices and civic/commercial buildings. Traffic, service access, income and citizen satisfaction respond to those choices.

Gameplay is dependency-free JavaScript and Canvas. `src/` is the game source; `index.html` and `src/style.css` provide the browser app. `android/` packages that same source in an offline Android WebView. Android assets are generated from root sources at build time; do not hand-edit generated build copies.

## Current project state

- Latest published project version: **v0.10.5**.
- Latest commit at the time these notes were written: `5c3e351` (`Improve frame pacing and batch construction work`). Verify `git status`, branch and remote before continuing; newer work may exist.
- The current visual direction is an isometric 2.5D city. Preserve the established visual style and mobile layout when extending it.
- Performance work reuses car and walker render entries, interpolates pedestrians and camera movement, avoids redundant HUD text writes, defers/coalesces autosaves while keeping lifecycle saves immediate, and batches road/tree brush graph rebuilds. Whole-stroke undo preserves income earned during construction.
- The v0.10.5 heavy 3× desktop browser benchmark measured 59.6 rAF FPS, 5.82 ms mean CPU work, 10.4 ms p95 and three intervals over 25 ms at 390×844 CSS pixels and DPR 1.5. This is a local browser fixture, not a phone FPS guarantee.
- Underpass visibility is deliberately handled by an explicit car redraw after flyover decks. Do not remove or reorder that pass as a casual optimization; it prevents ground cars disappearing beneath decks. The browser pixel regression checks 18 positions, including adjacent-road cutaways.
- APK build and Android lint succeeded for v0.10.5. Do not claim a newer APK exists until it is successfully built. The owner previously asked not to install on their phone until they explicitly say it is time; browser testing is acceptable.

## Key gameplay behavior to preserve

- The city map is a 64×64 tile world with a river, roads, trees, buildings and elevated roads. Construction on cleared grass can start disconnected, including on the far side of the river; city services and traffic activate only when a road/bridge route connects them to the city.
- Buildings include multi-tile civic campuses (hospital, police station, parking, supermarket, university), parks, stores, offices and homes. Footprints, tree clearance, costs, placement validation and undo are gameplay rules; consult `src/catalog.js`, `src/plots.js`, `src/growth.js`, and the relevant tests before changing them.
- Trees can be cleared at a cost. Road/build brushes support dragging and grouped undo. Save compatibility and later income during a grouped stroke matter.
- Pedestrians should remain on sidewalks. Cars should stay visible through toll booths, parking and under flyover decks; route edits should not make traffic vanish. U-turns require explicit designated markers. Bent flyovers and river bridges are supported.
- Parks and businesses provide income; upgrades should visibly change structures and economics. Mayor satisfaction reflects factors such as congestion, tolls and access to services.
- Existing save format uses `toll-empire-planner-v4` in local storage with versioned migration and a recovery backup. Do not clear or silently replace saves.
- Current game speed, vehicle limit and normal DPR have intentionally not been secretly lowered for performance. The explicit low-power setting may use a lower pixel ratio.

## Checks and useful diagnostics

For gameplay or rendering changes, project instructions require:

```powershell
npm test
npm run check
```

For Android changes, build and lint the debug app (use installed Android Studio JBR and SDK paths as needed):

```powershell
./android/gradlew.bat -p android assembleDebug lintDebug --offline --console=plain
```

Useful diagnostics:

- `scripts/render-benchmark.mjs --mobile-dpr --phone-size --speed=3 --flyover --long` runs the real-rAF dense browser benchmark. It samples 600 frames with warm-up; CPU load affects results.
- `scripts/underpass-pixel-test.html` checks actual rendered car body pixels under and beside a flyover. `?baseline` intentionally disables the visibility redraw to demonstrate the old failure.
- `scripts/check.mjs` syntax-checks application JavaScript.
- Keep test saves and browser profiles isolated from the owner's open `localhost:5173` browser profile. Never use or reset their local player save while testing.

## Product direction

The owner wants the game to feel smooth and replayable, with a larger city that players can shape over time. Prioritize concrete, usable improvements to city building, traffic readability and mobile performance. They prefer each finished step to be pushed to GitHub. Ask for clarification only when a missing decision materially blocks correct implementation; do not ask again for already-granted Git push authorization.

