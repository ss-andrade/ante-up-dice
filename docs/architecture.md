# Architecture

Ante Up Dice is a static React PWA with no backend or external runtime assets.

- `src/engine.ts` owns content and pure transitions: seeded PRNG, evaluation, eight table modifiers, ordered scoring, 26 charms, shops, progression, history, and stats.
- `src/save.ts` validates schema v2, migrates active schema-v1 MVP saves, and rejects malformed or inconsistent states.
- `src/simulation.ts` drives the same public engine transitions with a baseline hold/shop heuristic. It has no privileged scoring path.
- `src/App.tsx` renders menu, briefing, onboarding, table, shop, help/settings, and recaps. It persists active states after transitions.
- `src/style.css` supplies the local tabletop presentation and desktop/portrait reflow.

State flows as user intent → guarded pure transition → `RunState` → localStorage → render. Dice, shop selection, and simulations consume xorshift32 state, so the same seed and choices reproduce exactly. `scoreHand` is pure and applies: category base → dice sum → current table modifier → owned charms in catalog order → final base × multiplier. Its structured `ScoreStep` data powers previews and previous-score explanations.

The active save key is `ante-up-dice.save.v2`; settings and high score use separate keys. A valid active `v1` save is migrated once to v2 with its seed, position, dice, cash, and known charms retained, while new table targets/stats are initialized safely. Finished and corrupt saves are not continued.

Vitest covers engine rules, scoring order, shop decisions, migration, components, the 1,000-run report, and full-run fixtures. Playwright covers real roll/hold/score, persistence, shop/table transition, both outcomes, and a mobile viewport assertion. Vite PWA precaches the built shell and local SVG icon.
