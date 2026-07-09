# Manual release QA

- Start a run with onboarding enabled; dismiss it, then disable/re-enable it in Rules & accessibility.
- Confirm each briefing shows name, flavor, exact rule, target, and reward before play; confirm the same rule remains in the table rail.
- Roll, keyboard-focus every die, hold/release, reroll, select alternate valid categories, and compare the preview with the previous-score breakdown.
- Verify the breakdown includes category base, dice sum, one table line, charm triggers in inventory/catalog order, and final base × multiplier.
- Clear a table; buy, sell, skip for $3 once, refresh at most twice, and enter the next briefing. Confirm no owned/duplicate offer and no sixth charm purchase.
- Return to menu during a hand and during a shop, then continue with seed, holds, offers, and stats intact. Try replacing a save and cancel the confirmation.
- Finish one loss and one victory; inspect target explanation, seed, reach, total, hands, rerolls, best hand, build, and category use.
- At 390×844 and 1440×900, verify roll/score remains visible, no critical control is clipped, dialogs scroll, and shop/table actions are reachable.
- Navigate all controls with Tab/Shift+Tab/Enter/Space; close dialogs with Escape; inspect accessible die labels, pressed states, meter label, and live hold/score announcements.
- Enable OS reduced motion and the in-game motion toggle separately. Toggle sound in a browser that allows and blocks WebAudio; play must continue without errors.
- Build, load once online, then reload the installed/production app offline. Confirm icon, shell, play, save, and continue work without network requests.
- Place a valid schema-v1 active save under `ante-up-dice.save.v1`; confirm it migrates to v2. Confirm malformed/future saves do not expose Continue.
