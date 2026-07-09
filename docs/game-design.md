# Ante Up Dice — v1 game design

## Promise and loop

Ante Up Dice is a short solo dice-poker roguelike about reading a room, shaping a hand, and building a deterministic scoring engine. A run crosses eight original tables. Each table gives four scoring hands; each hand gives three rolls, with any dice held between rolls. Clearing the visible target awards cash and opens the Backroom. Five charm slots force specialization. Every arithmetic step is visible before scoring.

## Categories

Every category starts with its listed base, adds the sum of all five dice, and applies its multiplier. A hand may qualify for several categories and the player chooses among them.

| Category | Requirement | Base | Mult |
|---|---|---:|---:|
| Open Table | Any five dice | 6 | ×1 |
| One Pair | At least two matching | 10 | ×2 |
| Two Pair | Two different pairs | 18 | ×2 |
| Three of a Kind | At least three matching | 22 | ×3 |
| Short Run | Four consecutive values | 26 | ×3 |
| Grand Run | Five consecutive values | 36 | ×4 |
| Full House | Three matching plus a pair | 34 | ×4 |
| Four of a Kind | At least four matching | 46 | ×5 |
| Five of a Kind | All five matching | 68 | ×7 |

Pipeline order is category base → dice sum → table rule → owned charm effects in catalog order → final base × multiplier. Base never falls below one. The preview and previous-score panel show the same structured result used by progression.

## Eight tables

| # | Table | Deterministic house rule | Target | Reward |
|---:|---|---|---:|---:|
| 1 | The Brass Welcome | First scored hand gains +12 base | 155 | $8 |
| 2 | The Twins’ Parlor | Pair, Two Pair, Full House +10 base; straights −4 base | 230 | $9 |
| 3 | Quick or Quiet | Score with rolls left for +12 base; final roll gets +1 mult | 330 | $10 |
| 4 | The Evening Room | 3+ even dice +16 base; otherwise −4 base | 430 | $12 |
| 5 | The Anchor Table | 3+ held dice +1 mult; no held dice +10 base | 620 | $14 |
| 6 | The Forked Road | Straights +20 base; Three/Four/Five Kind +1 mult | 790 | $16 |
| 7 | The Rising Room | +8 base per earlier hand scored at this table | 990 | $18 |
| 8 | The Crown Vault | 3+ dice showing 4–6 get +1 mult; otherwise +8 base | 1,240 | $22 |

The rules progress from timing awareness through category, roll, face, hold, archetype, and escalating-stake decisions. No rule invalidates a category or roll, so every table remains scoreable.

## Charm catalog

Timing labels state what each deterministic trigger inspects. Effects execute in this order.

| Tier | Charm ($) | Timing | Effect |
|---|---|---|---|
| Common | Brass Tack (4) | Category | +8 base on One Pair |
| Common | Even Keel (4) | Dice | +2 base per even die |
| Common | Odd Job (4) | Dice | +2 base per odd die |
| Common | Pocket Change (5) | Economy | +1 mult at $5 or less |
| Common | Double Stitch (5) | Category | +6 base on Pair or Two Pair |
| Common | Steady Hand (5) | Roll | +8 base with a roll left |
| Common | Last Call (5) | Roll | +10 base on final roll |
| Common | Small Favor (4) | Dice | +2 base per 1 or 2 |
| Common | High Polish (5) | Dice | +2 base per 5 or 6 |
| Common | Open Secret (3) | Category | +12 base on Open Table |
| Uncommon | Short Fuse (7) | Roll | +2 mult on final roll |
| Uncommon | Sixth Sense (7) | Dice | +1 mult with at least two 6s |
| Uncommon | Low Road (7) | Dice | +18 base when every die is 4 or lower |
| Uncommon | Second Wind (8) | Category | +2 mult on Two Pair |
| Uncommon | Three Bells (8) | Category | +1 mult on Three Kind or Full House |
| Uncommon | Sequence Key (8) | Category | +18 base on either straight |
| Uncommon | Held Breath (7) | Hold | +3 base per held die |
| Uncommon | Rainy Purse (8) | Economy | +1 mult at $12 or more |
| Uncommon | Fifth Pocket (8) | Dice | +20 base with five distinct values |
| Rare | Velvet Rope (11) | Category | Double current base on either straight |
| Rare | Loaded Ledger (12) | Economy | +1 mult per full $12, capped at +3 |
| Rare | Echo Chamber (12) | Category | +3 mult on Four/Five Kind |
| Rare | House Lantern (11) | Dice | +28 base when no 1 appears |
| Rare | Family Seal (12) | Category | +2 mult on Full House |
| Rare | Long Gallery (13) | Category | +2 mult on Grand Run |
| Rare | Silver Pair (11) | Category | Double current base on Pair or Two Pair |

Pair/kind builds use Brass Tack, Double Stitch, Second Wind, Three Bells, Family Seal, Echo Chamber, and Silver Pair. Straight builds use Sequence Key, Fifth Pocket, Velvet Rope, and Long Gallery. Economy/flexible builds choose Pocket Change or Rainy Purse/Loaded Ledger alongside face/roll effects. The shop shows three distinct unowned offers; rare offers begin after table two. Players may buy, sell for half price rounded down (minimum $2), skip remaining offers once for $3, refresh twice at $2 then $3, or leave. An empty/weak shop never blocks progression.

## Complete run UX and access

The menu provides explicit Continue and overwrite-confirmed New Run. Every table begins with a briefing. First-run onboarding is skippable and replayable through settings. Table rules remain visible in play; category readiness uses the word “READY”; held dice use text, outline, pressed state, and spoken labels. Native buttons provide keyboard behavior and 44px targets. A polite live region announces holds, settles, and scores. OS reduced motion and the in-game motion setting suppress effects. Generated WebAudio is off by default, feature-detected, optional, and never required.

Active state is stored locally in schema v2: seed/PRNG, table identity, dice/holds, economy/shop, status, history, last breakdown, and cumulative stats. Active v1 saves migrate known safe fields and adopt the current table definitions; invalid or finished saves return to the menu. The recap explains a loss against its target and reports seed, table reached, total score, hands, rerolls, best hand, cash, build, and category usage.

Balance measurements and reproduction commands live in [balance.md](balance.md); release checks live in [manual-qa.md](manual-qa.md).
