# Ante Up Dice — Game Design Document

## Elevator pitch

Ante Up Dice is a brisk single-player dice-poker roguelike played across eight increasingly demanding casino tables. Each hand offers five dice, three rolls, and meaningful hold decisions. Scored patterns earn chips toward the current target; clearing it opens a backroom shop whose odd little charms reshape deterministic scoring. A full run takes roughly 15–25 minutes, works offline, and never hides the arithmetic.

## Design principles

1. **Readable luck.** Random results create problems, while every scoring consequence is inspectable before committing.
2. **Short, consequential decisions.** Hold, reroll, category, purchase, refresh, or leave—each action changes the run.
3. **Tactile restraint.** Felt, cream dice, brass trim, physical depth, concise animation, no copied casino assets.
4. **Fair runs.** A seeded generator and fixed effect order make identical state and input produce identical results.
5. **Playable everywhere.** Portrait is reorganized, controls are keyboard/touch friendly, and the installed game is offline.

## Rules and loop

Start with $5 and four scoring hands. A hand begins empty. Roll all five dice, click/tap any dice to hold, and use the remaining rolls to reroll only loose dice. There are at most three rolls total. After any roll, select any enabled poker category and score it; the highest nominal valid category is preselected. The result is added to the table score and the hand is spent.

Reach the target at any point to clear the ante, collect its cash reward, and visit the shop. If four hands are spent below target, the run ends. After shopping, the next ante resets table score, hands, rolls, dice, and refresh price while preserving cash and charms. Clearing ante eight wins. Up to five charms may be carried.

## Scoring model

Each category has base chips and a multiplier. Charms modify these values in stable catalog order. Final chips = modified base × modified multiplier. A pattern may qualify for several categories (a full house also contains a pair); the player can choose any enabled category. Straights require distinct consecutive values. A Short Run needs any four consecutive values among five dice; a Grand Run is exactly 1–5 or 2–6.

| Category | Requirement | Base | Mult | Nominal |
|---|---|---:|---:|---:|
| Open Table | Any five dice | 8 | ×1 | 8 |
| One Pair | One matching pair | 12 | ×2 | 24 |
| Two Pair | Two different pairs | 20 | ×2 | 40 |
| Three of a Kind | Three matching | 24 | ×3 | 72 |
| Short Run | Four consecutive values | 28 | ×3 | 84 |
| Grand Run | Five consecutive values | 38 | ×4 | 152 |
| Full House | Three matching plus a pair | 35 | ×4 | 140 |
| Four of a Kind | Four matching | 48 | ×5 | 240 |
| Five of a Kind | All five matching | 70 | ×7 | 490 |

## Ante progression and economy

Every ante grants four scoring hands. Targets deliberately rise faster than baseline play so synergy becomes necessary; rewards grow to finance rarer charms. Unspent money carries forward.

| Ante | Target | Clear reward |
|---:|---:|---:|
| 1 | 120 | $7 |
| 2 | 260 | $9 |
| 3 | 480 | $11 |
| 4 | 760 | $13 |
| 5 | 1,120 | $15 |
| 6 | 1,580 | $18 |
| 7 | 2,150 | $21 |
| 8 | 2,900 | $25 |

The shop presents three unowned seeded items. Buying removes an item. A refresh costs $2, then $3, $4, and so on within that shop. The price resets next ante. Continuing without buying is always allowed. Common effects are dependable small gains; Uncommon effects reward a recognizable tactic; Rare effects enable high-ceiling builds.

## Complete modifier catalog

Effects execute in the order below, independently when applicable. Trigger names appear in score results.

| Rarity | Charm | Cost | Deterministic effect |
|---|---|---:|---|
| Common | Brass Tack | $4 | +8 base on One Pair |
| Common | Even Keel | $4 | +2 base per even die |
| Common | Odd Job | $4 | +2 base per odd die |
| Common | Pocket Change | $5 | +1 mult when cash is $5 or less |
| Uncommon | Short Fuse | $7 | +2 mult when scoring after the third/final roll |
| Uncommon | Sixth Sense | $7 | +1 mult per die showing 6 |
| Uncommon | Low Road | $7 | +12 base when every die is 4 or lower |
| Uncommon | Second Wind | $8 | +2 mult on Two Pair |
| Rare | Velvet Rope | $11 | Double base for either straight |
| Rare | Loaded Ledger | $12 | +1 mult per full $10 currently held |
| Rare | Echo Chamber | $12 | +3 mult on Four/Five of a Kind |
| Rare | House Lantern | $13 | +25 base when no die shows 1 |

## UX states

- **Main menu:** title, premise, new run, rules/accessibility, local high score. A persisted active run opens directly.
- **Table:** left run rail on desktop; compact status header on mobile. Charm slots sit above five semantic dice. The category tray disables invalid hands, and the bottom equation remains close to roll/score actions.
- **Shop:** clear cash, rarity, effect, cost, affordability, slot limit, refresh cost, and a guaranteed continue action.
- **Outcome:** distinctive victory/loss copy, final table score, ante reached, charms owned, and immediate replay/menu actions.
- **Help/settings:** rules, complete table, charm explanation, keyboard guidance, and sound toggle.

Rolls and scoring use brief transform/number cues. `prefers-reduced-motion` collapses them. Audio is an optional short WebAudio oscillator cue, generated locally without files.

## Accessibility

All actions are native buttons with visible focus and at least 44px targets. Dice expose value and held state through labels and `aria-pressed`; held state uses text, outline, and glow rather than color alone. Pips retain a spoken label. Modals have dialog semantics and close controls. High contrast cream/gold on deep green supports readability. Layout is fully usable at 320px and reflows—not scales—into stacked portrait regions. Reduced motion is honored. Gameplay does not require sound or fine pointer control.

## Save model

The complete `RunState` is JSON in `ante-up-dice.save.v1`: schema version, PRNG seed, ante, target/score, cash, hands/rolls, dice/holds, charm IDs, shop IDs, refresh count, and status. High score uses a separate key. Writes happen after state changes. Malformed data falls back safely; later schema versions must migrate by version before render. Saves never leave the device and contain no personal data.

## Balancing notes

Ante one is clearable with a decent Full House or two medium hands, teaching category value. Ante two encourages the first purchase. Late targets expect two or more synergistic charms and deliberate pursuit rather than chance scoring. Multipliers are more volatile than base bonuses, so their costs and conditions are higher. Loaded Ledger competes directly with spending; Pocket Change rewards the opposite. The five-slot cap prevents universal stacking. Fixed four-hand tables keep pacing legible. Future telemetry must be opt-in and is not part of this product; balance should use local simulations and playtests.

## MVP acceptance criteria

- Nine listed categories evaluate correctly and any valid category can be selected.
- Holds persist across rerolls; exactly three rolls and four scoring hands are enforced.
- All twelve listed charms apply deterministic, readable effects with a five-slot cap.
- Eight targets, rewards, shops, refreshes, victory, loss, summary, new run, continued local run, and high score function.
- Desktop resembles an original tactile casino table; portrait remains comfortably playable.
- Rules and scoring are available in-app and here; keyboard, touch, focus, labels, reduced motion, and optional sound are supported.
- The app installs, precaches for offline use, builds for `/ante-up-dice/`, and contains no external service dependency.
- Strict typecheck, lint, unit/component tests, production build, and desktop/mobile browser smoke tests pass.

## Future ideas

Daily shareable seeds, branching tables, face restrictions, wager encounters, score-history replays, charm ordering for explicitly order-dependent content, unlockable cosmetic dice/table materials, localization, save import/export, and a practice probability view.
