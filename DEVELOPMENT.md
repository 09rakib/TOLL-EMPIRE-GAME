# City improvement phases

Work stays on `codex/isometric-2-5d`. Each completed phase is checked and pushed independently. Existing player saves are preserved. Browser checks use isolated temporary profiles; phone testing is deferred to the owner after all phases.

## Phase 1 - City overlays (complete)
Build menu > City overlays offers disconnected roads/buildings, congestion, hospital/police/university/park road coverage, and live parking occupancy. Coverage follows the same road-distance and upgrade rules as the mayor report. Diagnostics never change the city. Overlay data refreshes at most twice per simulation second.

Validation: 127 Node tests; 43 syntax checks; 11 isolated Chrome checks at 390x844, no runtime exceptions.

## Phase 2 - Construction feedback (complete)
The live pointer/touch preview shows footprint, total price including clearing, city-road connection and the real validation error. Span prices come from the same planner used to build them. Existing clearing confirmation and grouped brush undo remain.

Validation: 129 tests, 44 syntax checks, 12 isolated Chrome checks.

## Remaining phases
## Phase 3 - Neighborhood goals (complete)
City development > Neighborhoods has four sequential goals in each of five districts: two connected homes, hospital coverage, 30 fresh paying visitors, then 30 seconds without jams with three local vehicles and ten fresh completed trips. Each reward can be claimed once. Progress and visitor counters persist; existing contracts/saves remain supported.

Validation: 131 tests, 45 syntax checks, 14 isolated Chrome checks. Tests exercise real admission payments, reward gating, interrupted traffic progress and save restoration.

## Phase 4 - Satisfaction economy (complete)
Planner demand is bounded between -5% and +10%, neutral at 50 satisfaction. Above 70 satisfaction, actual admitted business visits receive up to 5% extra. No bonus is created while idle; posted tolls and park ticket prices stay exact. The mayor report explains the effects. Service distance logic is shared with overlays.

Validation: 133 tests, 46 syntax checks, 15 Chrome checks. Deterministic 60-minute simulation: 1,594 completed trips, 858 toll customers, 660 business visitors, 24,492 earned coins, peak 68 vehicles; no invalid progress or cap overflow. This validates continued activity, not human retention or phone performance.

5. Bus stops and actual vehicles following configured routes.
6. Building rotation, safe relocation and city decorations; final regression and performance checks.
