# Toll Empire · v0.11.0: city insights, transit and editing

A mobile-friendly city and toll tycoon built with JavaScript and Canvas. The supplied mockups remain in `references/`; game buildings are drawn with Canvas. No runtime dependencies.

## v0.11.0 city improvement release

All six phases are complete; see [DEVELOPMENT.md](DEVELOPMENT.md) for rules, validation and reproducible checks.

- Build menu > **City overlays** shows isolated roads/buildings, congestion, hospital/police/university/park coverage and live parking occupancy. Service reach follows road distance.
- Construction previews show full footprints, total clearing/build costs, connectivity and actual placement errors.
- City development > **Neighborhoods** offers four sequential goals in each district: homes, hospital coverage, fresh business visitors and sustained traffic flow. Rewards and progress persist.
- Mayor satisfaction changes private demand by -5% to +10% and grants up to 5% on real business arrivals. Posted toll and park ticket prices remain exact. The mayor report explains both effects.
- Build menu > **Public transport** links $100 stops into $350 routes. Choose 2-8 stops in travel order; provide legal U-turn points at end stops or a road loop. Each of up to four routes has one six-seat bus with four-second stops. Actual deliveries between populated stop catchments reduce private demand by up to 20%; no idle transit income is created.
- Building inspectors offer **Move property** ($50) and **Rotate 90 degrees** ($25). Moves preserve upgrades, paint and visitor totals; active visits must finish first. Destinations require empty, cleared land. Benches, flower beds and fountains add undoable, saved decorations.

Existing saves keep their storage key and migrate with empty transit/decoration data and fresh neighborhood goals. Validation: 142 tests, 49 syntax checks, 33 isolated browser checks including offline save restoration and 18 underpass pixel checks. The feature-enabled 3x dense browser benchmark measured 59.5 rAF FPS at fixed DPR 1.5; phone performance remains untested for this release.

Android v0.11.0 / code 1100 debug APK built and linted (zero errors, three advisory warnings); generated assets also passed browser smoke checks. No device installation or testing was performed. APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

## v0.10.5 frame pacing and construction

Cars and pedestrians reuse render entries and projected coordinates; vehicle sprites are resolved only when appearance or direction changes. Pedestrians interpolate between simulation steps, and camera inertia uses pointer timing. HUD text changes only when its value changes. Autosaves coalesce into idle work (with a timeout), while page hide still saves immediately. Previously validated save JSON is reused without repeated parsing; recovery backups remain protected.

Road and tree brush gestures share one undo snapshot and batch network rebuilding once per animation frame or gesture end. Whole-stroke undo retains income earned during construction. No vehicle cap, simulation speed or normal rendering resolution was reduced. Existing saves remain compatible.

The 3× browser benchmark at 390 × 844 and fixed DPR 1.5 (82 buildings, initially 250 cars, 2,112 forest plots, one flyover, 479 measured frames) recorded 59.6 rAF FPS, 5.82 ms mean CPU work, 10.4 ms p95 and three intervals over 25 ms. The initial run on this session recorded 54.5 FPS, 8.23 ms mean and 15.2 ms p95; machine load can affect comparisons. This fixture includes simulation, drawing and satisfaction, not the complete app HUD/storage workload or sustained phone performance. Reproduce with the benchmark command below.

Validation: 126 tests, syntax checks, and all 18 underpass pixel checks pass. The pixel sweep reuses one moving car to catch stale pooled coordinates.

## v0.10.4 browser underpass visibility regression

Deck transparency alone did not preserve vehicle visibility. In an isometric view the elevated surface also overlaps cars on a neighbouring road, outside the span’s logical ground tiles. Rendering now tests projected deck polygons against vehicle bounds, draws the normal scene, and then explicitly repaints underpass road vehicles at full body opacity. Elevated vehicles are restored above that cutaway pass. Detection includes landing vehicles and every visible deck, while cars visiting inside a building are excluded. The visible-deck list is cached so traffic does not rescan all static scenery.

`/scripts/underpass-pixel-test.html` sweeps 18 fixed car positions on the underpass and adjacent road. It checks the actual body-colour pixels and vehicle identity; all 18 pass, including 9 adjacent-road cutaways. `?baseline` suppresses the new visibility redraw and reproduces 9 colour/occlusion failures. This checks the rendered result, unlike the previous identity-only route tests. Existing saves and traffic rules are unchanged. The dense 3× development-browser stress run retained fixed 1.5 DPR and measured 60 rAF FPS; this remains a browser result, not a phone guarantee.

## v0.10.3 side ramps and underpass visibility

A flyover deck no longer hides the traffic travelling beneath it: when ground vehicles approach the underpass, the cached deck fades to 40% opacity; elevated cars remain opaque above it. Cars at the road/ramp landing are drawn above the landing surface, so the elevated-to-ground transition does not bury them for a frame.

When three cleared side plots are available beside each end of a sufficiently long span, construction adds an S-shaped side ramp. Its smooth Hermite curve joins the original road endpoint with the road's tangent, rises to the deck, and reverses the process at the far end. Vehicle drawing follows that same centerline and lane offset. Short or constrained spans keep their original straight landings; existing buildings, trees and roads are never erased to make a ramp. Reserved side plots block new buildings and roads and are released by demolishing the span; clicking the side ramp with Demolish also removes it. Existing saves receive side-ramp metadata where space permits, and preserve fixed choices thereafter.

Ground and elevated nodes at each landing now share traffic occupancy. Spawning and following distance respect a car waiting at the merge instead of allowing two visible vehicles to overlap there. Both ground and elevated route graphs remain usable; no teleport or extra U-turn is added. Tests cover curve tangents, shared deck edges, old save protection, simultaneous underpass/deck trips, and merge occupancy. Visual proof: `flyover-side-ramps-mobile.png`.

## v0.10.2 flyover, construction and performance fixes

Flyovers use a single cached road ribbon with shared mitered edges, continuous side rails, sparse supports and smooth ramp heights. Straight spans and L bends no longer have gaps between square slabs. Elevated cars use the same ramp-height profile and render above their own deck; switching between ground and ramp graph nodes retains the lane offset. The screenshot `flyover-continuous-mobile.png` shows both shapes at 3× speed.

Local and main roads can be built on cleared grass without any existing road adjacency, including across the river. Water and occupied plots remain protected. Isolated road networks do not activate city traffic or services until connected to a city entrance through roads or a bridge. Construction still charges per tile, saves and supports whole-stroke undo.

Fast play keeps a fixed pixel ratio: no automatic resolution downgrade at 2×/3×. Normal mode caps DPR at 1.5; only the explicit low-power setting uses 1. Building, tree, vehicle, site-ground and flyover artwork is cached at double resolution. Traffic processing reuses lane buckets and indexes next-tile leaders instead of allocating/filtering/sorting every queue. Toll waiting counts, parking occupancy, building lookup and entrances are indexed; the HUD reuses satisfaction calculations for one wall-clock second. Vehicle limits, save data, admission rules and the fixed simulation step are preserved.

Reproducible desktop Chromium tests at 390 × 844, DPR 1.5, 82 buildings, initially 250 simulated cars, 2,112 forest plots and one flyover:

| Speed | Measured frames | rAF FPS | Mean CPU work | p95 CPU work | Intervals >25 ms | Resolution changed |
| --- | --- | --- | --- | --- | --- | --- |
| 2× | 209 | 59.7 | 5.31 ms | 9.3 ms | 1 | No |
| 3× | 479 | 60.0 | 5.14 ms | 9.3 ms | 0 | No |

Run `node scripts/render-benchmark.mjs --mobile-dpr --phone-size --speed=3 --flyover --long` (use `--speed=2` for the other case). These are development-browser results, not a sustained phone FPS guarantee. Version 0.10.2 device installation and long on-device play need a connected phone.

## v0.10.1 traffic update

Ground roads and flyovers have pale center-divider dashes, with a clear opening and U-turn symbol at designated points. Build menu → Traffic management → U-turn point costs 60 coins. The road inspector can add or remove it; removing refunds 60%. Markers persist in saves, participate in grouped undo and are removed with their road. Existing saves start with no markers.

Driving routes now carry an incoming heading. Replanning cannot reverse at an unmarked tile; ground markers do not authorize turns on the flyover above. A legal reversal follows a 1.2-second semicircle between the two lanes. Off-road parking visits may turn inside the property before returning to the street. Without a legal route cars wait or continue forward to a city gate.

Toll traffic maintains physical following distance across successive road tiles, preventing queued cars from overlapping and hiding one another. Planner vehicles are not deleted when a road edit invalidates their itinerary: they stop visibly; restoring the missing road lets them continue. Hospital, store, hotel and home visits now enter a site, stop and leave instead of ending in the road. Removing a visited building preserves its current car positions and departure path. Only a completed city-gate exit retires a normal planner trip, with a gradual under-gateway fade rather than an abrupt cut. Full car and bus artwork includes tires, roof glass and directional lights in sixteen cached orientations; transparent sprite padding is trimmed to reduce fill cost.

The extended browser stress run (`node scripts/render-benchmark.mjs --mobile-dpr --long`) samples 600 real rAF frames with 120 warm-up frames: 82 buildings, initially 250 cars (238 remaining), 2,112 forest plots, 1.5 DPR; 59.3 rAF FPS, mean CPU work 5.09 ms, p95 9.2 ms, five frame intervals over 25 ms. Earlier renderer-only figures below describe the initial prototype and are not a sustained-phone guarantee.

Version 0.10.1 APK built and linted successfully, installed as an in-place update on Vivo V2405A (version code 1001), and launched with the existing city intact. Initial AndroidRuntime/Chromium error logs were empty. Sustained on-device FPS and long play sessions remain to be measured.

## Isometric 2.5D prototype

The `codex/isometric-2-5d` branch introduces a fixed isometric camera. Gameplay, tile IDs, building footprints, money, routes and save formats remain unchanged. Existing cities render in the new view. Stable v0.9.1 remains on `main`.

Roads, parking, river water, the park grounds and placement previews project onto diamond tiles. Buildings have separate roofs and side walls, windows, upgrade heights, paint and signs. Home parking and L-office layouts keep their actual world positions. Vehicles and pedestrians share the projection; elevated roads and their cars lift above ground. Static scene pieces and moving agents merge in depth order. Tapping a raised building face selects its property; building brushes pick ground diamonds. Pan, pinch/scroll zoom, minimap navigation, clearing and placement use inverse projection. This is the first playable rendering pass; detailed architectural art, complex occlusion polish and actual phone frame pacing still need device validation.

Rendering targets a 16.67 ms frame budget: bounded LRU ground chunks (8 × 8 tiles, at most 24 cached), cached building/tree/vehicle sprites, world and screen culling, cached static depth sorting, linear merging of dynamic agents, and a minimap refreshed at most five times per second. DPR is fixed at a maximum of 1.5 (1 in explicit low-power mode), independent of play speed. Simulation retains its fixed 30 Hz step with interpolated rAF drawing. No timers force a lower drawing rate.

Run `node scripts/render-benchmark.mjs --mobile-dpr` after installing Chrome, or set `CHROME_PATH` to a Chromium executable. The runner serves an isolated stress scene, waits for 240 real rAF frames, and reports CPU work and frame intervals. It does not use virtual-time clocks to measure performance. `--software` additionally disables GPU acceleration. The manual scene is `/scripts/isometric-benchmark.html`; `?sync` is a CPU batch diagnostic rather than a frame-pacing test.

Measured on this development desktop in GPU-enabled headless Chrome at the 1.5 DPR cap: 82 buildings, 250 real simulated cars and 2,112 forest plots; 209 measured frames after warm-up; 60 rAF FPS, 3.12 ms mean simulation/render/satisfaction CPU work, 5.6 ms p95, 7 ms maximum; p95 frame interval 16.8 ms, zero intervals over 25 ms. This is not a phone FPS guarantee. Actual Vivo/WebView sustained performance, GPU/thermal behavior and full HUD interaction must be checked on-device before calling the mobile conversion performance-complete. Version 0.10.0 is a prototype APK; it is not automatically installed over the stable phone build.

Projection tests cover round-trips, diamond picking at different zooms, pan direction, zoom anchoring, culling and elevated facade selection. A browser smoke test exercises the actual app pointer handlers for a wooded 4 × 4 campus, clearing/building and selecting its raised face. Visual proof: `isometric-city-mobile.png`.

## Run

Requires Node.js 20 or newer. Run `npm start`, then open http://localhost:5173. On the same Wi-Fi, a phone can use `http://YOUR_PC_LAN_IP:5173` if the Windows firewall permits Node. Browser installation and offline caching require HTTPS or localhost. An offline Android app is also available through the `android/` project below.

## Android app

The Android app bundles the same game into an APK. Once installed, it runs without a PC server or network connection. It uses Java for the Android host and AndroidX WebViewAssetLoader for packaged HTTPS assets. There is no Internet permission. Local storage persists app progress; browser and app saves are separate. To transfer a city, export its JSON backup in the browser and import it through Customize inside the app. Android file pickers support importing and exporting backups without broad storage permissions.

Build with JDK 17 or newer and Android SDK platform 35 installed:

```sh
cd android
./gradlew assembleDebug
```

On Windows use `gradlew.bat assembleDebug`. Set `JAVA_HOME` and `ANDROID_HOME` to the installed JDK/SDK if necessary. The first build needs access to Google Maven, Maven Central and the Gradle distribution. Output: `android/app/build/outputs/apk/debug/app-debug.apk`. Install with `adb install -r PATH_TO_APK`; launch package `com.tollempire.game`. This is a debug-signed development APK, not a Play Store release. Keep the same signing identity when installing updates to preserve app data. Signing keys, build output and SDK paths are excluded from Git.

Build tasks copy current root `index.html`, `src/` and `public/` into generated Android assets automatically, disabling the browser service worker inside that copy. The source tree remains shared. Backgrounding saves progress, and Android local storage survives force-stop/relaunch. The app supports Android 7.0/API 24 and newer with a current Android System WebView.

Android validation: `assembleDebug` succeeds and `lintDebug` reports zero errors (four advisory warnings). Previous releases were installed and launched on a real Vivo V2405A with the ADB server tunnel absent. Version 0.9.0 is built and linted; device installation is intentionally deferred at the user’s request. Native system-bar spacing is handled by the host layout. Some Vivo devices require approval in Super Care when installing or updating an APK from outside the Vivo store.

## v0.9.1 campus placement fix

University, police, supermarket, hospital and public parking can be built on a free 4 × 4 site before a road exists. Tap its top-left tile; all sixteen cells must be empty land. Wooded sites still offer one combined clearing/build quote. Connect a city road to the campus perimeter to open it: disconnected campuses receive no visitor income or service coverage, and cannot upgrade. Mobile building placement now tolerates finger movement before release; a pinch still cancels placement. The preview appears on touch-down, and the build guide explains the full footprint and road-later workflow. Browser regression checks exercise each reported campus through the actual pointer handlers, including an 8-pixel finger movement.

## Continuous tools and L-shaped crossings

Hold and drag Clear trees across plots: every visited tile is charged once, sparse pointer samples fill intervening tiles, and one Undo restores the entire stroke. Local/main roads use the same continuous drag gesture after clearing. Flyovers and river bridges automatically try both L corners for diagonal endpoints. Add bend also allows an explicit start → bend → end plan. Bridge interiors must remain over water; both flyover ramps require roads. Paths are real contiguous graph routes, not decorative spans.

## Straight river and animated water

The river is straight again, with animated 2D wave strokes on visible water tiles. River layout 3 migrates natural terrain while retaining existing buildings, streets and bridge water. Bridges retain their original crossings.

## Mayor satisfaction

The compact smile button opens the mayor report. Its score reflects actual road density, average toll prices, connected hospital distance from homes, police coverage, nearby parks and university access. Distance follows the road graph, so an isolated hospital does not count. Each factor has a visible score and improvement suggestion. Service upgrades extend effective coverage by three road steps per level. This is computed from the city and does not overwrite player progress.

## New campus buildings

New hospitals, police stations, parking areas, supermarkets and universities occupy 4 × 4 sites (16 tiles). Stores occupy 2 × 2. All have five original Canvas upgrade appearances inspired by the supplied references, with paint, atomic full-site clearing, demolition and undo. Parking starts with four working bays and expands to twelve; actual arriving cars park, pay, then return to the street. Hospitals and stores retain visitor-based income. Public services provide coverage for the mayor satisfaction system. Existing small buildings retain their footprints.

## New city-building additions

Home + parking costs 220 coins and occupies a rectangular 2 × 1 site. Its two parking bays receive residents without charging a business fee. The complete property supports clearing, upgrades, paint, removal, undo and save recovery. Existing homes are preserved.

## v0.8.0 changes

New offices use four tiles: an L-shaped building and working parking. Cars arrive, stop in one of two bays, pay and depart. Old compact offices remain intact to protect existing cities.

## v0.7.0 changes

Parks render as small 224×224 sprites directly into the visible frame, independently of the large terrain cache. Clear & build park quotes clearing plus construction together, performs both in one undoable purchase, and focuses the camera on the finished park. Park tickets pay 4 / 7 / 11 / 16 / 24 coins per actual walking visitor at levels 1–5. Upgrades change the landscape palette and add picnic seating, a cafe, entrance structures and royal-garden details. Removing any house, hotel, office or park remains available near the top of its inspector.

Pedestrians route through a pavement-corner graph; their road movement never uses asphalt or cuts diagonally through grass at turns. Ground-road geometry changes invalidate affected walking paths. Parks have their own interior walking paths. Roads and flyovers have no lane dashes or zebra markings. Upgraded building artwork stays within its own tile. Cars reaching their final road tile visibly drive through the exit before the trip is retired, so a final toll does not immediately swallow the vehicle.

For a bent flyover choose Flyover, enable Add bend, then tap a start road, an aligned clear bend tile and an aligned exit road. The two legs can cross clear grass and roads, with no ground road needed below the middle. Buildings, trees, water and other flyovers block the corridor. Elevated graph nodes follow the full bend and connect to the ground only at the two ramps. Maximum total length is 28 tiles. Undo/demolition handle the whole structure.

The river follows a smooth curve to the northeast edge. Existing city saves receive the new natural layout while retaining buildings, roads, coins and bridge water at existing crossings.

## City Parks and footpaths (v0.6.0)

New City Parks occupy a complete 4 × 4 square: 16 tiles. The original Canvas park includes a pond, fountain plaza, gazebo, flower beds, sports court, playground, hedges, benches and walking paths. Choose its top-left tile. Every cell must be inside the city, clear of trees and free of roads/buildings/flyovers. The placement preview outlines the full 16-tile footprint. For a wooded park site, the clearing panel quotes the combined tree-removal cost for all 16 cells as one undoable action.

Parks can be built before a road exists. They receive no visitors or connected park benefits until any perimeter tile touches a road connected to a city entrance. An isolated road does not activate them. People follow actual ground-road routes on footpaths, enter the park, walk around it and return. Disconnecting or removing roads/parks invalidates affected walking trips. The inspector shows real park walking visits; each actual walking arrival pays the park ticket fee. Local roads now have paved sidewalks and animated pedestrians. Walking traffic pauses with the city and respects low-power caps.

Tap any of the 16 park tiles to select, upgrade, paint or remove the same park. Removing it refunds once and clears all 16 tiles; Undo restores the entire park. Older one-tile pocket parks remain in place so upgrades do not overwrite neighboring streets or buildings. Remove/rebuild those as City Parks when enough cleared space is available. Walking agents are session-local; park visit totals persist.

## Forest and city editing (v0.5.0)

Build menu opens City buildings by default, with Hospital, Hotel and Park shortcuts at the top. Tap any placed building to paint, upgrade or remove it. Remove building is shown near the top of its inspector and refunds 60% of its investment. Tap a road and choose Remove road + fixtures to remove the ground road, booth and signal together for their combined 60% refund; protected entrances remain. Bridges/flyovers use the Demolish tool first. Undo restores removed structures and their connections.

Planner land now contains dense, persistent groves on roughly 55% of empty plots. Tap a tree plot to see its tree count and exact clearing cost before paying: **15 coins per tree**, typically 30–60 coins per plot. Clear plot removes all trees on that plot. Roads, buildings, parks and flyover corridors require cleared land; a bridge landing must also be clear. Choosing a building on wooded land opens the clearing panel and returns to that building tool after payment. A Clear trees tool is also available in City buildings.

Cleared plots stay clear through saves, building removal and reloads. Undo reverses clearing and refunds its cost, while preserving income earned afterward. Older cities receive forest only on empty grass; existing buildings and roads are preserved. Park trees are part of their building artwork and are removed by removing the park.

## Your first city

You start with 1,000 coins, empty building plots, one straight road and two vehicles: a car and a bus. There are no prebuilt homes, businesses or toll booths. Grass, trees and a river form the landscape.

1. Buy a **Home** for 120 coins and place it on grass directly beside a connected road. It adds 20 residents. More homes and higher home levels produce more actual traffic.
2. Buy a **Toll booth** for 150 coins and place it on the road. Vehicles pay when they pass. Tap the booth to set its price or upgrade it.
3. Add destinations with **Build menu → City buildings**. An office earns from arriving workers, a hospital from patients, a hotel from guests and a shop from customers. A bus carries three paying visitors. Connected businesses do not produce passive income while idle.
4. Tap any building to see its visitors, lifetime revenue, next upgrade effects, current/next appearance, paint colors and demolition refund. There are five levels, with distinct architecture: a clinic develops into a grand medical campus; offices become glass towers and hotels become luxury hotels.
5. Extend roads and plan neighborhoods. Open the city board to claim completed contracts, invest in districts and accept optional events. Contracts repeat and scale with completed objectives.

| Building | Purchase | Starting benefit | Upgrade effect |
| --- | --- | --- | --- |
| Home | 120 | 20 residents; more trips | More residents and traffic; larger architecture |
| Shop | 240 | 8 coins/customer; 18 people/min | Higher fees, capacity and larger shop |
| Office | 400 | 14 coins/worker; 24 people/min | Higher fees, capacity and glass towers |
| Hospital | 900 | 24 coins/patient; 12 people/min | Higher fees, capacity and medical campus |
| Hotel | 750 | 20 coins/guest; 16 people/min | Higher fees, capacity and luxury hotel |
| Park | 90 | Reduces congestion slowdown | Stronger benefit; richer gardens |

Visitor admission is limited by service capacity. Visitors arriving while admission is unavailable do not pay. Buildings need a city road connection. Business fees grow by 1.55 per level and capacities by about 1.45; inspector figures show the current values. Policies, district investments and festivals can modify receipts. Total income displays actual toll and visitor receipts from the last simulation minute.

Tolls also change appearance at every level. Capacity progresses through 45 / 70 / 100 / 140 / 190 vehicles/min. Planner toll limits are $10 / $20 / $30 / $40 / $50 at levels 1–5. Upgrading activates the newly unlocked rate; the player can lower it. Each passing vehicle pays exactly the displayed price, with no extra collection multiplier. Legacy cities retain their original $30 maximum. With only the starter road there is no free detour: build alternative roads to introduce route choices.

## Controls and progression

- Drag to pan, pinch or scroll to zoom; the minimap relocates the camera. Touch layouts support portrait play.
- Full-screen map fills the safe content area, with no decorative white border or city-title overlay. Compact balance/income sit together at top left, a small minimap is at top right, and simulation speed buttons run vertically down the right edge. Pinch/scroll still zoom; there are no zoom or locator buttons. The objective banner can be dismissed with × and restored from Build menu; dismissal persists. Quick tools: road, toll, home, office and full build menu. Undo, permanent upgrades, city development, customization and traffic view are inside Build menu. Roads and demolition support continuous brushes; a drag is one undo action. Flyovers, bridges, main roads, signals and roundabouts remain available.
- Pause or choose 1× / 2× / 3×. Space toggles pause when the map has focus. Background tabs stop simulation. Low-power mode limits rendering resolution and vehicle supply.
- Tap roads for congestion, actual recent flow, travel time, toll income and history. Drivers replan when the network or tolls change.
- Customize the city name, landscape, road color, evening lights, labels, sound, policy and building paint.
- The city board offers repeatable contracts, six career milestones, five districts and optional repeating events. Permanent upgrades improve traffic, capacity, demand, congestion and offline rewards.
- Undo reverses construction and building/booth upgrades while preserving subsequently earned money and visitor receipts. Up to 30 session actions are retained.
- Offline rewards estimate earnings from the saved recent income rate, starting at 50% efficiency for up to eight hours. This is a separate collectable reward; patient movement is not simulated while closed.

## Saves and previous cities

Planner progress saves locally under `toll-empire-planner-v4`, with a recovery copy. New Planner mode deliberately starts with empty plots. The original `toll-empire-v1` city is left untouched. If present, **Menu → Download previous city backup** exports that older city. Importing its backup restores the legacy world and its previous economy, scenery and staged Hospital/Stadium/Transit projects. Those legacy projects are hidden in new Planner cities, which use purchasable, directly upgradeable businesses.

**Customize → Download city backup** exports the active city. Import validates the file and requests confirmation before replacing the active city. Browser storage is specific to the origin: localhost and 127.0.0.1 have separate saves. There is no cloud synchronization. Progress saves every 15 seconds and after changes; reset requires confirmation.

## Validation and implementation

Run:

```sh
npm test
npm run check
node scripts/benchmark.mjs
```

122 tests cover empty-city initialization, increased real traffic from homes, arrival-based business receipts, admission capacity, road disconnection, buses, visually distinct building tiers, upgrade effects, toll bonuses, save isolation and visitor ledger preservation through undo. Existing traffic, routing, bridges, flyovers, signals, queues, contracts, districts, events, legacy landmarks and storage tests remain. Syntax checks cover all application scripts. Version 0.9.0 also has an isolated Chromium smoke checks of the served and offline Canvas app: new building-menu entries, parking tool selection, mayor report, and HUD/objective spacing at a mobile-width viewport. Visual captures are `city-campus-mobile.png` and `mayor-report-mobile.png`.

The benchmark runs a deterministic 20-minute developed Planner city and verifies continuing trips, toll receipts and business arrivals. It measures simulation CPU time, not Android rendering frame rate. Desktop and 390×844 portrait browser checks cover placing buildings, buying an upgrade, before/after previews and actual hospital receipts.

`src/planner.js` handles visitor demand and receipts; `architecture.js` draws level-specific buildings, tolls and upgrade previews; `balance.js` contains prices and tuning; `simulation.js` handles traffic, construction and undo; `growth.js` handles development; `world.js` creates planner/legacy maps; `storage.js` preserves profiles; `renderer.js` draws the city; `app.js`, `city-ui.js` and `tutorial.js` handle controls and guidance.

The world is 64×64 tiles (4,096 plots), expanded from 40×40. Older saves migrate automatically, remapping road/booth/structure nodes while keeping buildings at their original coordinates. Building levels and district investments are finite, while contracts, events and traffic continue. Long-term retention and low-end Android frame rates have not been measured. Traffic uses a tile-capacity model rather than individual lane changes. This release has no real ads or multiplayer.

Zoom clarity: buildings, trees, road chunks and property grounds now use 4x raster caches, covering the maximum 2.5x zoom at DPR 1.5. Tree branch and foliage highlights add close-up definition. Drawing resolution and save data are unchanged.

Zoom-out performance fix: raster caches adapt to projected zoom (1x/2x/4x); zooming out releases large textures and uses a full-map low-resolution terrain cache to avoid repeated chunk rebuilding. Maximum zoom retains sharp 4x art.

## Mayor Drive
Build menu > Mayor Drive starts a session-only mayor car at a clear city entrance. Hold Drive or W/Up to accelerate; Brake or S/Down stops. A/Left and D/Right queue road-relative turns at the next available junction. R queues a marked U-turn and E chooses a ground/flyover ramp connection. Traffic, following distance, toll queues and signals remain active; city-owned travel creates no toll receipts. The camera follows the car, with nearby building/district/traffic information. Exit drive restores the previous camera and pause state. Saves retain the city and never persist a temporary driving session.

Validation: 144 tests, 50 application syntax checks and isolated browser entry/control/exit regression. Phone testing and APK refresh remain deferred.
