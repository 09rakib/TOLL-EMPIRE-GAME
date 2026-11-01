# Toll Empire · v0.8.0: L-shaped offices and working parking

A mobile-friendly city and toll tycoon built with JavaScript and Canvas. The supplied mockups remain in `references/`; game buildings are drawn with Canvas. No runtime dependencies.

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

Android validation: `assembleDebug` succeeds and `lintDebug` reports zero errors (four advisory warnings). Installed and launched on a real Vivo V2405A with the ADB server tunnel absent. Native system-bar spacing is handled by the host layout. Some Vivo devices require approval in Super Care when installing or updating an APK from outside the Vivo store.

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

80 tests cover empty-city initialization, increased real traffic from homes, arrival-based business receipts, admission capacity, road disconnection, buses, visually distinct building tiers, upgrade effects, toll bonuses, save isolation and visitor ledger preservation through undo. Existing traffic, routing, bridges, flyovers, signals, queues, contracts, districts, events, legacy landmarks and storage tests remain. Syntax checks cover all application scripts.

The benchmark runs a deterministic 20-minute developed Planner city and verifies continuing trips, toll receipts and business arrivals. It measures simulation CPU time, not Android rendering frame rate. Desktop and 390×844 portrait browser checks cover placing buildings, buying an upgrade, before/after previews and actual hospital receipts.

`src/planner.js` handles visitor demand and receipts; `architecture.js` draws level-specific buildings, tolls and upgrade previews; `balance.js` contains prices and tuning; `simulation.js` handles traffic, construction and undo; `growth.js` handles development; `world.js` creates planner/legacy maps; `storage.js` preserves profiles; `renderer.js` draws the city; `app.js`, `city-ui.js` and `tutorial.js` handle controls and guidance.

The world is 64×64 tiles (4,096 plots), expanded from 40×40. Older saves migrate automatically, remapping road/booth/structure nodes while keeping buildings at their original coordinates. Building levels and district investments are finite, while contracts, events and traffic continue. Long-term retention and low-end Android frame rates have not been measured. Traffic uses a tile-capacity model rather than individual lane changes. This release has no real ads or multiplayer.
