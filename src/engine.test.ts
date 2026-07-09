import { describe, expect, it } from "vitest";
import {
  CATEGORY_ORDER,
  CHARMS,
  TABLES,
  buy,
  doRoll,
  enterTable,
  evaluate,
  newRun,
  nextAnte,
  refresh,
  rng,
  scoreHand,
  scoreTurn,
  sell,
  skipShop,
  toggleHold,
  type Category,
  type Pip,
  type RunState,
} from "./engine";

const playing = (seed = 1) => enterTable(newRun(seed));
describe("deterministic engine", () => {
  it("repeats PRNG and rolls for a seed", () => {
    expect(rng(42)).toEqual(rng(42));
    expect(doRoll(playing(42)).dice).toEqual(doRoll(playing(42)).dice);
  });
  it.each<[Pip[], Category]>([
    [[1, 2, 3, 4, 5], "largeStraight"],
    [[2, 2, 2, 3, 3], "fullHouse"],
    [[6, 6, 6, 6, 6], "fiveKind"],
    [[1, 1, 4, 4, 6], "twoPair"],
    [[3, 3, 3, 3, 5], "pair"],
  ])("evaluates %j as %s", (dice, category) =>
    expect(evaluate(dice)).toContain(category),
  );
  it("does not evaluate incomplete dice", () =>
    expect(evaluate([1, 2])).toEqual([]));
  it("preserves held dice and counts only rerolls", () => {
    let state = doRoll(playing(7));
    const first = state.dice[0];
    state = toggleHold(state, 0);
    state = doRoll(state);
    expect(state.dice[0]).toBe(first);
    expect(state.stats.rerolls).toBe(1);
  });
  it("enforces briefing and transition guards", () => {
    const state = newRun(1);
    expect(doRoll(state)).toBe(state);
    expect(scoreTurn(state)).toBe(state);
    expect(buy(state, "brass-tack")).toBe(state);
  });
  it("contains eight distinct playable table rules", () => {
    expect(TABLES).toHaveLength(8);
    expect(new Set(TABLES.map((t) => t.id)).size).toBe(8);
    expect(
      TABLES.every((t) => t.target > 0 && t.reward > 0 && t.rule.length > 20),
    ).toBe(true);
  });
  it("contains 24+ unique tiered charms with timing and prices", () => {
    expect(CHARMS.length).toBeGreaterThanOrEqual(24);
    expect(new Set(CHARMS.map((c) => c.id)).size).toBe(CHARMS.length);
    expect(new Set(CHARMS.map((c) => c.rarity))).toEqual(
      new Set(["Common", "Uncommon", "Rare"]),
    );
    expect(CHARMS.every((c) => c.cost > 0 && c.timing && c.text)).toBe(true);
  });
});

describe("ordered scoring pipeline", () => {
  it("shows category base, dice contribution, table step, charms, and total", () => {
    const score = scoreHand(
      [2, 2, 4, 5, 6],
      "pair",
      ["brass-tack", "even-keel"],
      10,
      1,
      { ante: 2, hands: 4, held: [true, true, false, false, false] },
    );
    expect(score).toMatchObject({
      categoryBase: 10,
      diceContribution: 19,
      base: 55,
      mult: 2,
      chips: 110,
    });
    expect(score.tableStep.source).toBe(TABLES[1]!.name);
    expect(score.charmSteps.map((s) => s.source)).toEqual([
      "Brass Tack",
      "Even Keel",
    ]);
  });
  it.each(TABLES.map((_, i) => i + 1))(
    "applies a visible rule step at table %i",
    (ante) => {
      const score = scoreHand([2, 2, 3, 4, 6], "pair", [], 6, 0, {
        ante,
        hands: 3,
        held: [true, true, true, false, false],
      });
      expect(score.tableStep.source).toBe(TABLES[ante - 1]!.name);
      expect(score.base).toBeGreaterThan(0);
    },
  );
  it("executes transforms in catalog order and records their exact base delta", () => {
    const score = scoreHand(
      [2, 2, 3, 3, 6],
      "twoPair",
      ["double-stitch", "silver-pair"],
      8,
      1,
      { ante: 2 },
    );
    expect(score.charmSteps).toMatchObject([
      { source: "Double Stitch", baseDelta: 6 },
      { source: "Silver Pair", baseDelta: 50 },
    ]);
    expect(score.base).toBe(100);
  });
  it("records Velvet Rope after earlier ordered base triggers", () => {
    const score = scoreHand(
      [1, 2, 3, 4, 5],
      "largeStraight",
      ["sequence-key", "velvet-rope"],
      8,
      1,
      { ante: 6 },
    );
    expect(score.charmSteps).toMatchObject([
      { source: "Sequence Key", baseDelta: 18 },
      { source: "Velvet Rope", baseDelta: 89 },
    ]);
    expect(score.base).toBe(178);
  });
  const effectMatrix: Array<
    [string, Pip[], Category, number, number, boolean[]]
  > = [
    ["brass-tack", [2, 2, 3, 4, 5], "pair", 8, 1, []],
    ["even-keel", [2, 1, 1, 1, 1], "chance", 8, 1, []],
    ["odd-job", [1, 2, 2, 2, 2], "chance", 8, 1, []],
    ["pocket-change", [1, 2, 3, 4, 5], "chance", 5, 1, []],
    ["double-stitch", [2, 2, 3, 4, 5], "pair", 8, 1, []],
    ["steady-hand", [1, 2, 3, 4, 5], "chance", 8, 1, []],
    ["last-call", [1, 2, 3, 4, 5], "chance", 8, 0, []],
    ["small-favor", [1, 3, 3, 3, 3], "chance", 8, 1, []],
    ["high-polish", [5, 1, 1, 1, 1], "chance", 8, 1, []],
    ["open-secret", [1, 2, 3, 4, 5], "chance", 8, 1, []],
    ["short-fuse", [1, 2, 3, 4, 5], "chance", 8, 0, []],
    ["sixth-sense", [6, 6, 1, 2, 3], "chance", 8, 1, []],
    ["low-road", [1, 2, 3, 4, 4], "chance", 8, 1, []],
    ["second-wind", [1, 1, 2, 2, 3], "twoPair", 8, 1, []],
    ["three-bells", [2, 2, 2, 3, 4], "threeKind", 8, 1, []],
    ["sequence-key", [1, 2, 3, 4, 6], "smallStraight", 8, 1, []],
    [
      "held-breath",
      [1, 2, 3, 4, 5],
      "chance",
      8,
      1,
      [true, false, false, false, false],
    ],
    ["rainy-purse", [1, 2, 3, 4, 5], "chance", 12, 1, []],
    ["fifth-pocket", [1, 2, 3, 4, 5], "chance", 8, 1, []],
    ["velvet-rope", [1, 2, 3, 4, 5], "largeStraight", 8, 1, []],
    ["loaded-ledger", [1, 2, 3, 4, 5], "chance", 12, 1, []],
    ["echo-chamber", [6, 6, 6, 6, 5], "fourKind", 8, 1, []],
    ["house-lantern", [2, 2, 3, 4, 5], "chance", 8, 1, []],
    ["family-seal", [2, 2, 2, 3, 3], "fullHouse", 8, 1, []],
    ["long-gallery", [1, 2, 3, 4, 5], "largeStraight", 8, 1, []],
    ["silver-pair", [2, 2, 3, 4, 5], "pair", 8, 1, []],
  ];
  it.each(effectMatrix)(
    "%s reports a step when its effect changes scoring",
    (id, dice, category, cash, rolls, held) =>
      expect(
        scoreHand(dice, category, [id], cash, rolls, { held }).charmSteps,
      ).toHaveLength(1),
  );
  const negativeEffectMatrix: typeof effectMatrix = [
    ["brass-tack", [1, 2, 3, 4, 5], "chance", 8, 1, []], ["even-keel", [1, 1, 1, 1, 1], "chance", 8, 1, []],
    ["odd-job", [2, 2, 2, 2, 2], "chance", 8, 1, []], ["pocket-change", [1, 2, 3, 4, 5], "chance", 6, 1, []],
    ["double-stitch", [1, 2, 3, 4, 5], "chance", 8, 1, []], ["steady-hand", [1, 2, 3, 4, 5], "chance", 8, 0, []],
    ["last-call", [1, 2, 3, 4, 5], "chance", 8, 1, []], ["small-favor", [3, 3, 3, 4, 4], "chance", 8, 1, []],
    ["high-polish", [1, 2, 3, 4, 4], "chance", 8, 1, []], ["open-secret", [2, 2, 3, 4, 5], "pair", 8, 1, []],
    ["short-fuse", [1, 2, 3, 4, 5], "chance", 8, 1, []], ["sixth-sense", [6, 1, 2, 3, 4], "chance", 8, 1, []],
    ["low-road", [5, 1, 2, 3, 4], "chance", 8, 1, []], ["second-wind", [2, 2, 3, 4, 5], "pair", 8, 1, []],
    ["three-bells", [1, 2, 3, 4, 5], "chance", 8, 1, []], ["sequence-key", [1, 2, 3, 4, 5], "chance", 8, 1, []],
    ["held-breath", [1, 2, 3, 4, 5], "chance", 8, 1, []], ["rainy-purse", [1, 2, 3, 4, 5], "chance", 11, 1, []],
    ["fifth-pocket", [1, 1, 2, 3, 4], "chance", 8, 1, []], ["velvet-rope", [1, 2, 3, 4, 5], "chance", 8, 1, []],
    ["loaded-ledger", [1, 2, 3, 4, 5], "chance", 11, 1, []], ["echo-chamber", [2, 2, 3, 4, 5], "pair", 8, 1, []],
    ["house-lantern", [1, 2, 3, 4, 5], "chance", 8, 1, []], ["family-seal", [1, 2, 3, 4, 5], "chance", 8, 1, []],
    ["long-gallery", [1, 2, 3, 4, 6], "smallStraight", 8, 1, []], ["silver-pair", [1, 2, 3, 4, 5], "chance", 8, 1, []],
  ];
  it.each(negativeEffectMatrix)("%s reports no step when its effect does not apply", (id, dice, category, cash, rolls, held) => expect(scoreHand(dice, category, [id], cash, rolls, { held }).charmSteps).toHaveLength(0));
  it.each([
    ["even-keel", [1, 1, 1, 1, 1] as Pip[], "chance" as Category, 8, 1, []],
    ["high-polish", [1, 2, 3, 4, 4] as Pip[], "chance" as Category, 8, 1, []],
    ["held-breath", [1, 2, 3, 4, 5] as Pip[], "chance" as Category, 8, 1, []],
  ])(
    "%s suppresses a computed zero-delta trigger",
    (id, dice, category, cash, rolls, held) =>
      expect(
        scoreHand(dice, category, [id], cash, rolls, { held }).charmSteps,
      ).toEqual([]),
  );
  it("covers every catalog charm in the effect matrix", () =>
    expect(effectMatrix.map(([id]) => id)).toEqual(
      CHARMS.map((charm) => charm.id),
    ));
});

describe("progression and shop", () => {
  const cleared = (): RunState => {
    const base = playing(4);
    return {
      ...base,
      dice: [6, 6, 6, 6, 6],
      score: base.target - 1,
      charms: ["echo-chamber"],
    };
  };
  it("clears into a unique deterministic shop", () => {
    const state = scoreTurn(cleared(), "fiveKind");
    expect(state.status).toBe("shop");
    expect(new Set(state.shop).size).toBe(state.shop.length);
    expect(state.shop).not.toContain("echo-chamber");
  });
  it("creates and refreshes unique offers deterministically from seed zero", () => {
    const zero = { ...cleared(), seed: 0 };
    const first = scoreTurn(zero, "fiveKind");
    const repeated = scoreTurn(zero, "fiveKind");
    expect(first.shop).toHaveLength(3);
    expect(new Set(first.shop).size).toBe(3);
    expect(first).toEqual(repeated);
    const refreshed = refresh(first);
    expect(refreshed).toEqual(refresh(repeated));
    expect(refreshed.refreshes).toBe(1);
    expect(new Set(refreshed.shop).size).toBe(3);
  });
  it("supports buy, sell, and two distinct refreshes before skipping", () => {
    let state = scoreTurn(cleared(), "fiveKind");
    const id = state.shop.find(
      (x) => (CHARMS.find((c) => c.id === x)?.cost ?? 99) <= state.cash,
    );
    expect(id).toBeDefined();
    if (!id) return;
    const before = state.cash;
    state = buy(state, id);
    expect(state.charms).toContain(id);
    state = sell(state, id);
    expect(state.cash).toBeLessThan(before);
    const original = state.shop;
    const once = refresh(state);
    expect(once.shop.every((offer) => !original.includes(offer))).toBe(true);
    const twice = refresh(once);
    expect(twice.refreshes).toBe(2);
    expect(twice.shop.every((offer) => !once.shop.includes(offer))).toBe(true);
    expect(refresh(twice)).toBe(twice);
  });
  it("forfeits all commerce after taking the skip bonus", () => {
    const state = scoreTurn(cleared(), "fiveKind");
    const offer = state.shop[0]!;
    const skipped = skipShop(state);
    expect(skipped).toMatchObject({
      cash: state.cash + 3,
      shop: [],
      skippedShop: true,
    });
    expect(skipShop(skipped)).toBe(skipped);
    expect(buy(skipped, offer)).toBe(skipped);
    expect(sell(skipped, "echo-chamber")).toBe(skipped);
    expect(refresh(skipped)).toBe(skipped);
    expect(nextAnte(skipped).status).toBe("briefing");
  });
  it("advances through briefing with table identity in state", () => {
    const shop = scoreTurn(cleared(), "fiveKind");
    const next = nextAnte(shop);
    expect(next).toMatchObject({
      ante: 2,
      tableId: TABLES[1]!.id,
      target: TABLES[1]!.target,
      status: "briefing",
    });
  });
  it("tracks usage, history, and best score", () => {
    const scored = scoreTurn({ ...playing(9), dice: [2, 2, 3, 4, 5] }, "pair");
    expect(scored.stats.handsScored).toBe(1);
    expect(scored.stats.categoryUsage.pair).toBe(1);
    expect(scored.stats.bestHand?.category).toBe("pair");
    expect(scored.history).toHaveLength(1);
  });
  it("defines all category counters", () =>
    expect(Object.keys(newRun(1).stats.categoryUsage)).toEqual(CATEGORY_ORDER));
  it("excludes rares after table 1 and allows a deterministic rare after table 2", () => {
    const afterOne = scoreTurn(cleared(), "fiveKind");
    expect(
      afterOne.shop.every(
        (id) => CHARMS.find((c) => c.id === id)?.rarity !== "Rare",
      ),
    ).toBe(true);
    const base = playing(1);
    const tableTwo = {
      ...base,
      ante: 2,
      tableId: TABLES[1]!.id,
      target: TABLES[1]!.target,
      score: TABLES[1]!.target - 1,
      dice: [6, 6, 6, 6, 6] as Pip[],
      stats: { ...base.stats, tableReached: 2 },
    };
    const eligible = Array.from({ length: 500 }, (_, seed) =>
      scoreTurn({ ...tableTwo, seed }, "fiveKind"),
    ).find((run) =>
      run.shop.some((id) => CHARMS.find((c) => c.id === id)?.rarity === "Rare"),
    );
    expect(eligible).toBeDefined();
  });
  it("wins table 8 without generating offers or advancing the seed", () => {
    const base = playing(991);
    const final = {
      ...base,
      ante: 8,
      tableId: TABLES[7]!.id,
      target: TABLES[7]!.target,
      score: TABLES[7]!.target - 1,
      dice: [6, 6, 6, 6, 6] as Pip[],
      refreshes: 2,
      skippedShop: true,
      shop: ["brass-tack"],
      stats: { ...base.stats, tableReached: 8 },
    };
    const won = scoreTurn(final, "fiveKind");
    expect(won).toMatchObject({
      status: "won",
      seed: 991,
      shop: [],
      refreshes: 0,
      skippedShop: false,
    });
  });
});
