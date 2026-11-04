# City improvement phases

Work stays on `codex/isometric-2-5d`. Each completed phase is checked and pushed independently. Existing player saves are preserved. Browser checks use isolated temporary profiles; phone testing is deferred to the owner after all phases.

## Phase 1 - City overlays (complete)
Build menu > City overlays offers disconnected roads/buildings, congestion, hospital/police/university/park road coverage, and live parking occupancy. Coverage follows the same road-distance and upgrade rules as the mayor report. Diagnostics never change the city. Overlay data refreshes at most twice per simulation second.

Validation: 127 Node tests; 43 syntax checks; 11 isolated Chrome checks at 390x844, no runtime exceptions.

## Remaining phases
2. Construction quotes, footprints, connection feedback and rejection reasons.
3. District, service, traffic and visitor objectives.
4. Bounded satisfaction demand/reward effects and economy playtesting.
5. Bus stops and actual vehicles following configured routes.
6. Building rotation, safe relocation and city decorations; final regression and performance checks.
