# Palm Bay — build and visual review

The game was built, run in Chromium, captured at 1440 × 960 and 390 × 844, reviewed, and revised through multiple capture passes. The final artifacts are generated from the production build.

## Problems found and corrected

1. **Too much empty foreground.** The first camera was excessively high and the arrival view looked across the empty filling-station forecourt. Arrival moved to the waterfront, the camera was lowered, and its framing now keeps the player and nearby car together. Driving uses a lower chase view with speed-dependent lookahead.
2. **Cars looked unfinished.** Reversed cabin winding hid the glazing. The faces were corrected. Each vehicle now has its own paint material so damage visibly darkens and compresses that car, with bent bodywork, displaced bumpers, cracked glass, and a collapsed cabin on wrecks.
3. **Insufficient city identity.** The city gained a coral waterfront motel with an art-deco tower, stronger facade colors, shop signage, awnings, roof details, marked crossings, working junction indicators, and a continuous coastal promenade.
4. **Top-end acceleration was weak.** Drag overpowered the original acceleration curve. Tuning now gets the sport coupe to about 100 km/h in three seconds while preserving braking, reverse, and lateral slip.
5. **Traffic jammed over time.** A five-minute simulation exposed off-center lane tracking and permanent queues. Segment lookahead now keeps vehicles in their lanes; junction priority and distant AI recovery keep circulation alive. The regression test finishes with 21 moving traffic vehicles and no vehicles stuck for more than 18 seconds.
6. **Mobile controls overlapped the interaction card, and the car was clipped.** Touch controls, the map, and telemetry were separated vertically. Portrait camera distance and framing now fit both the player and the nearby car.
7. **State changes left stale HUD content.** Vehicle condition, location, speed, prompts, and toast state now reset correctly. Screenshot capture waits for HUD transitions to settle.
8. **Rendering and loading needed polish.** Shadow resolution and device pixel ratio are capped; static city geometry is merged. Fonts are bundled locally and the application has no runtime external dependencies. The production bundle is split into game code and the rendering library.
9. **Fine bands were visible on otherwise flat ground.** Explicit face normals, correct closed-mesh sidedness, and ground that receives shadows without casting onto itself removed the bands. The final captures retain clean solid-color surfaces and long building and palm shadows.
10. **Drift trails broke into crosswise dashes.** Skid segments now join each rear wheel's previous and current contact positions, with their orientation derived from actual travel instead of car heading.
11. **Exiting a wreck could swing the camera across a neighboring roof.** The walking camera now retains the chase camera's direction on exit, preserving orientation and avoiding the forced turn across nearby buildings.

## Verification

- `npm run build`: production assets generated successfully.
- `npm test`: simulation coverage includes the complete car-replacement loop, moving-traffic theft, physical damage and wrecks, steering and skid marks, jumping and landing, deterministic state, walking collisions, five-minute traffic circulation, and recovery without repair.
- `npm run test:browser`: 16 checks exercise the real keyboard-driven loop and the deterministic review interface, including walking from a wreck to a fresh car and taking it.
- `npm run capture`: 10 screenshots plus a structured state report. No browser runtime or resource errors were reported.
- Hardware-accelerated Chromium on an Apple M3 Max sustained approximately 120 FPS at 1440 × 960 after warmup. Screenshot-taking and shader compilation are excluded from that measurement; performance is hardware dependent.

## Capture index

| File | What it verifies |
| --- | --- |
| `01-arrival.png` | Immediate playable entry, city composition, player, car, and interaction |
| `02-driving.png` | Chase camera, road readability, speed and vehicle condition |
| `03-drift.png` | Steering, tire marks, collision effects |
| `04-coast.png` | Beach, promenade, long shadows and coastal street |
| `05-crash.png` | Actual wreck, smoke, body damage and exit instruction |
| `06-exit.png` | Return to walking after a wreck |
| `07-ramp.png` | Airborne vehicle and boardwalk jump |
| `08-pause.png` | Pause screen and controls |
| `09-mobile.png` | Portrait layout and touch controls |
| `10-city-overview.png` | Alternate camera and city geometry |
