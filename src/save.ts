import {
  CATEGORIES,
  CATEGORY_ORDER,
  CHARMS,
  TABLES,
  newRun,
  type Category,
  type Pip,
  type RunState,
  type Score,
  type ScoreStep,
} from "./engine";

export const SAVE_KEY = "ante-up-dice.save.v2";
export const LEGACY_SAVE_KEY = "ante-up-dice.save.v1";
const charmIds = new Set(CHARMS.map((c) => c.id));
const statuses = new Set(["briefing", "playing", "shop", "won", "lost"]);
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const integer = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const pips = (v: unknown): v is Pip[] =>
  Array.isArray(v) &&
  v.length <= 5 &&
  v.every((x) => integer(x) && x >= 1 && x <= 6);
const categoryIds = new Set<string>(CATEGORY_ORDER);
const category = (v: unknown): v is Category =>
  typeof v === "string" && categoryIds.has(v);
const nonnegative = (v: unknown): v is number => integer(v) && v >= 0;
function scoreStep(value: unknown): value is ScoreStep {
  if (
    !record(value) ||
    typeof value.source !== "string" ||
    typeof value.detail !== "string"
  )
    return false;
  return (
    (value.baseDelta === undefined || integer(value.baseDelta)) &&
    (value.multDelta === undefined || integer(value.multDelta))
  );
}
function savedScore(value: unknown): value is Score {
  if (
    !record(value) ||
    !category(value.category) ||
    !nonnegative(value.categoryBase) ||
    value.categoryBase !== CATEGORIES[value.category].base ||
    !integer(value.diceContribution) ||
    value.diceContribution < 5 ||
    value.diceContribution > 30
  )
    return false;
  if (
    !integer(value.base) ||
    value.base < 1 ||
    !integer(value.mult) ||
    value.mult < 1 ||
    !nonnegative(value.chips) ||
    value.chips !== value.base * value.mult ||
    !scoreStep(value.tableStep)
  )
    return false;
  return (
    Array.isArray(value.charmSteps) &&
    value.charmSteps.length <= 5 &&
    value.charmSteps.every(scoreStep)
  );
}

export function isRunState(value: unknown): value is RunState {
  if (!record(value) || value.version !== 2) return false;
  const {
    seed,
    ante,
    tableId,
    score,
    target,
    cash,
    hands,
    rolls,
    dice,
    held,
    charms,
    shop,
    refreshes,
    skippedShop,
    status,
    stats,
    history,
    lastScore,
  } = value;
  if (
    !integer(seed) ||
    seed < 0 ||
    seed > 0xffffffff ||
    !integer(ante) ||
    ante < 1 ||
    ante > TABLES.length
  )
    return false;
  if (
    tableId !== TABLES[ante - 1]?.id ||
    !integer(target) ||
    target !== TABLES[ante - 1]?.target ||
    !integer(score) ||
    score < 0 ||
    !integer(cash) ||
    cash < 0
  )
    return false;
  if (
    !integer(hands) ||
    hands < 0 ||
    hands > 4 ||
    !integer(rolls) ||
    rolls < 0 ||
    rolls > 3 ||
    !integer(refreshes) ||
    refreshes < 0 ||
    refreshes > 2
  )
    return false;
  if (
    !pips(dice) ||
    !Array.isArray(held) ||
    held.length !== 5 ||
    !held.every((x) => typeof x === "boolean")
  )
    return false;
  if (
    !strings(charms) ||
    charms.length > 5 ||
    new Set(charms).size !== charms.length ||
    charms.some((x) => !charmIds.has(x))
  )
    return false;
  if (
    !strings(shop) ||
    shop.length > 3 ||
    new Set(shop).size !== shop.length ||
    shop.some((x) => !charmIds.has(x) || charms.includes(x))
  )
    return false;
  if (
    typeof skippedShop !== "boolean" ||
    typeof status !== "string" ||
    !statuses.has(status) ||
    !record(stats) ||
    !Array.isArray(history)
  )
    return false;
  if (
    !integer(stats.seed) ||
    stats.seed < 0 ||
    stats.seed > 0xffffffff ||
    !integer(stats.tableReached) ||
    stats.tableReached !== ante ||
    !nonnegative(stats.handsScored) ||
    !nonnegative(stats.rerolls) ||
    !nonnegative(stats.totalScore) ||
    !record(stats.categoryUsage)
  )
    return false;
  const usage = stats.categoryUsage;
  if (
    !CATEGORY_ORDER.every((c) => integer(usage[c]) && (usage[c] as number) >= 0)
  )
    return false;
  if (
    stats.bestHand !== null &&
    (!record(stats.bestHand) ||
      !category(stats.bestHand.category) ||
      !nonnegative(stats.bestHand.score))
  )
    return false;
  if (
    history.length > 20 ||
    !history.every(
      (entry) =>
        record(entry) &&
        integer(entry.table) &&
        entry.table >= 1 &&
        entry.table <= TABLES.length &&
        category(entry.category) &&
        nonnegative(entry.score),
    )
  )
    return false;
  if (lastScore !== null && !savedScore(lastScore)) return false;
  if (status !== "shop" && (shop.length > 0 || refreshes !== 0 || skippedShop))
    return false;
  if (
    (status === "playing" || status === "briefing") &&
    (hands < 1 || score >= target)
  )
    return false;
  if (
    status === "briefing" &&
    (score !== 0 ||
      hands !== 4 ||
      rolls !== 3 ||
      dice.length !== 0 ||
      held.some(Boolean) ||
      lastScore !== null)
  )
    return false;
  if (
    status === "playing" &&
    !(
      (dice.length === 0 && rolls === 3 && held.every((x) => !x)) ||
      (dice.length === 5 && rolls <= 2)
    )
  )
    return false;
  if (status === "shop" && (score < target || ante === TABLES.length))
    return false;
  if (skippedShop && shop.length > 0) return false;
  if (status === "won" && (ante !== TABLES.length || score < target))
    return false;
  if (
    status === "lost" &&
    (score >= target || hands !== 0 || dice.length !== 0 || held.some(Boolean))
  )
    return false;
  return true;
}

function migrateV1(value: unknown): RunState | null {
  if (
    !record(value) ||
    value.version !== 1 ||
    !integer(value.seed) ||
    value.seed < 0 ||
    value.seed > 0xffffffff ||
    !integer(value.ante) ||
    value.ante < 1 ||
    value.ante > TABLES.length
  )
    return null;
  const migrated = newRun(value.seed);
  const ante = value.ante;
  const table = TABLES[ante - 1]!;
  if (
    !pips(value.dice) ||
    !Array.isArray(value.held) ||
    value.held.length !== 5 ||
    !value.held.every((x) => typeof x === "boolean")
  )
    return null;
  if (
    !strings(value.charms) ||
    value.charms.some((x) => !charmIds.has(x)) ||
    !strings(value.shop) ||
    value.shop.some((x) => !charmIds.has(x))
  )
    return null;
  const oldStatus = value.status;
  const activeStatus =
    oldStatus === "shop" ? "shop" : oldStatus === "playing" ? "playing" : null;
  if (!activeStatus) return null;
  const score = integer(value.score) && value.score >= 0 ? value.score : 0;
  const hands =
    integer(value.hands) && value.hands >= 1 && value.hands <= 4
      ? value.hands
      : 4;
  const rolls =
    integer(value.rolls) && value.rolls >= 0 && value.rolls <= 3
      ? value.rolls
      : 3;
  const cash = integer(value.cash) && value.cash >= 0 ? value.cash : 5;
  const candidate = {
    ...migrated,
    ante,
    tableId: table.id,
    target: table.target,
    score,
    hands,
    rolls,
    cash,
    dice: value.dice,
    held: value.held,
    charms: value.charms,
    shop: activeStatus === "shop" ? value.shop : [],
    status: activeStatus,
    stats: { ...migrated.stats, tableReached: ante },
  };
  return isRunState(candidate) ? candidate : null;
}

export function parseSavedRun(raw: string | null): RunState | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isRunState(value) ? value : migrateV1(value);
  } catch {
    return null;
  }
}
export function loadSavedRun(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): RunState | null {
  const currentRaw = storage.getItem(SAVE_KEY);
  const current = parseSavedRun(currentRaw);
  if (current) return current;
  if (currentRaw !== null) storage.removeItem(SAVE_KEY);
  const legacyRaw = storage.getItem(LEGACY_SAVE_KEY);
  const legacy = parseSavedRun(legacyRaw);
  if (legacy) {
    storage.setItem(SAVE_KEY, JSON.stringify(legacy));
    storage.removeItem(LEGACY_SAVE_KEY);
    return legacy;
  }
  if (legacyRaw !== null) storage.removeItem(LEGACY_SAVE_KEY);
  return null;
}
export function isActiveRun(run: RunState): boolean {
  return (
    run.status === "briefing" ||
    run.status === "playing" ||
    run.status === "shop"
  );
}
