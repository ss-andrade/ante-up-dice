import { fireEvent, render, screen } from "@testing-library/react";
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
  expect(die).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("Category base")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /^score/i }));
  expect(screen.getByText(/previous score/i)).toBeInTheDocument();
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
  expect(screen.getAllByRole("button")).toHaveLength(1);
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
  fireEvent.click(screen.getByRole("button", { name: /^score/i }));
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
