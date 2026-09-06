# Palm Bay

A sunlit, low-poly driving sandbox. Walk up to a car, take it, drive through traffic, slide around a corner, hit something expensive, leave the wreck, and take another.

Six vehicle types, 62 stealable cars, 26 traffic vehicles, six named districts, a beach, a boardwalk jump, two parks, a filling station, and a pastel city. No missions, weapons, police, pedestrians, story, or music. Engine and impact sounds are synthesized locally.

## Run

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. The game starts immediately on foot next to the coral Comet GT. Press **E** to enter, then **W** to accelerate. All visual assets and fonts ship with the build; there are no runtime CDN or API dependencies.

```sh
npm run build
npm run preview
```

`dist/` is a standalone static website. Serve it over HTTP using any static host. A browser with WebGL 2 is required.

## Controls

| Action | Control |
| --- | --- |
| Walk / drive | WASD or arrow keys |
| Enter / leave the nearest car | E |
| Run on foot | Shift |
| Brake / reverse | S / down arrow |
| Handbrake | Space |
| Change camera (chase, high, fixed) | C |
| Look around | Drag the view |
| Horn | H |
| Toggle sound effects | M |
| Return a stuck car to a clear road position | R |
| Pause / controls / restart | Escape |
| Hide interface for a clean capture | F2 |

Touch driving and an enter/exit button appear on narrow screens. Recovery never repairs damage. A totaled car cannot be driven again; leave it and take another.

## Automated review

The project includes both pure simulation tests and a real browser playtest. The browser test exercises keyboard controls, pause/resume, drifting, a physical crash, exiting a wreck, **walking to a different car and stealing it**, jumping and landing, and the mobile controls.

```sh
npx playwright install chromium
npm test
npm run test:browser
npm run capture
```

Keep the dev server running for the last two commands. Set `GAME_URL` to test another server (including a production preview). Set `BROWSER_EXECUTABLE` to use an existing standalone Chromium binary. On macOS the scripts select Metal acceleration. Every test browser uses a fresh temporary context.

Captures and machine-readable reports are written to `artifacts/`. The screenshot suite covers arrival, driving, drifting, the coast, a wreck, exiting, a jump, pause, mobile, and an elevated city view. Captures wait for fonts and HUD transitions to settle.

For deterministic inspection, open `/?test=1`. Rendering continues while simulation time is controlled explicitly:

```js
game.getState();                 // JSON-safe player, vehicle, health, traffic, effects, stats
game.cars();                     // All car IDs, positions, headings and condition
game.interact();                 // Same gameplay action as E
game.step(3, { forward: 1 });     // 180 fixed physics steps
game.step(.6, { forward: 1, steer: 1, brake: true });
game.step(.5, { forward: -1, steer: 1, run: true }); // Walking input
game.camera(1);                  // 0 chase, 1 high, 2 fixed elevated view
game.pause(true);
game.pause(false);
game.setHUD(false);
game.screenshot();               // PNG data URL of the WebGL canvas, without DOM HUD
game.setManual(false);           // Return to normal keyboard-driven simulation
```

`forward` and `steer` are in `[-1, 1]`. On foot, movement is camera relative. Coordinates are meters, +X east and +Z south. Heading zero points north; positive headings turn clockwise. `game.getState().camera.yaw` gives the camera heading.

Available reset scenarios: `walking`, `driving`, `coast`, `crash`, `ramp`. For example:

```js
game.scenario('crash');
game.step(.8, { forward: 1 });  // Real collision, damage, sparks, and smoke
game.interact();               // Get out; walk to any healthy car
```

Scenarios position live simulation data; they do not substitute screenshots, fake damage, or pre-rendered animations. `window.render_game_to_text()` returns the state as JSON text, and `window.advanceTime(milliseconds)` advances the same fixed-step simulation with the current staged input. Use `game.step` to set explicit deterministic input.

## Implementation

Three.js renders flat-shaded procedural geometry, merged by material for the city. A 60 Hz deterministic simulation owns positions, velocities, health, lane following, collisions, particles, and skid marks in preallocated typed arrays. Visual resources are pooled. The camera follows momentum, looks ahead with speed, and lifts above obstructing roofs. Traffic follows lane segments, observes alternating junction priority, and can recover away from the player if obstructed; stolen cars retain their position and damage.

The data-oriented design skill informed the separation of tuning (`balance.js`), state (`gameData.js`), pure simulation (`logic.js`), and presentation/input (`board.js`). Rendering, audio, and DOM work never enter the simulation.

## Validation artifacts

- [Arrival screenshot](artifacts/01-arrival.png)
- [Coastal driving screenshot](artifacts/04-coast.png)
- [Wreck screenshot](artifacts/05-crash.png)
- [Mobile screenshot](artifacts/09-mobile.png)
- [Browser playtest report](artifacts/playtest-report.json)
- [Capture state report](artifacts/capture-report.json)
- [Visual review notes](artifacts/REVIEW.md)

Performance depends on hardware. The completed build was measured at approximately 120 FPS at 1440 × 960 in a hardware-accelerated Chromium run on an Apple M3 Max, after shader warmup. Software WebGL is substantially slower. The renderer caps device pixel ratio at 1.5.
