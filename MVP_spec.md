# Hero Habit Forge — Updated MVP Spec

## 1) Product Vision
A local-first, single-user app that turns daily real-world consistency into RPG-style progression.

**Core promise:**
Complete scheduled tasks → earn attribute cards → merge up to Gold → invest into Hero/Buddy stats → unlock and progress detective adventures.

---

## 2) Target User & Platform
- **User:** Single user (you), no multi-user/account system in v1.
- **Platform:** Local macOS use.
- **App shape:** Local-first web app.

---

## 3) Core Gameplay Model

### 3.1 Attributes
- Physique
- Charisma
- Wisdom
- Sociability
- Farming
- Wealth
- Survival

### 3.2 Card Tiers
- Paper
- Rock
- Bronze
- Silver
- Gold

### 3.3 Merge Rule
- `3` cards of the **same attribute** and **same tier** merge into `1` card of next tier.
- Strict merge only (no cross-attribute merge).

### 3.4 Task-to-Card Mapping
- Every task template maps to exactly:
  - one attribute
  - one default card tier
- Mapping is user-defined at setup/edit time.
- Completion normally grants mapped tier.
- Optional manual uplift: user can request `+1` tier for unusually higher effort.

---

## 4) Task Planning & Cadence

### 4.1 Recurring Cadence
User defines task cadence, e.g.:
- daily
- every other day
- specific weekdays (Mon/Wed)
- weekly

### 4.2 Daily Task Generation
System builds each day’s task list from cadence and carries over pending items.

### 4.3 Rollover Rules
- No penalty for missed tasks.
- Missed tasks roll over to next day.
- Unlimited rollover allowed.
- Same-template rollover instances merge into a single active task.
- Completing merged task grants **single reward only** (not stacked rewards).

### 4.4 One-off Tasks
- User can add one-off tasks for the day.
- One-off tasks still require attribute + default tier mapping.

---

## 5) Characters & Stat Progression

### 5.1 Character Setup
- Two fixed characters in v1:
  - Hero
  - Buddy

### 5.2 Gold Conversion
- Gold cards are used for stat progress.
- User chooses whether to invest into Hero or Buddy per conversion.

### 5.3 Level Formula
For each character + attribute:
- Current level = `L`
- Gold needed for next level = `3 + L`

Example:
- Level 0 → 1 needs 3 Gold progress
- Level 1 → 2 needs 4
- Level 2 → 3 needs 5

---

## 6) Adventure System (Detective Theme)

### 6.1 Narrative Direction
Branching detective stories inspired by Sherlock Holmes / Agatha Christie tone.

### 6.2 Unlock Progression
Adventure elements unlock by stat progression:
- chapters
- locations
- suspects
- evidence analysis branches

### 6.3 Choice Resolution
Hybrid checks:
1. Minimum stat gate to attempt branch
2. Probability-weighted quality outcome based on relevant stats

### 6.4 Hint Economy
- User can trade cards for hints when blocked.
- Hint examples:
  - likely suspect direction
  - clue interpretation
  - next productive lead
  - branch recommendation
- Hint prices configurable, with optional scale by chapter difficulty.

---

## 7) MVP Screens
1. **Onboarding**
   - Name Hero and Buddy
   - Explain loop briefly
2. **Task Templates & Cadence**
   - Create/edit recurring templates
   - Assign attribute + default tier
3. **Today Board**
   - Show scheduled + rollover merged tasks
   - Complete tasks
   - Add one-off tasks
4. **Card Inventory & Forge**
   - Card counts by attribute/tier
   - Execute 3→1 merges
5. **Hero/Buddy Stats**
   - View levels and progress bars
   - Convert Gold progress into selected character attribute
6. **Adventure**
   - Detective chapter list
   - Branch choices and outcomes
   - Hint purchase/trade-in actions

---

## 8) Data Model (MVP)
- `heroes` (`id`, `name`, `role` hero|buddy)
- `attributes` (seed list)
- `hero_stats` (`hero_id`, `attribute`, `level`, `progress_gold`)
- `task_templates` (`id`, `title`, `cadence_rule`, `attribute`, `base_tier`, `is_active`)
- `task_instances` (`id`, `template_id`, `scheduled_date`, `status`, `merged_group_key`)
- `cards_inventory` (`attribute`, `tier`, `count`)
- `adventures` (`id`, `chapter`, `title`, `requirements_json`, `branches_json`, `difficulty`)
- `adventure_runs` (`id`, `adventure_id`, `played_at`, `result_json`)
- `hint_store` (`id`, `hint_type`, `price_json`, `scope`, `difficulty_band`)

---

## 9) Non-Goals for v1
- Multiplayer / shared worlds
- Cloud sync / auth
- Real-time combat engine
- Procedural infinite stories

---

## 10) Success Criteria
- User can configure recurring tasks and see accurate daily generation.
- Card earning and 3→1 merge mechanics are correct.
- Gold-to-stat scaling progression works for Hero and Buddy.
- Detective adventure branches unlock and resolve with hybrid checks.
- Hint trade-ins are functional and configurable.
- Entire app runs locally with clear setup docs.
