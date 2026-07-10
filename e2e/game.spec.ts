import { expect, test, type Locator, type Page } from "@playwright/test";

const usage = {
  chance: 0,
  pair: 0,
  twoPair: 0,
  threeKind: 0,
  smallStraight: 0,
  largeStraight: 0,
  fullHouse: 0,
  fourKind: 0,
  fiveKind: 0,
};
function state(overrides: Record<string, unknown> = {}) {
  return {
    version: 2,
    seed: 42,
    ante: 1,
    tableId: "brass-welcome",
    score: 0,
    target: 155,
    cash: 6,
    hands: 4,
    rolls: 3,
    dice: [],
    held: [false, false, false, false, false],
    charms: [],
    shop: [],
    refreshes: 0,
    skippedShop: false,
    status: "playing",
    stats: {
      seed: 42,
      tableReached: 1,
      handsScored: 0,
      rerolls: 0,
      bestHand: null,
      totalScore: 0,
      categoryUsage: usage,
    },
    history: [],
    lastScore: null,
    ...overrides,
  };
}
async function loadState(page: Page, run: ReturnType<typeof state>) {
  await page.evaluate(
    (value) =>
      localStorage.setItem("ante-up-dice.save.v2", JSON.stringify(value)),
    run,
  );
  await page.reload();
  await page.getByRole("button", { name: /continue/i }).click();
}
const phoneViewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;
const intersects = (a: Box, b: Box) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

async function expectEnlargedTextNavigation(
  page: Page,
  viewport: (typeof phoneViewports)[number],
  content: Locator[],
) {
  await page.locator("html").evaluate((element) => {
    element.style.fontSize = "150%";
  });

  const rules = page.getByRole("button", { name: /rules.*settings/i });
  const menu = page.getByRole("button", { name: /main menu/i });
  await expect(rules).toBeVisible();
  await expect(menu).toBeVisible();
  const [contentBoxes, rulesBox, menuBox] = await Promise.all([
    Promise.all(content.map((locator) => locator.boundingBox())),
    rules.boundingBox(),
    menu.boundingBox(),
  ]);
  for (const box of [...contentBoxes, rulesBox, menuBox]) expect(box).not.toBeNull();
  for (const box of [rulesBox!, menuBox!]) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
  expect(intersects(rulesBox!, menuBox!)).toBe(false);
  for (const contentBox of contentBoxes) {
    expect(intersects(rulesBox!, contentBox!)).toBe(false);
    expect(intersects(menuBox!, contentBox!)).toBe(false);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewport.width,
  );

  await rules.click();
  const dialog = page.getByRole("dialog", { name: /rules & accessibility/i });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(rules).toBeFocused();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/ante-up-dice/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "ante-up-dice.settings",
      JSON.stringify({ onboarding: false, sound: false, motion: false }),
    );
  });
  await page.reload();
});

test("modal traps focus, closes with Escape, and restores its opener", async ({ page }) => {
  const opener = page.getByRole("button", { name: /rules & accessibility/i });
  await opener.click();
  const close = page.getByRole("button", { name: /close dialog/i });
  await expect(close).toBeFocused();
  const closeBox = await close.boundingBox();
  const headingBox = await page
    .getByRole("heading", { name: /rules & accessibility/i })
    .boundingBox();
  expect(closeBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(closeBox?.width ?? 999).toBeLessThanOrEqual(48);
  const overlapsHeading =
    (closeBox?.x ?? 0) < (headingBox?.x ?? 0) + (headingBox?.width ?? 0) &&
    (closeBox?.x ?? 0) + (closeBox?.width ?? 0) > (headingBox?.x ?? 0) &&
    (closeBox?.y ?? 0) < (headingBox?.y ?? 0) + (headingBox?.height ?? 0) &&
    (closeBox?.y ?? 0) + (closeBox?.height ?? 0) > (headingBox?.y ?? 0);
  expect(overlapsHeading).toBe(false);
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("checkbox", { name: /show onboarding/i })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("briefs, rolls, holds, selects, and scores without timers", async ({
  page,
}) => {
  await page.getByRole("button", { name: /start new run/i }).click();
  await expect(
    page.getByRole("heading", { name: /brass welcome/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /brass welcome/i })).toBeFocused();
  await page.getByRole("button", { name: /take your seat/i }).click();
  await expect(page.getByRole("heading", { name: /make your hand/i })).toBeFocused();
  await page.getByRole("button", { name: /roll dice/i }).click();
  const die = page.getByRole("button", { name: /die 1/i });
  await die.click();
  await expect(die).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^open table ready$/i }).click();
  await page.getByText("Score details").click();
  await expect(page.getByText("Category base")).toBeVisible();
  await page.getByRole("button", { name: /score open table/i }).click();
  await expect(page.getByText(/previous score/i)).toBeVisible();
  await expect(page.getByText(/needed/)).toBeVisible();
});

test("clears a table, uses the shop, and reaches the next briefing", async ({
  page,
}) => {
  await loadState(
    page,
    state({ score: 154, cash: 20, dice: [6, 6, 6, 6, 6], rolls: 0 }),
  );
  await page.getByRole("button", { name: /score five of a kind/i }).click();
  await expect(page.getByRole("heading", { name: /backroom/i })).toBeVisible();
  const buy = page.getByRole("button", { name: /^buy/i }).first();
  await buy.click();
  await expect(page.getByRole("status")).toBeFocused();
  await expect(page.getByRole("status")).toContainText(
    /cash changed from \$28 to \$24/i,
  );
  await expect(page.getByText(/inventory 1\/5/i)).toBeVisible();
  await page.getByRole("button", { name: /skip offers/i }).click();
  await page.getByRole("button", { name: /briefing: table 2/i }).click();
  await expect(
    page.getByRole("heading", { name: /twins’ parlor/i }),
  ).toBeVisible();
  await expect(page.getByText(/purchased\. cash changed/i)).toHaveCount(0);
});

test("persists a held hand through menu and continue", async ({ page }) => {
  await loadState(page, state({ dice: [1, 2, 3, 4, 5], rolls: 2 }));
  await page.getByRole("button", { name: /die 1/i }).click();
  await page.getByRole("button", { name: /main menu/i }).click();
  await expect(page.getByRole("heading", { name: /ante up dice/i })).toBeFocused();
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("heading", { name: /shape the hand/i })).toBeFocused();
  await expect(page.getByRole("button", { name: /die 1/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("renders deterministic defeat recap", async ({ page }) => {
  await loadState(
    page,
    state({
      ante: 8,
      tableId: "crown-vault",
      target: 1240,
      hands: 1,
      dice: [1, 2, 2, 4, 6],
      rolls: 0,
      stats: {
        seed: 42,
        tableReached: 8,
        handsScored: 20,
        rerolls: 30,
        bestHand: { category: "fullHouse", score: 300 },
        totalScore: 4000,
        categoryUsage: { ...usage, fullHouse: 4 },
      },
    }),
  );
  await page.getByRole("button", { name: /^score/i }).click();
  await expect(
    page.getByRole("heading", { name: /table holds/i }),
  ).toBeVisible();
  await expect(page.getByText(/1,240 required/i)).toBeVisible();
  await expect(page.getByText(/full house 4/i)).toBeVisible();
});

test("renders deterministic victory recap", async ({ page }) => {
  await loadState(
    page,
    state({
      ante: 8,
      tableId: "crown-vault",
      target: 1240,
      score: 1239,
      dice: [6, 6, 6, 6, 6],
      rolls: 0,
      stats: {
        seed: 42,
        tableReached: 8,
        handsScored: 21,
        rerolls: 31,
        bestHand: { category: "fiveKind", score: 700 },
        totalScore: 5000,
        categoryUsage: { ...usage, fiveKind: 2 },
      },
    }),
  );
  await page.getByRole("button", { name: /score five of a kind/i }).click();
  await expect(
    page.getByRole("heading", { name: /house applauds/i }),
  ).toBeVisible();
  await expect(page.getByText(/crown vault/i)).toBeVisible();
});

test("keeps critical play controls within a 390x844 viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadState(page, state({ dice: [1, 2, 3, 4, 5], rolls: 2 }));
  const score = page.getByRole("button", { name: /score grand run/i });
  await expect(score).toBeVisible();
  const box = await score.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.y ?? 9999) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
});

const gameplayViewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
] as const;

for (const viewport of gameplayViewports) {
  test(`table decision fits ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await loadState(page, state({
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
      held: [true, false, false, false, false],
    }));
    const regions = [
      page.getByRole("region", { name: /throw zone/i }),
      page.getByRole("region", { name: /keep tray/i }),
      page.getByRole("region", { name: /scoring rail/i }),
      page.getByRole("region", { name: /chip pot/i }),
      page.getByRole("region", { name: /thumb action/i }),
    ];
    for (const region of regions) await expect(region).toBeVisible();
    const action = page.getByRole("button", { name: /score grand run/i });
    const actionBox = await action.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(actionBox!.width).toBeGreaterThanOrEqual(44);
    expect(actionBox!.height).toBeGreaterThanOrEqual(44);
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(viewport.height);
    for (const die of await page.locator(".die").all()) {
      const box = await die.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(52);
      expect(box!.height).toBeGreaterThanOrEqual(52);
    }
    for (const plaque of await page.locator(".tray button").all()) {
      const box = await plaque.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(viewport.height);
  });
}

test("current decision and rail controls survive 200% text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await loadState(page, state({ dice: [1, 2, 3, 4, 5], rolls: 2 }));
  await page.locator("html").evaluate((element) => { element.style.fontSize = "200%"; });
  await expect(page.getByRole("button", { name: /score grand run/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /rules and settings/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /main menu/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("keeps equipped charm effects readable at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadState(page, state({ charms: ["even-keel"] }));
  await expect(page.getByText("+2 base per even die.")).toBeVisible();
});

test.describe("enlarged-text phone navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "The mobile project faithfully models touch.");

  for (const viewport of phoneViewports) {
    for (const screen of ["briefing", "table", "shop"] as const) {
      test(`${screen} at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        if (screen === "briefing") {
          await loadState(page, state({ status: "briefing" }));
        } else if (screen === "shop") {
          await loadState(page, state({
            status: "shop",
            score: 155,
            cash: 14,
            shop: ["brass-tack", "double-stitch", "second-wind"],
          }));
        } else {
          await loadState(page, state());
        }
        const content = screen === "briefing"
          ? [page.locator(".briefing .eyebrow"), page.locator(".briefing h1")]
          : screen === "shop"
            ? [page.locator(".shop .eyebrow"), page.locator(".shop h1")]
            : [page.locator(".rail .plaque")];
        await expectEnlargedTextNavigation(page, viewport, content);
      });
    }
  }
});
