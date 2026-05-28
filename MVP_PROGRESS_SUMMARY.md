# Hero Habit Forge — MVP Progress Summary (Phases 1–6)

## Project snapshot
Hero Habit Forge is now at a working MVP stage with all planned core phases implemented locally:
- Phase 1: frontend/backend scaffold
- Phase 2: DB schema + migrations + seed
- Phase 3: Task Templates + Today Board
- Phase 4: Cards + Forge
- Phase 5: Hero/Buddy stats
- Phase 6: Adventure system (initial playable version)

---

## What is implemented so far

## Phase 1 — Scaffold
- React + TypeScript + Vite frontend is set up.
- Node + Express backend is set up.
- App can run locally as a single-user local-first experience.

## Phase 2 — Database foundation
- Prisma + SQLite models and migrations are in place.
- Seed pipeline exists and initializes baseline entities.

## Phase 3 — Task Templates + Today Board
- Create recurring templates with cadence rules.
- Generate/track daily and rollover tasks.
- Add one-off tasks.
- Complete/cancel/delete task instances with visible board state updates.

## Phase 4 — Card Inventory + Forge
- Task completion awards cards based on task mapping.
- Inventory groups cards by attribute/tier.
- 3→1 merge (same attribute + same tier) works.

## Phase 5 — Hero/Buddy stats
- Gold investment into Hero/Buddy attributes works.
- Level formula works (`neededGold = 3 + currentLevel`).
- Progress and level state is visible in UI.

## Phase 6 — Adventure system (current MVP state)
- Adventure chapter list + lock status.
- Chapter detail endpoint + UI.
- Choice attempts with:
  - min-stat gating
  - probability-weighted outcomes
- Hint purchase endpoint with card-cost deduction and insufficient-card rejection.
- Adventure progression persistence and chapter unlock flow.
- Chapter 1 expanded to a 5-milestone story path.
- Chapter completion is non-replayable (no regression after completion).

---

## Key product constraints currently respected
- Local-first, single-user workflow.
- Prior phase loops (tasks/cards/stats) remain intact.
- Adventure layer is additive and uses existing progression.
- User-facing validation errors are present for failed actions.

---

## Known quality gap (intended next focus)
MVP mechanics work, but quality needs significant improvement in:
1. UI/UX polish and information hierarchy.
2. Narrative depth/tone and adventure content quality.
3. Adventure balancing/readability (especially hint communication and requirement clarity).

These are the primary goals for next version work.

---

## Overall project scope (from `codex_prompt.md` + `codex_prompt_V2`)

### Product + platform scope
- Local-first, single-user web app for macOS named **Hero Habit Forge**.
- Stack: React + TypeScript + Vite (frontend), Node + Express (backend), SQLite + Prisma (DB).
- No cloud dependency required for core use.

### Core gameplay scope
- Attributes: Physique, Charisma, Wisdom, Sociability, Farming, Wealth, Survival.
- Card tiers: Paper, Rock, Bronze, Silver, Gold.
- Merge rule: 3 same attribute+tier → 1 of next tier.
- Task templates map to one attribute + one default tier.
- Today Board supports cadence scheduling, rollover merge by template, and one-off tasks.
- Hero/Buddy progression uses Gold cards with scaling requirement `neededGold = 3 + currentLevel`.

### Adventure scope (Phase 6 baseline)
- Detective-themed branching story.
- Unlock and progression tied to player state and chapter progression.
- Branch checks are hybrid:
  1) minimum stat gate to attempt,
  2) probability-weighted outcome quality.
- Hint economy supports trading cards for hints with configurable pricing.
- Hints can guide clues/suspects/next leads/branch recommendation.

### `codex_prompt_V2` story-system requirements
- Story outcomes must map logically to attributes (no unrealistic stat outcomes).
- Each major case should support at least two viable solve paths:
  - direct/forceful path,
  - social/intellectual path.
- Avoid single-stat dominance across chapter flow.
- Early chapters should remain beginner-accessible.
- Failed checks should still allow partial progress where reasonable (soft-fail design).
- Hint ladder should include light/medium/strong variants with scaling costs.

### Required implementation discipline for future work
- Before implementing/rewriting chapter content, produce a Chapter Design Brief:
  - title/summary, triggers, clue graph, required checks, optional checks,
    hint options+cost+effect, outcomes, rewards.
- Keep PRs small and phase-focused.
- Preserve existing MVP logic unless explicitly changing scoped mechanics.
