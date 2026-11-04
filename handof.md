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

- Latest project version: **v0.11.0** (Android version code 1100).
- All six city improvement phases were implemented and pushed independently on `codex/isometric-2-5d`. Consult `git log` for exact commits and verify branch/status before continuing. Detailed behavior and checks are in `DEVELOPMENT.md`.
- The current visual direction is an isometric 2.5D city. Preserve the established visual style and mobile layout when extending it.
- Performance work reuses car and walker render entries, interpolates pedestrians and camera movement, avoids redundant HUD text writes, defers/coalesces autosaves while keeping lifecycle saves immediate, and batches road/tree brush graph rebuilds. Whole-stroke undo preserves income earned during construction.
- The v0.10.5 heavy 3× desktop browser benchmark measured 59.6 rAF FPS, 5.82 ms mean CPU work, 10.4 ms p95 and three intervals over 25 ms at 390×844 CSS pixels and DPR 1.5. This is a local browser fixture, not a phone FPS guarantee.
- Underpass visibility is deliberately handled by an explicit car redraw after flyover decks. Do not remove or reorder that pass as a casual optimization; it prevents ground cars disappearing beneath decks. The browser pixel regression checks 18 positions, including adjacent-road cutaways.
- APK build and Android lint succeeded for v0.11.0 (zero errors, three advisory warnings); all 49 bundled source/style/HTML files match current root sources. Packaged game assets pass 32 browser checks. No phone installation or phone testing was performed for this release. Do not claim a newer APK exists until it is successfully built. The owner previously asked not to install on their phone until they explicitly say it is time; browser testing is acceptable.

## Completed city improvement phases (v0.11.0)

1. City overlays: disconnected buildings/roads, service reach, congestion and full parking.
2. Live construction quotes: complete footprint, clearing cost, connectivity and real validation errors.
3. Saved neighborhood goals: two connected homes, hospital coverage, 30 fresh business visitors and 30 seconds of traffic flow in each district. Each stage pays once.
4. Bounded satisfaction effects: private demand -5% to +10%; actual business arrival bonus 0-5%; no change to posted toll or park ticket price.
5. Bus stops and routes: 2-8 ordered stops, legal round trip, six-seat physical buses, four-second dwell, pause/refund/undo, saved lines and lifetime passengers. Actual deliveries between populated catchments yield up to 20% private-demand relief in a rolling minute. No self-paid bus toll revenue.
6. Safe property move/rotation and saved bench/flower/fountain decorations. Active or approaching visitors must leave before edits or edit undo; relocation preserves upgrade/paint/ledgers and undo preserves subsequent receipts. Garage-home footprints and office parking corners rotate physically.

Final checks: 142 Node tests; 49 syntax checks; 33 browser checks including offline restoration, real pointer move/rotation and all 18 underpass pixel positions. Feature-enabled dense 3x browser fixture: 59.5 rAF FPS, 4.67 ms mean CPU, 6.7 ms p95, fixed DPR 1.5; includes overlay, 10 decorations and an active bus route. No phone performance claim. A deterministic 60-minute simulation retained income and trips.

Only the owner's final real-phone gameplay, touch and sustained-performance validation remains. Do not install on a phone until the owner explicitly requests it.

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


## Zoom clarity follow-up
Buildings, trees, road chunks and property grounds now cache at 4x for maximum 2.5x zoom with DPR 1.5. Trees include branch and foliage highlights. Save data and normal drawing DPR are unchanged. Browser checks include maximum zoom cache resolution.

Zoom-out lag fix: artwork now selects 1x/2x/4x caches from projected zoom and DPR; changing tiers releases terrain/building/site caches. At 1x the terrain cache holds the complete 64-chunk map to prevent eviction churn. Maximum zoom retains 4x detail.

Mayor Drive added: Build menu > Mayor Drive, road-graph driving with W/S/A/D or arrows, R marked U-turn, E ramp; touch hold controls, follow camera, nearby city information, exit restores camera/pause. Session-only car uses normal traffic rules and produces no toll receipts. Tests cover movement, braking, road-end survival and legal reversal. No new APK build or phone installation.

Mayor Drive follow-up: smoothed acceleration, braking, corner pose/angle and camera follow; preserved road-tile movement remainder. Owner authorized updating the connected phone after browser validation.

Connected-phone update completed at owner request: latest v0.11.0 debug APK built/linted, installed with adb install -r (Success), and cold-launched successfully. App process remained running; sampled AndroidRuntime/Chromium error logs were empty. No app data was cleared. Long-session driving feel remains for owner feedback. Validation: 145 tests and 50 syntax checks plus browser regression.

Building floor/wall fix: draw plinth/foundation before the main prism, preventing its ground top polygon from repainting visible walls. Browser pixel regression samples 165 combinations across 11 building kinds, five paints and three resolution tiers.
