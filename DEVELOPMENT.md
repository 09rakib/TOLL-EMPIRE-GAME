# City improvement phases

Work stays on `codex/isometric-2-5d`. Each completed phase is checked and pushed independently. Existing player saves are preserved. Browser checks use isolated temporary profiles; phone testing is deferred to the owner after all phases.

## Phase 1 - City overlays (complete)
Build menu > City overlays offers disconnected roads/buildings, congestion, hospital/police/university/park road coverage, and live parking occupancy. Coverage follows the same road-distance and upgrade rules as the mayor report. Diagnostics never change the city. Overlay data refreshes at most twice per simulation second.

Validation: 127 Node tests; 43 syntax checks; 11 isolated Chrome checks at 390x844, no runtime exceptions.

## Phase 2 - Construction feedback (complete)
The live pointer/touch preview shows footprint, total price including clearing, city-road connection and the real validation error. Span prices come from the same planner used to build them. Existing clearing confirmation and grouped brush undo remain.

Validation: 129 tests, 44 syntax checks, 12 isolated Chrome checks.

## Phase 3 - Neighborhood goals (complete)
City development > Neighborhoods has four sequential goals in each of five districts: two connected homes, hospital coverage, 30 fresh paying visitors, then 30 seconds without jams with three local vehicles and ten fresh completed trips. Each reward can be claimed once. Progress and visitor counters persist; existing contracts/saves remain supported.

Validation: 131 tests, 45 syntax checks, 14 isolated Chrome checks. Tests exercise real admission payments, reward gating, interrupted traffic progress and save restoration.

## Phase 4 - Satisfaction economy (complete)
Planner demand is bounded between -5% and +10%, neutral at 50 satisfaction. Above 70 satisfaction, actual admitted business visits receive up to 5% extra. No bonus is created while idle; posted tolls and park ticket prices stay exact. The mayor report explains the effects. Service distance logic is shared with overlays.

Validation: 133 tests, 46 syntax checks, 15 Chrome checks. Deterministic 60-minute simulation: 1,594 completed trips, 858 toll customers, 660 business visitors, 24,492 earned coins, peak 68 vehicles; no invalid progress or cap overflow. This validates continued activity, not human retention or phone performance.

## Phase 5 - Public transport (complete)
Build menu > Public transport places $100 ground-road stops and opens $350 routes with 2-8 stops in player-selected order. Up to four routes each run a six-seat physical bus with four-second dwell, legal U-turns and ordinary following/signals. Service can pause, routes/stops can be refunded, and construction supports undo. Deleted roads suspend service; buses stay visible. Routes and lifetime deliveries save; active vehicles restart on reload like other traffic.

Nearby connected homes/businesses provide bounded passenger demand. Only completed deliveries reduce private vehicle demand (1% per passenger in the last simulation minute, capped at 20%). City-owned buses do not create self-paid toll income. No idle transit income is generated.

Validation: 136 tests, 48 syntax checks, 19 isolated Chrome checks, including actual bus delivery. Tests cover invalid return routes, pause, disconnection, persistence and undo.

## Phase 6 - City editing and final polish (complete)
Property inspectors offer $50 relocation and $25 clockwise rotation. Full-site validation protects roads, water, trees, flyover clearances and other buildings. Relocation keeps levels, investment, paint and visitor ledgers; undo preserves later income. Approaching cars, parked visitors and park walkers must finish before a transformation or its undo. Rectangular garage homes rotate real footprints and driveways; offices rotate parking corners. Isometric roofs, doors, campus massing and park grounds follow orientation.

Benches ($20), flower beds ($35) and fountain plazas ($80) occupy one cleared tile, are purely decorative, and support 60% demolition refunds, save/load and undo.

Final validation: 142 Node tests; 49 application syntax checks; 33 isolated browser checks including actual pointer move/rotation, portrait/desktop layouts, saved edits restored offline and 18 underpass pixel positions. The generated Android assets pass 32 browser checks (browser service-worker offline reload is intentionally absent from the APK copy). APK contents were compared against all 49 current source/style/HTML files.

The dense 3x browser benchmark with 82 buildings, initially 250 cars, a flyover, connections overlay, 10 decorations and one active transit bus measured 59.5 rAF FPS, 4.67 ms mean CPU work, 6.7 ms p95 and three frame intervals above 25 ms at 390x844, fixed DPR 1.5. These are development-browser measurements.

Android v0.11.0 (version code 1100) built successfully with `assembleDebug lintDebug`: zero lint errors, three advisory warnings. No phone was installed, accessed or tested. The debug APK remains ignored by Git at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Remaining owner validation
All six implementation phases are complete. The owner will do the final real-phone gameplay, touch, thermal/battery and long-session checks. No claim of sustained phone FPS is made.

## Reproduce
- `npm test` and `npm run check`
- `node scripts/browser-smoke.mjs` (isolated temporary Chrome profile; never uses player saves)
- `node scripts/benchmark.mjs --minutes=60`
- `node scripts/render-benchmark.mjs --mobile-dpr --phone-size --speed=3 --flyover --long --city-features`
- To smoke-test bundled assets, set `TOLL_GAME_ASSETS` to the absolute `android/app/build/generated/gameAssets` directory before running the browser smoke script.
- Android: use Android Studio JBR and the SDK containing Build Tools 34.0.0, then `./android/gradlew.bat -p android assembleDebug lintDebug --offline --console=plain`.

## v0.11.1 follow-up
55x55 active map with 64/40-stride migration, original-city archive export and remapped transit/decorations. Normal phone DPR cap 2; low-power cap 1. Validation: 147 tests, 50 syntax checks, high-DPR source/packaged browser checks, successful phone update and live inspection (3,025 plots, canvas 720x1480 at CSS 360x740, 33 buildings). See README and handoff for migration recovery behavior.

## v0.11.2 distinct civic landmarks and School
Separate isometric layouts and persistent identity palettes replace the shared civic block: white/red medical campus, terracotta courtyard university with clock tower, yellow/teal L-shaped school and navy police compound with watchtower. Civic grounds include service-specific markings; all artwork uses existing adaptive sprite/ground caches. Sprite cache keys include each campus part role. Inspector previews reuse actual city sprites and rotation geometry.

School is a saved 4x4 public service costing 800 coins, with five upgrades and 28-step education reach (+3/level). Education selects the better normalized school/university road distance at each home. It is excluded from business destinations and transit commercial demand and has zero visit capacity/fees. Save schema/key and existing city archives are unchanged.

Validation: 149 tests; 51 syntax checks; 51 source-browser checks; 50 exact packaged-asset browser checks. Includes real Renderer loops over four civic types, four rotations, levels 1/3/5, original/lavender paints and zoom 0.4/0.78/2.5; distinct low-resolution alpha silhouettes under identical paint; School tool and coverage UI; 180 facade pixel samples and 18 underpass positions. Reviewed the generated design atlas at all illustrated levels. Android assembleDebug/lintDebug successful: zero lint errors, three advisory warnings; 51 APK source/style/HTML files match root. No phone install or phone performance testing.

## v0.11.3 reduced traffic pressure and opaque flyovers
At the owner's request, private traffic demand and fleet growth are reduced, with an 80-vehicle private-spawn ceiling, an additional connected-road budget, a 1.8-second spawn floor even during events, and random visitor buses reduced to 5%. Scheduled transit and normal vehicle speed are unchanged. Spawn selection checks visitor-bay reservations including approaching and departing cars, avoiding oversubscription of two-bay businesses/homes. Toll appointments must recheck actual downstream following space and signal permission; the old release path could enter an occupied tile after a service timer expired.

Flyover drawing no longer fades toward 40% alpha under traffic. Preserve the independent underpass redraw pass; it still makes ground cars visible without changing deck opacity. Pixel regression now also records alpha 1 for all 18 deck draws.

Checks: 152 tests, 51 syntax checks, 52 source-browser checks and 51 exact APK-asset browser checks. Added deterministic traffic-pressure.mjs: 60 minutes, 115 home levels, maximum traffic upgrade, tourism, toll, flyover, 17 peak vehicles, 3.9 mean road vehicles, 1,849 completed trips (314 in final ten minutes), 655 toll customers, 619 business visitors, 15,440 earned coins; zero road vehicles stationary over 30 seconds, including waiting-for-parking vehicles. Standard 60-minute benchmark: peak 15, 1,678 trips, 1,015 toll customers, 520 business visitors, 22,300 earned coins. These fixtures validate continuing flow/income, not real-phone performance.

Android v0.11.3 code 1103 assembleDebug/lintDebug successful (zero errors, three advisory warnings), with all 51 APK source/style/HTML files matching root sources. No phone install or on-device test. Storage schema/key and original-city archive remain unchanged.
