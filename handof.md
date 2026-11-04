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

- Latest project version: **v0.11.3** (Android version code 1103).
- All six city improvement phases were implemented and pushed independently on `codex/isometric-2-5d`. Consult `git log` for exact commits and verify branch/status before continuing. Detailed behavior and checks are in `DEVELOPMENT.md`.
- The current visual direction is an isometric 2.5D city. Preserve the established visual style and mobile layout when extending it.
- Performance work reuses car and walker render entries, interpolates pedestrians and camera movement, avoids redundant HUD text writes, defers/coalesces autosaves while keeping lifecycle saves immediate, and batches road/tree brush graph rebuilds. Whole-stroke undo preserves income earned during construction.
- The v0.10.5 heavy 3× desktop browser benchmark measured 59.6 rAF FPS, 5.82 ms mean CPU work, 10.4 ms p95 and three intervals over 25 ms at 390×844 CSS pixels and DPR 1.5. This is a local browser fixture, not a phone FPS guarantee.
- Underpass visibility is deliberately handled by an explicit car redraw after flyover decks. Do not remove or reorder that pass as a casual optimization; it prevents ground cars disappearing beneath decks. The browser pixel regression checks 18 positions, including adjacent-road cutaways.
- APK build and Android lint succeeded for v0.11.0 (zero errors, three advisory warnings); all 49 bundled source/style/HTML files matched the root sources at that release. Packaged game assets pass 32 browser checks. No phone installation or phone testing was performed for this release. Do not claim a newer APK exists until it is successfully built. The owner previously asked not to install on their phone until they explicitly say it is time; browser testing is acceptable.

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

- The city map is a 55×55 tile world with a river, roads, trees, buildings and elevated roads. Construction on cleared grass can start disconnected, including on the far side of the river; city services and traffic activate only when a road/bridge route connects them to the city.
- Buildings include multi-tile civic campuses (hospital, police station, parking, supermarket, university), parks, stores, offices and homes. Footprints, tree clearance, costs, placement validation and undo are gameplay rules; consult `src/catalog.js`, `src/plots.js`, `src/growth.js`, and the relevant tests before changing them.
- Trees can be cleared at a cost. Road/build brushes support dragging and grouped undo. Save compatibility and later income during a grouped stroke matter.
- Pedestrians should remain on sidewalks. Cars should stay visible through toll booths, parking and under flyover decks; route edits should not make traffic vanish. U-turns require explicit designated markers. Bent flyovers and river bridges are supported.
- Parks and businesses provide income; upgrades should visibly change structures and economics. Mayor satisfaction reflects factors such as congestion, tolls and access to services.
- Existing save format uses `toll-empire-planner-v4` in local storage with versioned migration and a recovery backup. Do not clear or silently replace saves.
- Normal vehicle speed and DPR are preserved. In v0.11.3 the owner explicitly requested lighter road traffic: private spawning now has an 80-vehicle ceiling, a connected-road budget and a 1.8-second minimum interval. The explicit low-power setting may use a lower pixel ratio.

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

## v0.11.1 map and phone clarity update
Active map reduced to 55x55 (3,025 plots). Migration remaps all stored ground node IDs from 64/40 strides, preserves interior buildings and progress, and archives the full original 64x64 city inside the save for Customize export. Outer or straddling properties remain recoverable from that original archive; the active city shows a notice. Never drop the original archive casually.

Normal DPR cap increased from 1.5 to 2; low-power mode remains 1. Adaptive artwork tiers still avoid oversized zoom-out textures. Read-only phone inspection measured DPR 3.5, CSS 360x740 and canvas 720x1480, confirmed mapSize 55 / 3,025 plots with 33 buildings and a preserved original-city archive. An app WebView storage backup was saved only in OS temp before installation.

147 tests and 50 syntax checks pass; source and exact Android assets pass browser checks including high-DPR density, underpass pixels and Mayor Drive. v0.11.1 code 1101 APK built/linted, installed with -r and cold-launched successfully; sampled AndroidRuntime/Chromium error logs empty. Dense zoom-out browser 3x fixture: 53.2 rAF FPS, mean CPU 6.1 ms, p95 10 ms at DPR 2. No sustained phone FPS claim.

## v0.11.2 civic identity and separate School
Hospital, University and Police Station no longer share one campus layout/palette. Hospital: white/red wings, large roof cross and emergency entrance. University: terracotta pitched halls, courtyard and tall central clock tower. Police: navy headquarters, gold shield, separate watchtower. Owner explicitly requested a separate School: yellow/teal L-shaped classrooms and a sports court. Roof identity survives wall repainting, layouts rotate, upgrades grow the buildings, and inspector previews use actual isometric art. Implementation: src/civic-art.js, isometric-art.js and isometric-renderer.js.

School costs 800 coins, occupies 4x4, has five levels and provides local education at 28 road steps +3 per upgrade. Education uses the better normalized school/university reach at each home. No commercial visits, fees or passive income. School coverage overlay, build icon/menu, inspector, clearing, upgrades, editing, undo and save/load are integrated. Existing save key/schema, buildings and archived original cities remain intact.

Final validation: 149 Node tests; 51 syntax checks; 51 source-browser checks and 50 exact Android-asset browser checks, including 180 wall pixel samples, 18 underpass positions and civic rendering across rotations/paints/zoom tiers. Visual atlas: scripts/civic-showcase.html; capture with node scripts/browser-smoke.mjs --civic-review. v0.11.2 code 1102 APK built/linted (zero errors, three advisory warnings); 51 bundled source/style/HTML files match root. Ignored local APK: Toll-Empire-v0.11.2-Android.apk. No phone installation or on-device testing for this task; do not infer authorization to install from earlier completed phone updates.

## v0.11.3 traffic pressure and flyover opacity
Owner reported crowded queues and requested fewer cars plus fully visible flyovers. Reduced home/business demand and fleet contributions; private spawn floor 1.8 seconds even during events; private-spawn ceiling 80 with connected-road allowance 0.8 vehicles/node (minimum 6), and random visitor bus chance 5%. Scheduled transit remains intact. Full destinations reserve bays for approaching/parked/departing visitors and reject additional private trips. Toll releases now recheck following distance and signal permission, avoiding overlap when a service timer expires. Existing cars finish naturally; save data, income balances, fees and normal movement speed remain intact.

Flyover fade has been removed. Keep the explicit underpass vehicle redraw: all 18 car pixel positions pass while decks draw at alpha 1. Validation: 152 tests, 51 syntax checks, 52 source-browser checks and 51 exact bundled-asset checks. New scripts/traffic-pressure.mjs 60-minute fixture (115 home levels, max traffic upgrade, tourism, toll and flyover): peak 17 cars, mean 3.9 road cars, 1,849 trips, 655 toll customers, 619 business visitors, 314 trips in final ten minutes, zero road cars stationary over 30 seconds. Standard 60-minute fixture also retains income/trips. Not a phone or owner's-city performance claim.

v0.11.3 code 1103 APK built/linted: zero errors, three advisory warnings; 51 bundled source/style/HTML files match root. Ignored local artifact: Toll-Empire-v0.11.3-Android.apk. No phone installation or on-device testing for this task.
