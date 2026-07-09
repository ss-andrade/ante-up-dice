# Architecture

The app is a static React PWA. `src/engine.ts` is a framework-free deterministic domain module; `src/App.tsx` is the view/controller and persistence adapter; `src/style.css` is the responsive tabletop presentation. Vite bundles everything and the PWA plugin generates the manifest and precaching service worker. There is no backend.

State flows user intent → guarded pure transition → `RunState` → localStorage → render. Dice and shop selection consume a xorshift32 seed, so outcomes reproduce in tests. Evaluation returns all valid categories; scoring applies equipped charms in stable catalog order and returns a visible base × multiplier equation.

Storage uses `ante-up-dice.save.v1` and a separate high score. The embedded version field is the migration boundary. Malformed JSON safely falls back to the menu.

Testing layers are Vitest for engine invariants, Testing Library for entry UI, and Playwright for real desktop/mobile smoke flows. CI runs lint, strict typecheck, tests, and build. Issues map as follows: #1 engine, #2 scoring/content, #3 progression, #4 UI, #5 shop/save, #6 PWA/accessibility, #7 quality/docs.
