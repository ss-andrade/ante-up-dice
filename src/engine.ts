export type Pip = 1 | 2 | 3 | 4 | 5 | 6;
export type Category =
  | "chance"
  | "pair"
  | "twoPair"
  | "threeKind"
  | "smallStraight"
  | "largeStraight"
  | "fullHouse"
  | "fourKind"
  | "fiveKind";
export type Rarity = "Common" | "Uncommon" | "Rare";
export type RunStatus = "briefing" | "playing" | "shop" | "won" | "lost";

export interface Charm {
  id: string;
  name: string;
  rarity: Rarity;
  cost: number;
  timing: string;
  text: string;
}
export interface TableRule {
  id: string;
  name: string;
  flavor: string;
  rule: string;
  target: number;
  reward: number;
}
export interface ScoreStep {
  source: string;
  detail: string;
  baseDelta?: number;
  multDelta?: number;
}
export interface Score {
  category: Category;
  categoryBase: number;
  diceContribution: number;
  base: number;
  mult: number;
  chips: number;
  tableStep: ScoreStep;
  charmSteps: ScoreStep[];
}
export interface RunStats {
  seed: number;
  tableReached: number;
  handsScored: number;
  rerolls: number;
  bestHand: { category: Category; score: number } | null;
  totalScore: number;
  categoryUsage: Record<Category, number>;
}
export interface HandRecord {
  table: number;
  category: Category;
  score: number;
}
export interface RunState {
  version: 2;
  seed: number;
  ante: number;
  tableId: string;
  score: number;
  target: number;
  cash: number;
  hands: number;
  rolls: number;
  dice: Pip[];
  held: boolean[];
  charms: string[];
  shop: string[];
  refreshes: number;
  skippedShop: boolean;
  status: RunStatus;
  stats: RunStats;
  history: HandRecord[];
  lastScore: Score | null;
}

export const CATEGORY_ORDER: Category[] = [
  "chance",
  "pair",
  "twoPair",
  "threeKind",
  "smallStraight",
  "largeStraight",
  "fullHouse",
  "fourKind",
  "fiveKind",
];
export const CATEGORIES: Record<
  Category,
  { name: string; base: number; mult: number; help: string }
> = {
  chance: { name: "Open Table", base: 6, mult: 1, help: "Any five dice" },
  pair: {
    name: "One Pair",
    base: 10,
    mult: 2,
    help: "At least two matching dice",
  },
  twoPair: { name: "Two Pair", base: 18, mult: 2, help: "Two different pairs" },
  threeKind: {
    name: "Three of a Kind",
    base: 22,
    mult: 3,
    help: "At least three matching dice",
  },
  smallStraight: {
    name: "Short Run",
    base: 26,
    mult: 3,
    help: "Four consecutive values",
  },
  largeStraight: {
    name: "Grand Run",
    base: 36,
    mult: 4,
    help: "Five consecutive values",
  },
  fullHouse: {
    name: "Full House",
    base: 34,
    mult: 4,
    help: "Three matching plus a pair",
  },
  fourKind: {
    name: "Four of a Kind",
    base: 46,
    mult: 5,
    help: "At least four matching dice",
  },
  fiveKind: {
    name: "Five of a Kind",
    base: 68,
    mult: 7,
    help: "All five matching",
  },
};

export const TABLES: TableRule[] = [
  {
    id: "brass-welcome",
    name: "The Brass Welcome",
    flavor: "The house spots newcomers a clean opening.",
    rule: "Your first scored hand gains +12 base.",
    target: 155,
    reward: 8,
  },
  {
    id: "twins-parlor",
    name: "The Twins’ Parlor",
    flavor: "Matching faces draw approving taps.",
    rule: "Pair, Two Pair, and Full House gain +10 base; straights lose 4 base.",
    target: 230,
    reward: 9,
  },
  {
    id: "quick-or-quiet",
    name: "Quick or Quiet",
    flavor: "The croupier rewards nerve before certainty.",
    rule: "Score with rolls left for +12 base; on the final roll gain +1 mult instead.",
    target: 330,
    reward: 10,
  },
  {
    id: "evening-room",
    name: "The Evening Room",
    flavor: "Balanced pips keep the lamps burning.",
    rule: "Three or more even dice gain +16 base; otherwise lose 4 base.",
    target: 430,
    reward: 12,
  },
  {
    id: "anchor-table",
    name: "The Anchor Table",
    flavor: "Commitment carries weight here.",
    rule: "Score with 3+ held dice for +1 mult; with none held gain +10 base.",
    target: 620,
    reward: 14,
  },
  {
    id: "forked-road",
    name: "The Forked Road",
    flavor: "Runs and ranks take different toll roads.",
    rule: "Straights gain +20 base; Three/Four/Five of a Kind gain +1 mult.",
    target: 790,
    reward: 16,
  },
  {
    id: "rising-room",
    name: "The Rising Room",
    flavor: "Every spent hand raises the chandelier.",
    rule: "Gain +8 base for each earlier hand scored at this table.",
    target: 990,
    reward: 18,
  },
  {
    id: "crown-vault",
    name: "The Crown Vault",
    flavor: "Only bold, high faces impress the final house.",
    rule: "Three or more dice showing 4–6 gain +1 mult; otherwise gain +8 base.",
    target: 1240,
    reward: 22,
  },
];
export const ANTES = TABLES.map(({ target, reward }) => ({ target, reward }));

export const CHARMS: Charm[] = [
  {
    id: "brass-tack",
    name: "Brass Tack",
    rarity: "Common",
    cost: 4,
    timing: "Category",
    text: "+8 base on One Pair.",
  },
  {
    id: "even-keel",
    name: "Even Keel",
    rarity: "Common",
    cost: 4,
    timing: "Dice",
    text: "+2 base per even die.",
  },
  {
    id: "odd-job",
    name: "Odd Job",
    rarity: "Common",
    cost: 4,
    timing: "Dice",
    text: "+2 base per odd die.",
  },
  {
    id: "pocket-change",
    name: "Pocket Change",
    rarity: "Common",
    cost: 5,
    timing: "Economy",
    text: "+1 mult while cash is $5 or less.",
  },
  {
    id: "double-stitch",
    name: "Double Stitch",
    rarity: "Common",
    cost: 5,
    timing: "Category",
    text: "+6 base on Pair or Two Pair.",
  },
  {
    id: "steady-hand",
    name: "Steady Hand",
    rarity: "Common",
    cost: 5,
    timing: "Roll",
    text: "+8 base when scoring with a roll left.",
  },
  {
    id: "last-call",
    name: "Last Call",
    rarity: "Common",
    cost: 5,
    timing: "Roll",
    text: "+10 base on the final roll.",
  },
  {
    id: "small-favor",
    name: "Small Favor",
    rarity: "Common",
    cost: 4,
    timing: "Dice",
    text: "+2 base per die showing 1 or 2.",
  },
  {
    id: "high-polish",
    name: "High Polish",
    rarity: "Common",
    cost: 5,
    timing: "Dice",
    text: "+2 base per die showing 5 or 6.",
  },
  {
    id: "open-secret",
    name: "Open Secret",
    rarity: "Common",
    cost: 3,
    timing: "Category",
    text: "+12 base on Open Table.",
  },
  {
    id: "short-fuse",
    name: "Short Fuse",
    rarity: "Uncommon",
    cost: 7,
    timing: "Roll",
    text: "+2 mult on the final roll.",
  },
  {
    id: "sixth-sense",
    name: "Sixth Sense",
    rarity: "Uncommon",
    cost: 7,
    timing: "Dice",
    text: "+1 mult when two or more 6s show.",
  },
  {
    id: "low-road",
    name: "Low Road",
    rarity: "Uncommon",
    cost: 7,
    timing: "Dice",
    text: "+18 base when every die is 4 or lower.",
  },
  {
    id: "second-wind",
    name: "Second Wind",
    rarity: "Uncommon",
    cost: 8,
    timing: "Category",
    text: "+2 mult on Two Pair.",
  },
  {
    id: "three-bells",
    name: "Three Bells",
    rarity: "Uncommon",
    cost: 8,
    timing: "Category",
    text: "+1 mult on Three of a Kind or Full House.",
  },
  {
    id: "sequence-key",
    name: "Sequence Key",
    rarity: "Uncommon",
    cost: 8,
    timing: "Category",
    text: "+18 base on either straight.",
  },
  {
    id: "held-breath",
    name: "Held Breath",
    rarity: "Uncommon",
    cost: 7,
    timing: "Hold",
    text: "+3 base per held die.",
  },
  {
    id: "rainy-purse",
    name: "Rainy Purse",
    rarity: "Uncommon",
    cost: 8,
    timing: "Economy",
    text: "+1 mult while cash is $12 or more.",
  },
  {
    id: "fifth-pocket",
    name: "Fifth Pocket",
    rarity: "Uncommon",
    cost: 8,
    timing: "Dice",
    text: "+20 base when all five values are distinct.",
  },
  {
    id: "velvet-rope",
    name: "Velvet Rope",
    rarity: "Rare",
    cost: 11,
    timing: "Category",
    text: "Double base for either straight.",
  },
  {
    id: "loaded-ledger",
    name: "Loaded Ledger",
    rarity: "Rare",
    cost: 12,
    timing: "Economy",
    text: "+1 mult per full $12 held (max +3).",
  },
  {
    id: "echo-chamber",
    name: "Echo Chamber",
    rarity: "Rare",
    cost: 12,
    timing: "Category",
    text: "+3 mult on Four/Five of a Kind.",
  },
  {
    id: "house-lantern",
    name: "House Lantern",
    rarity: "Rare",
    cost: 11,
    timing: "Dice",
    text: "+28 base when no 1 appears.",
  },
  {
    id: "family-seal",
    name: "Family Seal",
    rarity: "Rare",
    cost: 12,
    timing: "Category",
    text: "+2 mult on Full House.",
  },
  {
    id: "long-gallery",
    name: "Long Gallery",
    rarity: "Rare",
    cost: 13,
    timing: "Category",
    text: "+2 mult on Grand Run.",
  },
  {
    id: "silver-pair",
    name: "Silver Pair",
    rarity: "Rare",
    cost: 11,
    timing: "Category",
    text: "Double base on Pair or Two Pair.",
  },
];

export function rng(seed: number): [number, number] {
  let x = seed | 0;
  if (x === 0) x = 0x6d2b79f5;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return [(x >>> 0) / 4294967296, x >>> 0];
}
export function rollDice(
  seed: number,
  current: Pip[] = [],
  held: boolean[] = [],
): { dice: Pip[]; seed: number } {
  let s = seed;
  const dice: Pip[] = [];
  for (let i = 0; i < 5; i++) {
    const existing = current[i];
    if (held[i] && existing !== undefined) dice.push(existing);
    else {
      const [n, next] = rng(s);
      s = next;
      dice.push((Math.floor(n * 6) + 1) as Pip);
    }
  }
  return { dice, seed: s };
}
export function evaluate(dice: Pip[]): Category[] {
  if (dice.length !== 5) return [];
  const counts = new Map<number, number>();
  dice.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1));
  const groups = [...counts.values()].sort((a, b) => b - a);
  const unique = [...counts.keys()].sort((a, b) => a - b);
  const consecutive = (length: number) =>
    unique.some(
      (_, i) =>
        unique.slice(i, i + length).length === length &&
        unique
          .slice(i, i + length)
          .every((v, j, a) => j === 0 || v === (a[j - 1] ?? 0) + 1),
    );
  const out: Category[] = ["chance"];
  if ((groups[0] ?? 0) >= 2) out.push("pair");
  if (groups.filter((x) => x >= 2).length >= 2) out.push("twoPair");
  if ((groups[0] ?? 0) >= 3) out.push("threeKind");
  if (consecutive(4)) out.push("smallStraight");
  if (consecutive(5)) out.push("largeStraight");
  if (groups[0] === 3 && groups[1] === 2) out.push("fullHouse");
  if ((groups[0] ?? 0) >= 4) out.push("fourKind");
  if (groups[0] === 5) out.push("fiveKind");
  return out;
}

function tableModifier(
  state: Pick<RunState, "ante" | "hands" | "rolls" | "dice" | "held">,
  category: Category,
): ScoreStep {
  const kinds: Category[] = ["threeKind", "fourKind", "fiveKind"];
  const straights: Category[] = ["smallStraight", "largeStraight"];
  switch (state.ante) {
    case 1:
      return {
        source: TABLES[0]!.name,
        detail:
          state.hands === 4
            ? "Opening hand: +12 base"
            : "Opening bonus already spent",
        baseDelta: state.hands === 4 ? 12 : 0,
      };
    case 2:
      return {
        source: TABLES[1]!.name,
        detail: ["pair", "twoPair", "fullHouse"].includes(category)
          ? "Matching category: +10 base"
          : straights.includes(category)
            ? "Straight toll: −4 base"
            : "No change",
        baseDelta: ["pair", "twoPair", "fullHouse"].includes(category)
          ? 10
          : straights.includes(category)
            ? -4
            : 0,
      };
    case 3:
      return state.rolls > 0
        ? {
            source: TABLES[2]!.name,
            detail: "Early score: +12 base",
            baseDelta: 12,
          }
        : {
            source: TABLES[2]!.name,
            detail: "Final roll: +1 mult",
            multDelta: 1,
          };
    case 4:
      return state.dice.filter((d) => d % 2 === 0).length >= 3
        ? {
            source: TABLES[3]!.name,
            detail: "Even majority: +16 base",
            baseDelta: 16,
          }
        : {
            source: TABLES[3]!.name,
            detail: "Odd toll: −4 base",
            baseDelta: -4,
          };
    case 5:
      return state.held.filter(Boolean).length >= 3
        ? {
            source: TABLES[4]!.name,
            detail: "Committed hold: +1 mult",
            multDelta: 1,
          }
        : state.held.every((h) => !h)
          ? {
              source: TABLES[4]!.name,
              detail: "Unanchored: +10 base",
              baseDelta: 10,
            }
          : { source: TABLES[4]!.name, detail: "No change" };
    case 6:
      return straights.includes(category)
        ? {
            source: TABLES[5]!.name,
            detail: "Road of runs: +20 base",
            baseDelta: 20,
          }
        : kinds.includes(category)
          ? {
              source: TABLES[5]!.name,
              detail: "Road of ranks: +1 mult",
              multDelta: 1,
            }
          : { source: TABLES[5]!.name, detail: "No change" };
    case 7:
      return {
        source: TABLES[6]!.name,
        detail: `Rising stakes: +${(4 - state.hands) * 8} base`,
        baseDelta: (4 - state.hands) * 8,
      };
    default:
      return state.dice.filter((d) => d >= 4).length >= 3
        ? {
            source: TABLES[7]!.name,
            detail: "High majority: +1 mult",
            multDelta: 1,
          }
        : {
            source: TABLES[7]!.name,
            detail: "Low fallback: +8 base",
            baseDelta: 8,
          };
  }
}

export function scoreHand(
  dice: Pip[],
  category: Category,
  charmIds: string[],
  cash: number,
  rolls: number,
  context: { ante?: number; hands?: number; held?: boolean[] } = {},
): Score {
  const definition = CATEGORIES[category];
  const categoryBase = definition.base;
  const diceContribution = dice.reduce((sum, d) => sum + d, 0);
  let base = categoryBase + diceContribution;
  let mult = definition.mult;
  const tableStep = tableModifier(
    {
      ante: context.ante ?? 1,
      hands: context.hands ?? 3,
      rolls,
      dice,
      held: context.held ?? [false, false, false, false, false],
    },
    category,
  );
  base = Math.max(1, base + (tableStep.baseDelta ?? 0));
  mult += tableStep.multDelta ?? 0;
  const charmSteps: ScoreStep[] = [];
  const apply = (
    id: string,
    condition: boolean,
    detail: string,
    baseDelta = 0,
    multDelta = 0,
    transform?: () => void,
  ) => {
    if (!charmIds.includes(id) || !condition) return;
    const previousBase = base;
    const previousMult = mult;
    if (transform) transform();
    else {
      base += baseDelta;
      mult += multDelta;
    }
    const actualBaseDelta = base - previousBase;
    const actualMultDelta = mult - previousMult;
    if (actualBaseDelta === 0 && actualMultDelta === 0) return;
    charmSteps.push({
      source: CHARMS.find((c) => c.id === id)?.name ?? id,
      detail,
      baseDelta: actualBaseDelta || undefined,
      multDelta: actualMultDelta || undefined,
    });
  };
  apply("brass-tack", category === "pair", "+8 base", 8);
  apply(
    "even-keel",
    true,
    "+2 per even die",
    dice.filter((d) => d % 2 === 0).length * 2,
  );
  apply(
    "odd-job",
    true,
    "+2 per odd die",
    dice.filter((d) => d % 2 === 1).length * 2,
  );
  apply("pocket-change", cash <= 5, "Low cash: +1 mult", 0, 1);
  apply(
    "double-stitch",
    category === "pair" || category === "twoPair",
    "+6 base",
    6,
  );
  apply("steady-hand", rolls > 0, "Scored early: +8 base", 8);
  apply("last-call", rolls === 0, "Final roll: +10 base", 10);
  apply(
    "small-favor",
    true,
    "+2 per low die",
    dice.filter((d) => d <= 2).length * 2,
  );
  apply(
    "high-polish",
    true,
    "+2 per high die",
    dice.filter((d) => d >= 5).length * 2,
  );
  apply("open-secret", category === "chance", "+12 base", 12);
  apply("short-fuse", rolls === 0, "Final roll: +2 mult", 0, 2);
  apply(
    "sixth-sense",
    dice.filter((d) => d === 6).length >= 2,
    "Two sixes: +1 mult",
    0,
    1,
  );
  apply(
    "low-road",
    dice.every((d) => d <= 4),
    "All low: +18 base",
    18,
  );
  apply("second-wind", category === "twoPair", "+2 mult", 0, 2);
  apply(
    "three-bells",
    category === "threeKind" || category === "fullHouse",
    "+1 mult",
    0,
    1,
  );
  apply(
    "sequence-key",
    category === "smallStraight" || category === "largeStraight",
    "+18 base",
    18,
  );
  apply(
    "held-breath",
    true,
    "+3 per held die",
    (context.held ?? []).filter(Boolean).length * 3,
  );
  apply("rainy-purse", cash >= 12, "Cash reserve: +1 mult", 0, 1);
  apply(
    "fifth-pocket",
    new Set(dice).size === 5,
    "Five distinct: +20 base",
    20,
  );
  apply(
    "velvet-rope",
    category === "smallStraight" || category === "largeStraight",
    "Double current base",
    0,
    0,
    () => {
      base *= 2;
    },
  );
  apply(
    "loaded-ledger",
    cash >= 12,
    "Reserve multiplier",
    0,
    Math.min(3, Math.floor(cash / 12)),
  );
  apply(
    "echo-chamber",
    category === "fourKind" || category === "fiveKind",
    "+3 mult",
    0,
    3,
  );
  apply("house-lantern", !dice.includes(1), "No ones: +28 base", 28);
  apply("family-seal", category === "fullHouse", "+2 mult", 0, 2);
  apply("long-gallery", category === "largeStraight", "+2 mult", 0, 2);
  apply(
    "silver-pair",
    category === "pair" || category === "twoPair",
    "Double current base",
    0,
    0,
    () => {
      base *= 2;
    },
  );
  return {
    category,
    categoryBase,
    diceContribution,
    base,
    mult,
    chips: base * mult,
    tableStep,
    charmSteps,
  };
}

export function bestCategory(
  dice: Pip[],
  state?: Pick<
    RunState,
    "charms" | "cash" | "rolls" | "ante" | "hands" | "held"
  >,
): Category {
  return (
    evaluate(dice).sort((a, b) => {
      const score = (c: Category) =>
        state
          ? scoreHand(dice, c, state.charms, state.cash, state.rolls, state)
              .chips
          : (CATEGORIES[c].base + dice.reduce((x, y) => x + y, 0)) *
            CATEGORIES[c].mult;
      return score(b) - score(a);
    })[0] ?? "chance"
  );
}
function createShop(
  seed: number,
  owned: string[],
  ante: number,
  previous: string[] = [],
): [string[], number] {
  const maxRarity: Rarity[] =
    ante < 2 ? ["Common", "Uncommon"] : ["Common", "Uncommon", "Rare"];
  const eligible = CHARMS.filter(
    (c) => !owned.includes(c.id) && maxRarity.includes(c.rarity),
  );
  const count = Math.min(3, eligible.length);
  const alternatives = eligible.filter((c) => !previous.includes(c.id));
  const pool = alternatives.length >= count ? alternatives : eligible;
  const result: string[] = [];
  let s = seed;
  for (
    let attempts = 0;
    result.length < count && attempts < pool.length * 4;
    attempts++
  ) {
    const [n, next] = rng(s);
    s = next;
    const id = pool[Math.floor(n * pool.length)]?.id;
    if (id && !result.includes(id)) result.push(id);
  }
  for (const charm of pool) {
    if (result.length >= count) break;
    if (!result.includes(charm.id)) result.push(charm.id);
  }
  return [result, s];
}
const emptyUsage = (): Record<Category, number> =>
  Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0])) as Record<
    Category,
    number
  >;
export function newRun(seed = Date.now() >>> 0): RunState {
  return {
    version: 2,
    seed,
    ante: 1,
    tableId: TABLES[0]!.id,
    score: 0,
    target: TABLES[0]!.target,
    cash: 6,
    hands: 4,
    rolls: 3,
    dice: [],
    held: [false, false, false, false, false],
    charms: [],
    shop: [],
    refreshes: 0,
    skippedShop: false,
    status: "briefing",
    stats: {
      seed,
      tableReached: 1,
      handsScored: 0,
      rerolls: 0,
      bestHand: null,
      totalScore: 0,
      categoryUsage: emptyUsage(),
    },
    history: [],
    lastScore: null,
  };
}
export function enterTable(s: RunState): RunState {
  return s.status === "briefing" ? { ...s, status: "playing" } : s;
}
export function toggleHold(s: RunState, index: number): RunState {
  if (s.status !== "playing" || s.dice.length !== 5 || index < 0 || index > 4)
    return s;
  return { ...s, held: s.held.map((h, i) => (i === index ? !h : h)) };
}
export function doRoll(s: RunState): RunState {
  if (s.status !== "playing" || s.rolls <= 0) return s;
  const reroll = s.dice.length === 5;
  const result = rollDice(s.seed, s.dice, s.held);
  return {
    ...s,
    ...result,
    rolls: s.rolls - 1,
    stats: { ...s.stats, rerolls: s.stats.rerolls + (reroll ? 1 : 0) },
  };
}
export function scoreTurn(
  s: RunState,
  category = bestCategory(s.dice, s),
): RunState {
  if (
    s.status !== "playing" ||
    s.dice.length !== 5 ||
    !evaluate(s.dice).includes(category)
  )
    return s;
  const result = scoreHand(s.dice, category, s.charms, s.cash, s.rolls, s);
  const total = s.score + result.chips;
  const handsScored = s.stats.handsScored + 1;
  const stats: RunStats = {
    ...s.stats,
    handsScored,
    totalScore: s.stats.totalScore + result.chips,
    categoryUsage: {
      ...s.stats.categoryUsage,
      [category]: s.stats.categoryUsage[category] + 1,
    },
    bestHand:
      !s.stats.bestHand || result.chips > s.stats.bestHand.score
        ? { category, score: result.chips }
        : s.stats.bestHand,
  };
  const history = [
    ...s.history,
    { table: s.ante, category, score: result.chips },
  ].slice(-20);
  if (total >= s.target) {
    const cleared = {
      ...s,
      score: total,
      cash: s.cash + TABLES[s.ante - 1]!.reward,
      stats,
      history,
      lastScore: result,
    };
    if (s.ante === TABLES.length)
      return {
        ...cleared,
        shop: [],
        refreshes: 0,
        skippedShop: false,
        status: "won",
      };
    const [items, seed] = createShop(s.seed, s.charms, s.ante);
    return { ...cleared, seed, shop: items, status: "shop" };
  }
  const hands = s.hands - 1;
  return {
    ...s,
    score: total,
    hands,
    rolls: 3,
    dice: [],
    held: s.held.map(() => false),
    status: hands <= 0 ? "lost" : "playing",
    stats,
    history,
    lastScore: result,
  };
}
export function buy(s: RunState, id: string): RunState {
  const charm = CHARMS.find((c) => c.id === id);
  if (
    !charm ||
    s.status !== "shop" ||
    s.skippedShop ||
    s.cash < charm.cost ||
    s.charms.length >= 5 ||
    !s.shop.includes(id)
  )
    return s;
  return {
    ...s,
    cash: s.cash - charm.cost,
    charms: [...s.charms, id],
    shop: s.shop.filter((x) => x !== id),
  };
}
export function sell(s: RunState, id: string): RunState {
  const charm = CHARMS.find((c) => c.id === id);
  if (!charm || s.status !== "shop" || s.skippedShop || !s.charms.includes(id))
    return s;
  return {
    ...s,
    cash: s.cash + Math.max(2, Math.floor(charm.cost / 2)),
    charms: s.charms.filter((x) => x !== id),
  };
}
export function refresh(s: RunState): RunState {
  const cost = 2 + s.refreshes;
  if (s.status !== "shop" || s.skippedShop || s.cash < cost || s.refreshes >= 2)
    return s;
  const [items, seed] = createShop(s.seed, s.charms, s.ante, s.shop);
  return {
    ...s,
    cash: s.cash - cost,
    seed,
    shop: items,
    refreshes: s.refreshes + 1,
  };
}
export function skipShop(s: RunState): RunState {
  return s.status === "shop" && !s.skippedShop
    ? { ...s, cash: s.cash + 3, shop: [], skippedShop: true }
    : s;
}
export function nextAnte(s: RunState): RunState {
  if (s.status !== "shop") return s;
  const ante = s.ante + 1;
  const table = TABLES[ante - 1]!;
  return {
    ...s,
    ante,
    tableId: table.id,
    target: table.target,
    score: 0,
    hands: 4,
    rolls: 3,
    dice: [],
    held: s.held.map(() => false),
    shop: [],
    refreshes: 0,
    skippedShop: false,
    status: "briefing",
    stats: { ...s.stats, tableReached: ante },
    lastScore: null,
  };
}
