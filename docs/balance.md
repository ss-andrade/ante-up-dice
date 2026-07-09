# Balance report

## Harness

Run `npm run simulate`. The command executes 1,000 seeds through `src/simulation.ts` using only public engine transitions. The baseline keeps matching groups, pursues four-value runs when it has three useful values, otherwise favors high dice; it buys affordable charms using a fixed build priority and takes skip cash after shopping. This is a competent but non-omniscient benchmark, not an autoplay promise.

## Latest baseline

Recorded after the v1 target/economy pass:

```text
runs=1000 victories=560 rate=56.0%
table reach counts=1000/1000/1000/1000/998/988/940/812
median total score=5465, p90=5986, average hands=18.9
```

Seed 1 is the deterministic victory fixture; seed 2 is the deterministic defeat fixture. The benchmark wins some but not all runs, and attrition begins before the final room. Early targets teach rules without depending on a purchase; late targets assume a coherent multi-charm build. Rewards rise from $8 to $22, common prices are $3–$5, uncommon $7–$8, rare $11–$13, selling returns roughly half, skipping unbought offers grants $3, and each shop permits two increasingly priced refreshes.

The report is deterministic for the checked-in engine and heuristic. Content or strategy changes require rerunning it and updating these numbers.
