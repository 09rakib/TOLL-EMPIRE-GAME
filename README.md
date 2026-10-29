# Toll Empire · v0.4.0: build your own city

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

Tolls also change appearance at every level. Capacity progresses through 45 / 70 / 100 / 140 / 190 vehicles/min. Each extra level grants a clearly labeled 15% city collection bonus; drivers choose routes using the posted toll price. With only the starter road there is no free detour: build alternative roads to introduce route choices.

## Controls and progression

- Drag to pan, pinch or scroll to zoom; the minimap relocates the camera. Touch layouts support portrait play.
- Quick tools: road, toll, home, office and full build menu. Roads and demolition support continuous brushes; a drag is one undo action. Flyovers, bridges, main roads, signals and roundabouts remain available.
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

57 tests cover empty-city initialization, increased real traffic from homes, arrival-based business receipts, admission capacity, road disconnection, buses, visually distinct building tiers, upgrade effects, toll bonuses, save isolation and visitor ledger preservation through undo. Existing traffic, routing, bridges, flyovers, signals, queues, contracts, districts, events, legacy landmarks and storage tests remain. Syntax checks cover all application scripts.

The benchmark runs a deterministic 20-minute developed Planner city and verifies continuing trips, toll receipts and business arrivals. It measures simulation CPU time, not Android rendering frame rate. Desktop and 390×844 portrait browser checks cover placing buildings, buying an upgrade, before/after previews and actual hospital receipts.

`src/planner.js` handles visitor demand and receipts; `architecture.js` draws level-specific buildings, tolls and upgrade previews; `balance.js` contains prices and tuning; `simulation.js` handles traffic, construction and undo; `growth.js` handles development; `world.js` creates planner/legacy maps; `storage.js` preserves profiles; `renderer.js` draws the city; `app.js`, `city-ui.js` and `tutorial.js` handle controls and guidance.

The world is 40×40 tiles. Building levels and district investments are finite, while contracts, events and traffic continue. Long-term retention and low-end Android frame rates have not been measured. Traffic uses a tile-capacity model rather than individual lane changes. This release has no real ads or multiplayer.
