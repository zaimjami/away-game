# Design rationale: how the pieces connect

This is a living traceability table. Every feature in the prototype should trace back to a breakdown in the [task model](01-task-model.md) and a need in the [personas](03-personas.md). If a feature can't, it's a candidate for cutting. If a breakdown has no feature, it's a gap.

| Breakdown | Persona need | Bootleg source | Prototype feature | Where in code |
|---|---|---|---|---|
| B1 no trusted readiness read | Amara: "one glance" | #1 Rings | Verdict in the center of the watch face, built from sleep, travel hours, and time zones | `computeReadiness()` in `app.js` |
| B1 jet lag vs. fatigue | Amara | #11 Lamp (partial) | Verdict explains *why* ("mostly jet lag, this usually eases in a day or two") | `computeReadiness()` reasons |
| B2 coach unreachable | Coach Reyes: "set rules once" | #6 Coach | Coach rules editor; verdict is labeled "coach's rule" | Coach tab, `state.rules` |
| B3 guilt drives decision | Amara: rest feels like failure | #1 Rings | Resting **closes** the train ring and counts toward the streak when it matches the plan | `ringProgress()`, `streak()` |
| B4 reviews don't answer athlete questions | Amara, anti-persona Jordan | #2 Pins | Places show equipment, day pass, hours, verified count; no star ratings | `data.js` places, Places tab |
| B5 bad trip trade-offs | Amara: walks ≤ 20 min | #2 Pins | Walking time from the hotel, sorted nearest first, filtered to what today's session needs | `placesFor()`, `bestPlace()` |
| B6 can't adapt session | Amara: plan-follower | #12 One Card | "Swap for an equivalent session," only offering swaps possible with gear nearby | `swapOptions()` |
| B7 food trust | Amara: picky before races | #13, #2 | Food spots tagged by trust signals (familiar, sealed water, pre-race safe) | `data.js`, Places → Food |
| B8 coach loses visibility | Coach Reyes: summary | #6 Coach | Day summary sends, or queues and sends when back online; coach sees one line per athlete | `sendSummary()`, `flushQueue()` |
| B9 jet lag | Amara | #11 Lamp | Sleep screen on the watch with a direction-specific tip | `sleepTip()` |
| B10 tech fails abroad | Amara: 2 GB roaming | #8 Passport, class reflection | Service worker caches everything; no-signal banner; printable paper passport with the coach's rules on it | `sw.js`, `renderPassport()` |

## Open gaps

- **B6** swap suggestions are hard-coded. A real version needs the coach to define equivalents.
- **D3 guilt** is an assumption. If interviews show athletes don't feel guilt about rest, the "rest closes the ring" feature loses its main reason to exist.
- The wrist interaction is simulated on a screen. It hasn't been tested for glanceability (can someone read the verdict in under 2 seconds mid-warmup?).
- The readiness score weights (9 points per hour of sleep debt, 4 per time zone) are placeholders I made up, not sports science. They exist to make the prototype react; a real product would need validated measures or the coach's own thresholds only.

## Evaluation plan (next phase)

1. Give 3 athletes a scenario card ("You landed in Lisbon last night, slept 5 hours, crossed 5 time zones, and have 6×200m planned").
2. Ask them to think aloud while using the prototype.
3. Record where their thinking matches the task model's decisions, and where it doesn't.
4. Update the task model first, then the design.
