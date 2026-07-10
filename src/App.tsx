import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CATEGORY_ORDER,
  CATEGORIES,
  CHARMS,
  TABLES,
  bestCategory,
  buy,
  doRoll,
  enterTable,
  evaluate,
  newRun,
  nextAnte,
  refresh,
  scoreHand,
  scoreTurn,
  sell,
  skipShop,
  toggleHold,
  type Category,
  type RunState,
  type Score,
} from "./engine";
import { LEGACY_SAVE_KEY, SAVE_KEY, isActiveRun, loadSavedRun } from "./save";

const HIGH_KEY = "ante-up-dice.high.v2";
const SETTINGS_KEY = "ante-up-dice.settings";
const PIPS = [
  [50, 50],
  [27, 27],
  [73, 73],
  [27, 73],
  [73, 27],
  [27, 50],
  [73, 50],
];
type Settings = { sound: boolean; motion: boolean; onboarding: boolean };
function readSettings(): Settings {
  try {
    return {
      sound: false,
      motion: true,
      onboarding: true,
      ...(JSON.parse(
        localStorage.getItem(SETTINGS_KEY) ?? "{}",
      ) as Partial<Settings>),
    };
  } catch {
    return { sound: false, motion: true, onboarding: true };
  }
}
function Die({
  value,
  held,
  onClick,
  index,
  rolling,
}: {
  value: number;
  held: boolean;
  onClick: () => void;
  index: number;
  rolling: boolean;
}) {
  const dots: Record<number, number[]> = {
    1: [0],
    2: [1, 2],
    3: [1, 0, 2],
    4: [1, 4, 3, 2],
    5: [1, 4, 0, 3, 2],
    6: [1, 5, 4, 3, 6, 2],
  };
  return (
    <button
      className={`die ${held ? "held" : ""} ${rolling && !held ? "rolling" : ""}`}
      onClick={onClick}
      aria-label={`Die ${index + 1}: ${value}, ${held ? "held; activate to release" : "not held; activate to hold"}`}
      aria-pressed={held}
    >
      {(dots[value] ?? []).map((p, i) => (
        <i
          aria-hidden="true"
          key={i}
          style={{ left: `${PIPS[p]?.[0]}%`, top: `${PIPS[p]?.[1]}%` }}
        />
      ))}
      {held && <span>HELD</span>}
    </button>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const closeDialog = useRef(onClose);
  const titleId = useId();
  useEffect(() => {
    closeDialog.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const scrim = dialog.current?.parentElement;
    const background = scrim
      ? ([...scrim.parentElement!.children].filter(
          (element) => element !== scrim,
        ) as HTMLElement[])
      : [];
    background.forEach((element) => {
      element.inert = true;
    });
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog.current();
        return;
      }
      if (e.key !== "Tab" || !dialog.current) return;
      const focusable = [
        ...dialog.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      background.forEach((element) => {
        element.inert = false;
      });
      if (opener?.isConnected) opener.focus();
      else {
        const heading = document.querySelector<HTMLElement>("main h1");
        heading?.setAttribute("tabindex", "-1");
        heading?.focus();
      }
    };
  }, []);
  return (
    <div
      className="scrim"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={dialog}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          ref={close}
          className="close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
        <h2 id={titleId}>{title}</h2>
        {children}
      </section>
    </div>
  );
}
async function tone(enabled: boolean, frequency = 240) {
  if (!enabled || typeof window.AudioContext !== "function") return;
  let context: AudioContext | null = null;
  try {
    context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.09);
  } catch {
    /* Optional audio is failure-safe. */
  } finally {
    if (context)
      window.setTimeout(() => {
        void context?.close().catch(() => undefined);
      }, 150);
  }
}
function Breakdown({ score }: { score: Score }) {
  return (
    <div className="breakdown">
      <div>
        <span>Category base</span>
        <b>{score.categoryBase}</b>
      </div>
      <div>
        <span>Dice total</span>
        <b>+{score.diceContribution}</b>
      </div>
      <div
        className={
          score.tableStep.baseDelta || score.tableStep.multDelta
            ? "triggered"
            : ""
        }
      >
        <span>
          {score.tableStep.source}
          <small>{score.tableStep.detail}</small>
        </span>
        <b>{delta(score.tableStep.baseDelta, score.tableStep.multDelta)}</b>
      </div>
      {score.charmSteps.map((step, i) => (
        <div className="triggered" key={`${step.source}-${i}`}>
          <span>
            {i + 1}. {step.source}
            <small>{step.detail}</small>
          </span>
          <b>{delta(step.baseDelta, step.multDelta)}</b>
        </div>
      ))}
      <div className="final">
        <span>Final</span>
        <b>
          {score.base} × {score.mult} = {score.chips}
        </b>
      </div>
    </div>
  );
}
function delta(base?: number, mult?: number) {
  if (base) return `${base > 0 ? "+" : ""}${base} base`;
  if (mult) return `${mult > 0 ? "+" : ""}${mult} mult`;
  return "—";
}
function Help({
  onClose,
  settings,
  setSettings,
}: {
  onClose: () => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
}) {
  return (
    <Modal title="Rules & accessibility" onClose={onClose}>
      <p>
        Clear each named table in four hands. Roll up to three times, hold any
        dice, choose a highlighted category, and inspect the exact score before
        committing.
      </p>
      <h3>Scoring categories</h3>
      <div className="rules">
        {CATEGORY_ORDER.map((id) => (
          <div key={id}>
            <b>{CATEGORIES[id].name}</b>
            <span>{CATEGORIES[id].help}</span>
            <strong>
              {CATEGORIES[id].base} + dice × {CATEGORIES[id].mult}
            </strong>
          </div>
        ))}
      </div>
      <h3>Settings</h3>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(e) =>
            setSettings({ ...settings, sound: e.target.checked })
          }
        />{" "}
        Optional generated sound
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.motion}
          onChange={(e) =>
            setSettings({ ...settings, motion: e.target.checked })
          }
        />{" "}
        Motion effects (system reduced-motion still wins)
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.onboarding}
          onChange={(e) =>
            setSettings({ ...settings, onboarding: e.target.checked })
          }
        />{" "}
        Show onboarding on new runs
      </label>
      <p>
        <small>
          Keyboard: Tab moves through every control; Enter or Space activates
          it; Escape closes this dialog. Status is always conveyed with words
          and shape, not color alone.
        </small>
      </p>
    </Modal>
  );
}
function PauseControl({
  onOpen,
  className = "",
}: {
  onOpen: () => void;
  className?: string;
}) {
  return (
    <nav className={`pause-control ${className}`.trim()} aria-label="Table controls">
      <button className="pause-table" onClick={onOpen}>Pause table</button>
    </nav>
  );
}

function TableMenu({ onClose, onHelp, onMenu }: { onClose: () => void; onHelp: () => void; onMenu: () => void }) {
  return <Modal title="Table menu" onClose={onClose}>
    <div className="table-menu-actions">
      <button onClick={onHelp}>Rules and settings</button>
      <button onClick={onMenu}>Main menu</button>
    </div>
  </Modal>;
}
function TableBriefing({
  run,
  onEnter,
}: {
  run: RunState;
  onEnter: () => void;
}) {
  const table = TABLES[run.ante - 1]!;
  return (
    <section className="briefing">
      <p className="eyebrow">
        Table {run.ante} of {TABLES.length}
      </p>
      <h1>{table.name}</h1>
      <p className="flavor">“{table.flavor}”</p>
      <section className="rule-card">
        <span>House rule</span>
        <h2>{table.rule}</h2>
        <div>
          <b>{table.target}</b> target <i>·</i> <b>${table.reward}</b> clear
          reward
        </div>
      </section>
      <p>
        You have four scoring hands and three rolls per hand. This rule applies
        to every score at this table.
      </p>
      <button className="primary" onClick={onEnter}>
        Take your seat
      </button>
    </section>
  );
}
function Recap({
  run,
  onNew,
  onMenu,
}: {
  run: RunState;
  onNew: () => void;
  onMenu: () => void;
}) {
  const best = run.stats.bestHand;
  const used = CATEGORY_ORDER.filter((c) => run.stats.categoryUsage[c]);
  return (
    <main className={`end ${run.status}`}>
      <p className="eyebrow">Run complete · seed {run.stats.seed}</p>
      <h1>{run.status === "won" ? "The house applauds" : "The table holds"}</h1>
      <p>
        {run.status === "won"
          ? "Eight distinct rooms, one finished run. Your build survived the Crown Vault."
          : `You finished ${run.score.toLocaleString()} of ${run.target.toLocaleString()} required at ${TABLES[run.ante - 1]!.name}.`}
      </p>
      <section className="recap-grid">
        <div>
          <b>Table {run.stats.tableReached}/8</b>
          <span>reached</span>
        </div>
        <div>
          <b>{run.stats.totalScore.toLocaleString()}</b>
          <span>total score</span>
        </div>
        <div>
          <b>{run.stats.handsScored}</b>
          <span>hands scored</span>
        </div>
        <div>
          <b>{run.stats.rerolls}</b>
          <span>rerolls used</span>
        </div>
        <div>
          <b>
            {best
              ? `${CATEGORIES[best.category].name} · ${best.score}`
              : "None"}
          </b>
          <span>best hand</span>
        </div>
        <div>
          <b>{run.cash}</b>
          <span>cash left</span>
        </div>
      </section>
      <h2>Final build</h2>
      <p>
        {run.charms.length
          ? run.charms
              .map((id) => CHARMS.find((c) => c.id === id)?.name)
              .join(" · ")
          : "No charms carried"}
      </p>
      <h2>Category use</h2>
      <p>
        {used.length
          ? used
              .map((c) => `${CATEGORIES[c].name} ${run.stats.categoryUsage[c]}`)
              .join(" · ")
          : "No hands scored"}
      </p>
      <button className="primary" onClick={onNew}>
        Deal new seed
      </button>
      <button onClick={onMenu}>Main menu</button>
    </main>
  );
}

export default function App() {
  const [run, setRun] = useState<RunState | null>(null);
  const [savedRun, setSavedRun] = useState<RunState | null>(() =>
    loadSavedRun(localStorage),
  );
  const [help, setHelp] = useState(false);
  const [settings, updateSettings] = useState(readSettings);
  const [selected, setSelected] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");
  const [purchaseNotice, setPurchaseNotice] = useState<{
    ante: number;
    text: string;
  } | null>(null);
  const purchaseStatus = useRef<HTMLParagraphElement>(null);
  const [rolling, setRolling] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [scorebook, setScorebook] = useState(false);
  const [payoutSlip, setPayoutSlip] = useState(false);
  const [tableMenu, setTableMenu] = useState(false);
  const [inspectedCharm, setInspectedCharm] = useState<string | null>(null);
  const [houseRuleOpen, setHouseRuleOpen] = useState(false);
  const openTableHelp = () => {
    document.querySelector<HTMLButtonElement>(".pause-table")?.focus();
    setTableMenu(false);
    setHelp(true);
  };
  const screenKey = run ? `${run.status}-${run.ante}` : "menu";
  useEffect(() => {
    if (document.querySelector('[role="dialog"]')) return;
    const heading = document.querySelector<HTMLElement>("main h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
  }, [screenKey]);
  useEffect(() => {
    if (purchaseNotice) purchaseStatus.current?.focus();
  }, [purchaseNotice]);
  const setSettings = (next: Settings) => {
    updateSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };
  useEffect(() => {
    document.documentElement.dataset.motion = settings.motion ? "on" : "off";
  }, [settings.motion]);
  useEffect(() => {
    if (!run) return;
    if (isActiveRun(run)) localStorage.setItem(SAVE_KEY, JSON.stringify(run));
    else {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY);
    }
  }, [run]);
  const valid = run?.dice.length === 5 ? evaluate(run.dice) : [];
  const choice =
    run?.dice.length === 5
      ? selected && valid.includes(selected)
        ? selected
        : bestCategory(run.dice, run)
      : null;
  const preview =
    run && choice
      ? scoreHand(run.dice, choice, run.charms, run.cash, run.rolls, run)
      : null;
  const high = Number(localStorage.getItem(HIGH_KEY) ?? 0);
  useEffect(() => {
    if (run && run.stats.totalScore > high)
      localStorage.setItem(HIGH_KEY, String(run.stats.totalScore));
  }, [run, high]);
  const act = (transition: (state: RunState) => RunState, sound = 260) => {
    if (!run) return;
    void tone(settings.sound, sound);
    const next = transition(run);
    if (!isActiveRun(next)) setSavedRun(null);
    setRun(next);
    setSelected(null);
  };
  const startNew = () => {
    if (
      savedRun &&
      !window.confirm("Start a new run? Your current run will be overwritten.")
    )
      return;
    const next = newRun();
    setRun(next);
    setShowOnboarding(settings.onboarding);
  };
  const roll = () => {
    setRolling(true);
    window.setTimeout(() => setRolling(false), settings.motion ? 220 : 0);
    act(doRoll, 180);
    setNotice("Dice settled");
  };
  const score = () => {
    if (!preview) return;
    setNotice(`${CATEGORIES[preview.category].name}: +${preview.chips}`);
    act((s) => scoreTurn(s, choice ?? undefined), 420);
  };
  const purchase = (id: string) => {
    if (!run) return;
    const charm = CHARMS.find((candidate) => candidate.id === id);
    if (!charm) return;
    const before = run.cash;
    act((state) => buy(state, id), 360);
    setPurchaseNotice({
      ante: run.ante,
      text: `${charm.name} purchased. Cash changed from $${before} to $${before - charm.cost}.`,
    });
  };
  const commerce = (transition: (state: RunState) => RunState) => {
    setPurchaseNotice(null);
    act(transition);
  };
  const goToMenu = () => {
    if (run && isActiveRun(run)) setSavedRun(run);
    else setSavedRun(null);
    setTableMenu(false);
    setRun(null);
  };
  const table = run ? TABLES[run.ante - 1]! : null;
  const onboarding = useMemo(
    () =>
      showOnboarding ? (
        <Modal title="Your first hand" onClose={() => setShowOnboarding(false)}>
          <ol>
            <li>Roll all five dice.</li>
            <li>Hold promising values; reroll the loose dice up to twice.</li>
            <li>Choose any ready category and open its score details.</li>
            <li>
              Score before four hands run out. Every table has a visible house
              rule.
            </li>
          </ol>
          <button className="primary" onClick={() => setShowOnboarding(false)}>
            Got it
          </button>
          <button
            onClick={() => {
              setShowOnboarding(false);
              setSettings({ ...settings, onboarding: false });
            }}
          >
            Skip future onboarding
          </button>
        </Modal>
      ) : null,
    [showOnboarding, settings],
  );

  if (!run)
    return (
      <main className="welcome">
        <div className="brandmark" aria-hidden="true">
          ⚄
        </div>
        <p className="eyebrow">A tabletop roguelike</p>
        <h1>
          ANTE UP
          <br />
          <em>DICE</em>
        </h1>
        <p>
          Read eight rooms. Shape a five-charm build. Make every score explain
          itself.
        </p>
        {savedRun && (
          <button className="primary" onClick={() => setRun(savedRun)}>
            Continue · Table {savedRun.ante}
          </button>
        )}
        <button className={savedRun ? "" : "primary"} onClick={startNew}>
          Start new run
        </button>
        <button onClick={() => setHelp(true)}>Rules & accessibility</button>
        <small>
          Local best run · {high.toLocaleString()} · saves stay on this device
        </small>
        {help && (
          <Help
            onClose={() => setHelp(false)}
            settings={settings}
            setSettings={setSettings}
          />
        )}
      </main>
    );
  if (run.status === "briefing")
    return (
      <main className="table-stage briefing-stage" aria-label="Table stage">
        <PauseControl onOpen={() => setTableMenu(true)} />
        <TableBriefing run={run} onEnter={() => act(enterTable, 320)} />
        {onboarding}
        {help && (
          <Help
            onClose={() => setHelp(false)}
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {tableMenu && <TableMenu onClose={() => setTableMenu(false)} onHelp={openTableHelp} onMenu={goToMenu} />}
      </main>
    );
  if (run.status === "won" || run.status === "lost")
    return (
      <Recap
        run={run}
        onNew={() => {
          setSavedRun(null);
          setRun(newRun());
        }}
        onMenu={() => {
          setSavedRun(null);
          setRun(null);
        }}
      />
    );
  if (run.status === "shop")
    return (
      <main className="table-stage shop-stage" aria-label="Table stage">
        <PauseControl onOpen={() => setTableMenu(true)} />
        <section className="shop dealer-tray" role="region" aria-label="Dealer tray">
          <header>
            <div>
              <p className="eyebrow">{table?.name} cleared</p>
              <h1>The Backroom</h1>
            </div>
            <div className="money" aria-label={`${run.cash} cash`}>
              ${run.cash}
            </div>
          </header>
          {purchaseNotice?.ante === run.ante && (
            <p ref={purchaseStatus} className="purchase-status" role="status" tabIndex={-1}>
              {purchaseNotice.text}
            </p>
          )}
          {run.skippedShop ? (
            <p role="status">
              Offers forfeited. Your $3 skip bonus is banked; proceed to the
              next-table briefing.
            </p>
          ) : (
            <>
              <p>
                Inventory {run.charms.length}/5. Sell before buying to pivot;
                every offer is unowned.
              </p>
              <section className="inventory" aria-label="Carried charms">
                {run.charms.length > 0 ? (
                  run.charms.map((id) => {
                    const charm = CHARMS.find((c) => c.id === id)!;
                    return (
                      <button className="carried-charm" key={id} aria-label={`Sell ${charm.name} · $${Math.max(2, Math.floor(charm.cost / 2))}`} aria-describedby={`carried-${id}-effect`} onClick={() => commerce((s) => sell(s, id))}>
                        <b>{charm.name}</b><small id={`carried-${id}-effect`}>{charm.text}</small><span>Sell · ${Math.max(2, Math.floor(charm.cost / 2))}</span>
                      </button>
                    );
                  })
                ) : <span className="empty-dock">No charms carried</span>}
              </section>
              <section className="wares" aria-label="Charm offers">
                {run.shop.map((id) => {
                  const charm = CHARMS.find((c) => c.id === id)!;
                  return (
                    <button
                      className={`charm ${charm.rarity.toLowerCase()}`}
                      key={id}
                      aria-label={`Buy ${charm.name} · $${charm.cost}`}
                      aria-describedby={`offer-${id}-meta offer-${id}-effect`}
                      disabled={run.cash < charm.cost || run.charms.length >= 5}
                      onClick={() => purchase(id)}
                    >
                      <span id={`offer-${id}-meta`}>
                        {charm.rarity} · {charm.timing}
                      </span>
                      <div className="sigil" aria-hidden="true">
                        ✦
                      </div>
                      <h2>{charm.name}</h2>
                      <p id={`offer-${id}-effect`}>{charm.text}</p>
                      <strong>Buy · ${charm.cost}</strong>
                    </button>
                  );
                })}
              </section>
              <div className="shop-actions">
                <button
                  disabled={run.refreshes >= 2 || run.cash < 2 + run.refreshes}
                  onClick={() => commerce(refresh)}
                >
                  Refresh ({run.refreshes}/2) · ${2 + run.refreshes}
                </button>
                <button onClick={() => commerce(skipShop)}>Skip offers · +$3</button>
              </div>
            </>
          )}
          <div className="shop-actions">
            <button className="primary" onClick={() => commerce(nextAnte)}>
              Briefing: Table {run.ante + 1}
            </button>
          </div>
        </section>
        {help && (
          <Help
            onClose={() => setHelp(false)}
            settings={settings}
            setSettings={setSettings}
          />
        )}
        {tableMenu && <TableMenu onClose={() => setTableMenu(false)} onHelp={openTableHelp} onMenu={goToMenu} />}
      </main>
    );
  return (
    <main className="table-stage play-stage" aria-label="Table stage">
      <header className="edge-hud">
        <div className="progress-counter">
          <p className="eyebrow">
            Table {run.ante} of {TABLES.length}
          </p>
          <span>{table?.name}</span>
          <strong>{run.score.toLocaleString()} / {run.target.toLocaleString()}</strong>
          <meter
            min="0"
            max={run.target}
            value={run.score}
            aria-label={`${run.score} of ${run.target} chips`}
          />
          <span>
            {run.score.toLocaleString()} banked · {run.target - run.score}{" "}
            needed
          </span>
        </div>
        <div className="hud-counters">
          <span>Hands <b>{run.hands}</b></span>
          <span>Rolls <b>{run.rolls}</b></span>
          <span>Cash <b>${run.cash}</b></span>
        </div>
        <PauseControl className="hud-navigation" onOpen={() => setTableMenu(true)} />
      </header>
      <section className="board">
        <header className="top" role="region" aria-label="Charm rail">
          <div className="table-title">
            <p className="eyebrow">Ante Up Dice</p>
            <h1>{run.dice.length ? "Shape the hand" : "Make your hand"}</h1>
          </div>
          <button
            type="button"
            className="house-rule-token"
            aria-label={`House rule: ${table?.rule}. Activate to inspect`}
            onClick={() => setHouseRuleOpen(true)}
          >
            House rule
          </button>
          <div
            className="slots"
            aria-label={`${run.charms.length} of 5 charm slots filled`}
          >
            {run.charms.map((id) => {
              const charm = CHARMS.find((c) => c.id === id)!;
              return (
                <button
                  type="button"
                  className="mini"
                  aria-label={`Inspect ${charm.name}`}
                  onClick={() => setInspectedCharm(id)}
                  key={id}
                >
                  <i aria-hidden="true">✦</i>
                  <b>{charm.name}</b>
                </button>
              );
            })}
            {Array.from({ length: 5 - run.charms.length }, (_, i) => (
              <div className="empty" aria-label="Empty charm slot" key={i}>
                ◇
              </div>
            ))}
          </div>
        </header>
        {notice && (
          <div className="sr-live" aria-live="polite">
            {notice}
          </div>
        )}
        <div className="dice-hand" role="region" aria-label="Dice hand">
          {run.dice.length ? (
            run.dice.map((die, i) => (
              <Die
                key={i}
                value={die}
                index={i}
                held={run.held[i] ?? false}
                rolling={rolling}
                onClick={() => {
                  act((s) => toggleHold(s, i), 210);
                  setNotice(
                    `Die ${i + 1} ${run.held[i] ? "released" : "held"}`,
                  );
                }}
              />
            ))
          ) : (
            <p className="ready">The dice are waiting.</p>
          )}
        </div>
        <div className="score-zone">
        <div className="score-offers" role="region" aria-label="Score offers">
          {valid.map((id) => {
            const category = CATEGORIES[id];
            return (
              <button
                key={id}
                className={choice === id ? "active" : ""}
                aria-pressed={choice === id}
                onClick={() => setSelected(id)}
              >
                <b>{category.name}</b>
                <small>READY</small>
              </button>
            );
          })}
        </div>
        <button className="scorebook-control" onClick={() => setScorebook(true)}>Scorebook</button>
        </div>
        <div className="score-panel">
          <div className="pot-region" role="region" aria-label="Chip pot">
            <button className="pot" aria-label={`Score details · hand pot ${preview?.chips ?? 0} chips`} onClick={() => setPayoutSlip(true)} disabled={!preview}>
              <span>Pot</span><strong>{preview?.chips ?? 0}</strong><small>Details</small>
            </button>
          </div>
          <div className="actions" role="region" aria-label="Thumb action">
            {run.dice.length === 0 ? (
              <button className="primary roll" data-importance="primary" onClick={roll}>
                Roll dice
              </button>
            ) : <>
              {run.rolls > 0 && <button className="reroll" data-importance="secondary" onClick={roll}>Reroll</button>}
              <span className="roll-counter">{run.rolls} left</span>
              <button className="primary score" data-importance="primary" onClick={score}>
                Score {choice ? CATEGORIES[choice].name : "hand"}
              </button>
            </>}
          </div>
        </div>
        {run.lastScore && (
          <details className="last-score">
            <summary>Previous score · {run.lastScore.chips} chips</summary>
            <Breakdown score={run.lastScore} />
          </details>
        )}
      </section>
      {scorebook && <Modal title="Scorebook" onClose={() => setScorebook(false)}><div className="rules scorebook-list">{CATEGORY_ORDER.map((id) => <div key={id}><b>{CATEGORIES[id].name}</b><span>{CATEGORIES[id].help}</span><strong>{CATEGORIES[id].base} + dice × {CATEGORIES[id].mult}</strong></div>)}</div></Modal>}
      {payoutSlip && preview && <Modal title={`Payout slip · ${CATEGORIES[preview.category].name}`} onClose={() => setPayoutSlip(false)}><Breakdown score={preview} /></Modal>}
      {inspectedCharm && (() => {
        const charm = CHARMS.find((candidate) => candidate.id === inspectedCharm);
        return charm ? <Modal title={charm.name} onClose={() => setInspectedCharm(null)}><p className="eyebrow">{charm.timing}</p><p>{charm.text}</p></Modal> : null;
      })()}
      {houseRuleOpen && table && <Modal title="House rule" onClose={() => setHouseRuleOpen(false)}><p>{table.rule}</p></Modal>}
      {help && (
        <Help
          onClose={() => setHelp(false)}
          settings={settings}
          setSettings={setSettings}
        />
      )}
      {tableMenu && <TableMenu onClose={() => setTableMenu(false)} onHelp={openTableHelp} onMenu={goToMenu} />}
    </main>
  );
}
