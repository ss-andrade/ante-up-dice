import { describe, expect, it, vi } from "vitest";
import { TABLES, enterTable, newRun, scoreTurn } from "./engine";
import {
  LEGACY_SAVE_KEY,
  SAVE_KEY,
  isRunState,
  loadSavedRun,
  parseSavedRun,
} from "./save";
describe("schema v2 saves", () => {
  it("accepts current state", () => expect(isRunState(newRun(7))).toBe(true));
  it.each([
    ["future version", { ...newRun(7), version: 3 }],
    ["bad die", { ...newRun(7), dice: [0] }],
    ["bad table", { ...newRun(7), tableId: "counterfeit" }],
    ["bad target", { ...newRun(7), target: 1 }],
    ["unknown charm", { ...newRun(7), charms: ["counterfeit"] }],
    ["duplicate charm", { ...newRun(7), charms: ["brass-tack", "brass-tack"] }],
  ])("rejects %s", (_, value) => expect(isRunState(value)).toBe(false));
  it("rejects malformed JSON", () => {
    expect(parseSavedRun("{")).toBeNull();
    expect(parseSavedRun('{"version":2}')).toBeNull();
  });
  it.each([
    [
      "best hand category",
      (run: ReturnType<typeof newRun>) => ({
        ...run,
        stats: {
          ...run.stats,
          bestHand: { category: "counterfeit", score: 2 },
        },
      }),
    ],
    [
      "best hand score",
      (run: ReturnType<typeof newRun>) => ({
        ...run,
        stats: { ...run.stats, bestHand: { category: "pair", score: "huge" } },
      }),
    ],
    [
      "history entry",
      (run: ReturnType<typeof newRun>) => ({
        ...run,
        history: [{ table: 99, category: "pair", score: 4 }],
      }),
    ],
    [
      "last score category",
      (run: ReturnType<typeof newRun>) => ({
        ...run,
        lastScore: { category: "counterfeit" },
      }),
    ],
    [
      "last score step",
      (run: ReturnType<typeof newRun>) => ({
        ...run,
        lastScore: {
          category: "pair",
          categoryBase: 10,
          diceContribution: 12,
          base: 22,
          mult: 2,
          chips: 44,
          tableStep: { source: 3, detail: "bad" },
          charmSteps: [],
        },
      }),
    ],
  ])("rejects malformed nested %s", (_, corrupt) =>
    expect(isRunState(corrupt(newRun(7)))).toBe(false),
  );
  it("round-trips a valid scored state with nested history and score details", () => {
    const scored = scoreTurn(
      { ...enterTable(newRun(7)), dice: [2, 2, 3, 4, 5] },
      "pair",
    );
    expect(parseSavedRun(JSON.stringify(scored))).toEqual(scored);
  });
  it("migrates active v1 saves and safely adopts new targets", () => {
    const old = {
      version: 1,
      seed: 44,
      ante: 2,
      score: 120,
      target: 260,
      cash: 9,
      hands: 3,
      rolls: 2,
      dice: [1, 2, 3, 4, 5],
      held: [true, false, false, false, false],
      charms: ["brass-tack"],
      shop: [],
      refreshes: 0,
      status: "playing",
    };
    const migrated = parseSavedRun(JSON.stringify(old));
    expect(migrated).toMatchObject({
      version: 2,
      seed: 44,
      ante: 2,
      tableId: TABLES[1]!.id,
      target: TABLES[1]!.target,
      status: "playing",
    });
  });
  it("rejects a legacy shop below the adopted target", () => {
    const old = {
      version: 1,
      seed: 44,
      ante: 2,
      score: 0,
      target: 260,
      cash: 9,
      hands: 3,
      rolls: 2,
      dice: [],
      held: [false, false, false, false, false],
      charms: [],
      shop: ["brass-tack"],
      refreshes: 0,
      status: "shop",
    };
    expect(parseSavedRun(JSON.stringify(old))).toBeNull();
  });
  it.each([
    [
      "shop below target",
      { ...newRun(7), status: "shop", shop: ["brass-tack"] },
    ],
    ["briefing with score", { ...newRun(7), score: 1 }],
    ["briefing with dice", { ...newRun(7), dice: [1, 2, 3, 4, 5] }],
    ["playing with partial dice", { ...enterTable(newRun(7)), dice: [1, 2] }],
    ["empty playing hand without rolls", { ...enterTable(newRun(7)), rolls: 0 }],
    [
      "rolled playing hand with all rolls remaining",
      { ...enterTable(newRun(7)), dice: [1, 2, 3, 4, 5], rolls: 3 },
    ],
    ["invalid held length", { ...enterTable(newRun(7)), held: [false] }],
    [
      "win before table eight",
      { ...newRun(7), status: "won", score: TABLES[0]!.target },
    ],
    ["loss with hands remaining", { ...enterTable(newRun(7)), status: "lost" }],
    [
      "duplicate offers",
      {
        ...newRun(7),
        status: "shop",
        score: TABLES[0]!.target,
        shop: ["brass-tack", "brass-tack"],
      },
    ],
    [
      "owned shop offer",
      {
        ...newRun(7),
        status: "shop",
        score: TABLES[0]!.target,
        charms: ["brass-tack"],
        shop: ["brass-tack"],
      },
    ],
    [
      "over-cap inventory",
      {
        ...newRun(7),
        charms: [
          "brass-tack",
          "even-keel",
          "odd-job",
          "pocket-change",
          "double-stitch",
          "steady-hand",
        ],
      },
    ],
    ["mismatched ante target", { ...newRun(7), target: TABLES[1]!.target }],
    ["playing with refreshes", { ...enterTable(newRun(7)), refreshes: 1 }],
    ["briefing with skipped shop", { ...newRun(7), skippedShop: true }],
    [
      "lost with offers",
      {
        ...enterTable(newRun(7)),
        status: "lost",
        hands: 0,
        dice: [],
        shop: ["brass-tack"],
      },
    ],
    [
      "won with refreshes",
      {
        ...newRun(7),
        ante: 8,
        tableId: TABLES[7]!.id,
        target: TABLES[7]!.target,
        score: TABLES[7]!.target,
        status: "won",
        refreshes: 1,
        stats: { ...newRun(7).stats, tableReached: 8 },
      },
    ],
  ])("rejects impossible lifecycle: %s", (_, value) =>
    expect(isRunState(value)).toBe(false),
  );
  it("accepts clean terminal states", () => {
    const base = enterTable(newRun(7));
    expect(isRunState({ ...base, status: "lost", hands: 0, dice: [] })).toBe(
      true,
    );
    expect(
      isRunState({
        ...base,
        ante: 8,
        tableId: TABLES[7]!.id,
        target: TABLES[7]!.target,
        score: TABLES[7]!.target,
        status: "won",
        stats: { ...base.stats, tableReached: 8 },
      }),
    ).toBe(true);
  });
  it("moves a legacy key to v2 storage", () => {
    const legacy = JSON.stringify({
      version: 1,
      seed: 3,
      ante: 1,
      score: 0,
      target: 120,
      cash: 5,
      hands: 4,
      rolls: 3,
      dice: [],
      held: [false, false, false, false, false],
      charms: [],
      shop: [],
      refreshes: 0,
      status: "playing",
    });
    const map = new Map([[LEGACY_SAVE_KEY, legacy]]);
    const storage = {
      getItem: vi.fn((k: string) => map.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => map.set(k, v)),
      removeItem: vi.fn((k: string) => {
        map.delete(k);
      }),
    };
    expect(loadSavedRun(storage)?.version).toBe(2);
    expect(storage.setItem).toHaveBeenCalledWith(SAVE_KEY, expect.any(String));
    expect(storage.removeItem).toHaveBeenCalledWith(LEGACY_SAVE_KEY);
  });
});
