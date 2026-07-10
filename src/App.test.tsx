import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { enterTable, newRun } from "./engine";
import { SAVE_KEY } from "./save";
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  localStorage.setItem(
    "ante-up-dice.settings",
    JSON.stringify({ onboarding: false, sound: false, motion: false }),
  );
});
it("starts at the menu and opens accessible rules", () => {
  render(<App />);
  expect(
    screen.getByRole("button", { name: /start new run/i }),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: /rules & accessibility/i }),
  );
  expect(
    screen.getByRole("dialog", { name: /rules & accessibility/i }),
  ).toBeInTheDocument();
});
it("traps modal focus, closes on Escape, restores the opener, and clears inert", () => {
  render(<App />);
  const opener = screen.getByRole("button", {
    name: /rules & accessibility/i,
  });
  opener.focus();
  fireEvent.click(opener);
  const dialog = screen.getByRole("dialog");
  const close = screen.getByRole("button", { name: /close dialog/i });
  expect(close).toHaveFocus();
  expect(opener).toHaveProperty("inert", true);
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(screen.getByRole("checkbox", { name: /show onboarding/i })).toHaveFocus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(close).toHaveFocus();
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect(opener).toHaveProperty("inert", false);
});
it("briefs before entering the first table", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /start new run/i }));
  expect(
    screen.getByRole("heading", { name: /brass welcome/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /brass welcome/i })).toHaveFocus();
  expect(screen.getByText(/first scored hand gains/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /take your seat/i }));
  expect(
    screen.getByRole("button", { name: /roll dice/i }),
  ).toBeInTheDocument();
});
it("announces a purchase with its cash change and moves focus", () => {
  const base = newRun(42);
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...base,
      status: "shop",
      score: base.target,
      cash: 20,
      shop: ["brass-tack"],
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(screen.getByRole("button", { name: /buy brass tack/i }));
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("Cash changed from $20 to $16");
  expect(status).toHaveFocus();
});
it("rolls, holds, exposes breakdown, and scores", () => {
  localStorage.setItem(SAVE_KEY, JSON.stringify(enterTable(newRun(42))));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(screen.getByRole("button", { name: /roll dice/i }));
  const die = screen.getByRole("button", { name: /die 1/i });
  fireEvent.click(die);
  expect(screen.getByRole("button", { name: /die 1/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: /score details/i }));
  expect(screen.getByText("Category base")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^score (?!details)/i }));
  expect(screen.getByText(/previous score/i)).toBeInTheDocument();
});
it("presents briefing inside the unified table stage", () => {
  localStorage.setItem(SAVE_KEY, JSON.stringify(newRun(42)));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const stage = screen.getByRole("main", { name: "Table stage" });
  expect(stage).toContainElement(
    screen.getByRole("heading", { name: /brass welcome/i }),
  );
});
it("keeps one five-die hand together when a die is held", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const stage = screen.getByRole("main", { name: "Table stage" });
  expect(screen.queryByRole("region", { name: "Table rail" })).not.toBeInTheDocument();
  const hand = within(stage).getByRole("region", { name: "Dice hand" });
  expect(within(hand).getAllByRole("button", { name: /die \d/i })).toHaveLength(5);
  const first = within(hand).getByRole("button", { name: /die 1/i });
  fireEvent.click(first);
  expect(first).toHaveAttribute("aria-pressed", "true");
  expect(within(hand).getAllByRole("button", { name: /die \d/i })).toHaveLength(5);
  expect(screen.queryByRole("region", { name: "Keep tray" })).not.toBeInTheDocument();
});
it("offers only viable scores and opens the complete scorebook on demand", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const offers = screen.getByRole("region", { name: "Score offers" });
  const offerButtons = within(offers).getAllByRole("button");
  expect(offerButtons.length).toBeGreaterThan(0);
  expect(offerButtons.length).toBeLessThan(9);
  expect(offerButtons.every((button) => !button.hasAttribute("disabled"))).toBe(true);

  const opener = screen.getByRole("button", { name: "Scorebook" });
  opener.focus();
  fireEvent.click(opener);
  const scorebook = screen.getByRole("dialog", { name: "Scorebook" });
  for (const category of [
    "Open Table",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Short Run",
    "Grand Run",
    "Full House",
    "Four of a Kind",
    "Five of a Kind",
  ]) {
    expect(within(scorebook).getByText(category, { exact: true })).toBeInTheDocument();
  }
  fireEvent.keyDown(scorebook, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: "Scorebook" })).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});
it("exposes one primary table action and a secondary reroll after rolling", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const stage = screen.getByRole("main", { name: "Table stage" });
  expect(stage.querySelectorAll('[data-importance="primary"]')).toHaveLength(1);
  expect(within(stage).getByRole("button", { name: /^score (?!details)/i })).toHaveAttribute(
    "data-importance",
    "primary",
  );
  expect(within(stage).getByRole("button", { name: /reroll/i })).toHaveAttribute(
    "data-importance",
    "secondary",
  );
});
it("opens score details as one payout slip and restores focus", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const opener = screen.getByRole("button", { name: /score details/i });
  opener.focus();
  fireEvent.click(opener);
  const slip = screen.getByRole("dialog", { name: /payout slip.*grand run/i });
  expect(within(slip).getByText("Category base")).toBeInTheDocument();
  expect(screen.getAllByText("Category base")).toHaveLength(1);
  fireEvent.keyDown(slip, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: /payout slip/i })).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});
it("presents the working shop as a dealer tray in the table world", () => {
  const base = newRun(42);
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...base,
      status: "shop",
      score: base.target,
      cash: 20,
      shop: ["brass-tack"],
      charms: ["even-keel"],
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const stage = screen.getByRole("main", { name: "Table stage" });
  const dealer = within(stage).getByRole("region", { name: "Dealer tray" });
  const offers = within(dealer).getByRole("region", { name: "Charm offers" });
  const buy = screen.getByRole("button", { name: /buy brass tack/i });
  expect(offers).toContainElement(buy);
  expect(buy).toHaveAccessibleDescription(/common.*category.*8 base.*one pair/i);
  expect(offers.querySelector("article")).not.toBeInTheDocument();
  const sell = screen.getByRole("button", { name: /sell even keel/i });
  expect(within(dealer).getByRole("region", { name: "Carried charms" })).toContainElement(sell);
  expect(sell).toHaveAccessibleDescription(/even die/i);
});
it("keeps the active house rule inspectable during play", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const rule = screen.getByRole("button", {
    name: /house rule.*first scored hand gains \+12 base/i,
  });
  rule.focus();
  fireEvent.click(rule);
  const dialog = screen.getByRole("dialog", { name: /house rule/i });
  expect(within(dialog).getByText("Your first scored hand gains +12 base.")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(rule).toHaveFocus();
});
it("uses one pause object instead of persistent app navigation", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const stage = screen.getByRole("main", { name: "Table stage" });
  expect(within(stage).queryByRole("button", { name: /rules and settings/i })).not.toBeInTheDocument();
  expect(within(stage).queryByRole("button", { name: /^main menu$/i })).not.toBeInTheDocument();
  const pause = within(stage).getByRole("button", { name: /pause table/i });
  fireEvent.click(pause);
  const menu = screen.getByRole("dialog", { name: /table menu/i });
  expect(within(menu).getByRole("button", { name: /rules and settings/i })).toBeInTheDocument();
  expect(within(menu).getByRole("button", { name: /^main menu$/i })).toBeInTheDocument();
});
it("keeps unheld dice visually quiet without repeated hold captions", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const hand = screen.getByRole("region", { name: "Dice hand" });
  expect(within(hand).queryByText(/^hold$/i)).not.toBeInTheDocument();
  fireEvent.click(within(hand).getByRole("button", { name: /die 1/i }));
  expect(within(hand).getByText(/^held$/i)).toBeInTheDocument();
});
it("keeps held dice motionless while loose dice reroll", () => {
  localStorage.setItem(
    "ante-up-dice.settings",
    JSON.stringify({ onboarding: false, sound: false, motion: true }),
  );
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      held: [true, false, false, false, false],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(screen.getByRole("button", { name: /reroll/i }));
  expect(screen.getByRole("button", { name: /die 1/i })).not.toHaveClass("rolling");
  expect(screen.getByRole("button", { name: /die 2/i })).toHaveClass("rolling");
});
it("makes equipped charm effects inspectable by keyboard and touch", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      charms: ["even-keel"],
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const charm = screen.getByRole("button", { name: /inspect even keel/i });
  charm.focus();
  fireEvent.click(charm);
  const dialog = screen.getByRole("dialog", { name: /even keel/i });
  expect(within(dialog).getByText("+2 base per even die.")).toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(charm).toHaveFocus();
});
it("exposes gameplay as one stage with compact table navigation", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [1, 2, 3, 4, 5],
      rolls: 2,
      held: [true, false, false, false, false],
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  const stage = screen.getByRole("main", { name: "Table stage" });
  expect(screen.queryByRole("region", { name: /table rail/i })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: /charm rail/i })).toBeInTheDocument();
  const hand = within(stage).getByRole("region", { name: /dice hand/i });
  expect(within(hand).getAllByRole("button", { name: /die \d/i })).toHaveLength(5);
  expect(screen.queryByRole("region", { name: /keep tray/i })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: /score offers/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /chip pot/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /thumb action/i })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: /table controls/i })).toContainElement(
    screen.getByRole("button", { name: /pause table/i }),
  );
  expect(within(hand).getByRole("button", { name: /die 1/i })).toHaveAttribute("aria-pressed", "true");
});
it("does not render a visible live notice until feedback exists", () => {
  localStorage.setItem(SAVE_KEY, JSON.stringify(enterTable(newRun(42))));
  const { container } = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  expect(container.querySelector(".sr-live")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /roll dice/i }));
  expect(screen.getByText("Dice settled")).toHaveAttribute(
    "aria-live",
    "polite",
  );
});
it("displays the exact base gained by a transform charm", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...enterTable(newRun(42)),
      dice: [2, 2, 3, 3, 6],
      rolls: 2,
      charms: ["silver-pair"],
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(screen.getByRole("button", { name: /score details/i }));
  expect(screen.getByText("+46 base")).toBeInTheDocument();
});
it("hides and disables all commerce after skipping shop offers", () => {
  const base = newRun(42);
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      ...base,
      status: "shop",
      score: base.target,
      cash: 20,
      shop: ["brass-tack"],
      charms: ["even-keel"],
    }),
  );
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(screen.getByRole("button", { name: /skip offers/i }));
  expect(screen.getByRole("status")).toHaveTextContent(/offers forfeited/i);
  expect(
    screen.queryByRole("button", { name: /^buy/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /^sell/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /refresh/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /briefing: table 2/i }),
  ).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: /skip offers/i }),
  ).not.toBeInTheDocument();
});
it("offers continue and confirms before overwrite", () => {
  localStorage.setItem(SAVE_KEY, JSON.stringify(newRun(42)));
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<App />);
  expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /start new run/i }));
  expect(confirm).toHaveBeenCalledOnce();
});
it("clears a continued run after it ends and returns to the main menu", () => {
  const run = {
    ...enterTable(newRun(42)),
    hands: 1,
    rolls: 0,
    dice: [1, 2, 3, 4, 5] as const,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(run));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(screen.getByRole("button", { name: /open table/i }));
  fireEvent.click(screen.getByRole("button", { name: /^score (?!details)/i }));
  expect(screen.getByText(/run complete/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /main menu/i }));
  expect(
    screen.queryByRole("button", { name: /continue/i }),
  ).not.toBeInTheDocument();
  expect(localStorage.getItem(SAVE_KEY)).toBeNull();
});
it("ignores corrupt current saves", () => {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...newRun(42), dice: [9] }));
  render(<App />);
  expect(
    screen.queryByRole("button", { name: /continue/i }),
  ).not.toBeInTheDocument();
});
it("rejects a dead playing save with no dice and no rolls", () => {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({ ...enterTable(newRun(42)), dice: [], rolls: 0 }),
  );
  render(<App />);
  expect(
    screen.queryByRole("button", { name: /continue/i }),
  ).not.toBeInTheDocument();
});
