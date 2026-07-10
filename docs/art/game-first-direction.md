# Ante Up Dice — Game-First Tabletop Direction

Status: implementation reference for epic #25

Primary slice: #26
Generated concepts: `docs/art/concepts/`

## Product correction

The current interface is a complete game implemented through an application metaphor: stacked bordered panels, a category grid, a calculation table, and navigation chrome. The game-first redesign replaces that page structure with a believable play surface. It does **not** restyle the existing cards.

## North star

A player should understand the screen as a casino dice table within one second:

1. Dice are physically present in a central throw zone.
2. Held dice occupy a brass-edged keep tray.
3. Scoring choices are markings/plaques on the table.
4. Score is paid into a chip pot.
5. Charms are talismans clipped to a rail.
6. Roll/score is a physical control in the thumb zone.
7. Target, hands, rolls, pause, and rules live in the table rail—not a header.

## Reference composition

### Desktop

Use a bounded oval/rounded table with these stable regions:

- **Left embedded rail:** target, banked score, hands, rolls.
- **Upper charm rail:** owned talismans, capacity, effect details on focus/activation.
- **Center:** open throw zone; dice remain the visual hero.
- **Upper-center keep tray:** held dice visibly settle into a shallow brass tray.
- **Lower-center scoring rail:** selected plaque is strongest; valid alternatives sit adjacent and can disclose remaining categories.
- **Lower pot:** chips/number communicate the score preview and committed payout.
- **Lower-right physical control:** roll/score action.
- **Upper-right rail controls:** pause/menu and rules, visually quiet but 44×44 and accessible.

### Portrait phone

The phone is a crop of the same table, not a stacked page:

1. Safe-area top rail: pause, target/banked pot, help.
2. Compact charm rail.
3. Five-die throw zone.
4. Held-dice tray.
5. Selected scoring plaque plus a compact fan/arc of alternatives.
6. Pot and primary roll/score control share the bottom thumb zone.

At 390×844, all six regions must coexist without document scrolling after a roll. Dense details use an accessible overlay/drawer; they do not force the table into a long article.

### Shop

The shop is a dealer tray:

- Owned charms hang from the upper rail.
- Three offers sit on distinct velvet pads under a warm dealer light.
- Price is a physical chip; effect text is a semantic strip beneath the object.
- Buy/sell remain real buttons even when styled as slots/plaques.
- Inventory is a rail, not a card list.
- Next table is a large bottom dealer plaque.

## Before / after contract

| Before | After | Why |
| --- | --- | --- |
| Vertical sequence of bordered sections | One edge-to-edge felt play surface with embedded rails | A physical space reads as a game; document sections read as an app |
| Header card with table status and menu | Mechanical counters and quiet rail controls | Keeps chrome subordinate to play |
| Charm cards/slots | Small talismans clipped to a charm rail | Objects create collection identity and stable spatial memory |
| Dice row inside page flow | Open throw zone plus separate keep tray | Makes roll/hold physically legible |
| Permanent 3×3 category grid | Selected wager plaque with compact alternatives/disclosure | One current decision dominates without hiding options |
| Spreadsheet-like score receipt | Chip pot plus concise expandable semantic receipt | Preserves calculation trust without dashboard aesthetics |
| Generic gold rectangular buttons | Weighty brass roll/score control and dealer plaques | Controls belong to the game world |
| Stacked shop product cards | Lit dealer pads with price chips and inventory rail | Removes ecommerce metaphor |
| Decoration-only animation | Roll settle, die lock, chip payout, and dealer-tray movement | Motion explains game state |

## Materials and tokens

- Felt: `#082d25` family, visible quiet wool grain.
- Deep recess: near-black green, not flat black.
- Aged brass: muted ochre/gold with highlight and dark oxidized edge.
- Ivory dice: warm cream with black pips, subtle cracks/scuffs, strong contact shadow.
- Chips: oxblood/cream accents; numbers always remain real text.
- Type: condensed/display face for engraved labels; readable serif/sans for details; tabular numerals for counters.
- Depth: inset rail, contact shadow, and restrained warm rim light. Avoid generic blur/glass surfaces.

## Generated-art policy

Generated concept frames are **directional references only**. Their text, dice values, counts, prices, and layouts are not game truth and must not be shipped as interactive UI.

Production-generated imagery is restricted to decorative, state-free material such as felt grain or ambient table vignette. Gameplay meaning remains semantic HTML/CSS:

- No generated score, category, charm state, pip count, price, or button label.
- Decorative image failures must leave a complete playable interface.
- Concepts use empty alt text in docs; production decorative backgrounds use CSS.
- Record prompt, provider/model, intended use, dimensions, compression, and source references in `docs/art/manifest.json`.

## Motion

- Press/hold: 100–160ms, transform/shadow feedback.
- Roll settle: <=300ms core state explanation; no input lock beyond engine commit.
- Score payout: <=300ms core chip transfer; decorative tail may continue without blocking.
- Dealer tray: 180–260ms strong ease-out.
- Table transition: rare, <=500ms, skippable/reduced-motion equivalent.
- Use transform/opacity; no `transition: all`, `ease-in`, `scale(0)`, ungated touch hover, or animated layout properties.
- Reduced motion keeps short opacity/color/shadow state feedback and removes travel/rotation.

## Accessibility and implementation constraints

- Preserve native buttons and accessible names under physical styling.
- Held/available, valid/invalid, selected/unselected cannot rely on color alone.
- Minimum practical target: 44×44; dice target: >=52px.
- Focus ring must remain visible against felt and brass.
- Enlarged text may move details to an overlay but cannot hide the current action.
- Preserve modal focus trap, Escape behavior, opener restoration, and screen-transition focus.
- Preserve deterministic engine and save behavior; never introduce `Math.random`.
- Do not add generated imagery to the initial critical path without a measured payload budget.

## First implementation slice (#26)

The first PR changes the shell and gameplay composition, not all later systems:

- Build table canvas/rail/throw zone/keep tray/scoring rail/pot/action regions.
- Re-home existing semantic data and controls into those regions.
- Use current category and score functionality underneath; #28 will deepen the wager/payout interaction.
- Use current dice behavior underneath; #27 will deepen roll/hold choreography.
- Keep shop logic intact; #29 owns dealer-tray interaction.
- Add geometry and screenshots for desktop, portrait phone, and short landscape.

The slice succeeds only if blind visual review says “casino dice table,” not “dark green dashboard.”
