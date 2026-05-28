# Next Steps Roadmap (PR1–PR7)

## Non-negotiable guardrail for all upcoming PRs
**Do NOT change underlying MVP logic/functions unless explicitly required by the scoped PR.**

In particular, preserve these systems:
- task cadence generation and board behavior
- card award and 3→1 forge logic
- gold-to-stat progression formula
- adventure persistence/progression contracts
- existing API contracts unless a PR explicitly calls out a controlled change

The next version focus is:
1) **UI improvement**
2) **narrative rewrite + balancing**

---

## PR execution order

## PR1 — UI foundation + layout cleanup (no logic changes)
Goal: establish visual system and clearer page structure while keeping behavior unchanged.

## PR2 — Adventure UX redesign (UI only)
Goal: make chapter/milestone play readable and pleasant without changing backend mechanics.

## PR3 — Chapter 1 narrative rewrite + copy polish
Goal: improve writing quality, scene transitions, and result text clarity.

## PR4 — Chapter 2 full narrative implementation
Goal: convert chapter 2 from placeholder/prologue into complete playable storyline.

## PR5 — Adventure balancing pass
Goal: smooth milestone difficulty, improve early accessibility, preserve dual solve paths.

## PR6 — Content authoring pipeline
Goal: move adventure content into maintainable chapter content structure and add validation tooling.

## PR7 — Regression tests + verification hardening
Goal: lock MVP behavior and adventure progression with automated checks.

---

## Detailed PR1 instruction (copy/paste-ready)

### PR1 title
`UI foundation pass: design system + page layout cleanup (no gameplay logic changes)`

### PR1 objective
Improve visual quality and usability of the current MVP UI while preserving all existing behavior and backend contracts.

### PR1 scope (in)
- Create a lightweight UI style foundation:
  - design tokens (colors, spacing, radius, typography)
  - reusable visual classes/components (button, panel, section, badge-like states)
- Improve overall layout hierarchy:
  - cleaner section spacing
  - stronger headings/subheadings
  - improved readability and visual grouping
- Keep all existing sections available and working:
  - Task Templates
  - Today Board
  - Card Inventory + Forge
  - Hero/Buddy Stats
  - Adventure
- Improve inline feedback presentation (success/error/info text styling).

### PR1 scope (out)
- No schema migration changes.
- No backend logic changes.
- No changes to calculations/probabilities/stat formulas.
- No adventure content rewrite in this PR.

### PR1 acceptance criteria
- All existing user flows still work exactly as before.
- No change in API payload contracts.
- UI is visibly cleaner and more consistent.
- Build passes for frontend and backend.
- Local click-test confirms no regressions in previous phases.

### PR1 required verification
1. Run install/build commands.
2. Run app locally.
3. Perform click-tests for:
   - template create/pause
   - today task complete/cancel/delete
   - forge merge
   - gold invest
   - adventure open/attempt/hint buy
4. Confirm behavior unchanged except visual presentation.

### PR1 implementation notes for Codex
- Keep diff focused and small.
- Prefer CSS and presentational refactors.
- If introducing components, keep them dumb/presentational.
- Avoid touching backend files unless absolutely necessary for compile integrity.

---

## Suggested scope hints for PR2–PR7

### PR2 (Adventure UX only)
- milestone stepper, outcome card, hint drawer, lock reasons.
- no backend algorithm change.

### PR3 (Narrative rewrite chapter 1)
- rewrite intro/milestones/outcome copy and pacing.
- maintain same structural mechanics.

### PR4 (Full chapter 2)
- implement full 5-milestone chapter 2 with dual paths.
- preserve beginner-to-intermediate ramp.

### PR5 (Balance)
- tune thresholds/weights/hint costs.
- keep formulas comprehensible and documented.

### PR6 (Content pipeline)
- chapter data extraction + validation scripts.
- safer authoring/editing process.

### PR7 (Tests)
- regression coverage for core loops + adventure progression and completion lock behavior.
