# Hero Habit Forge — Updated Project Request

## Product Goal
Build a local-first, single-user daily goal and to-do management app with RPG progression.

The product promise:
> Each day, I complete my scheduled real-life tasks to earn attribute cards, merge them up to Gold, invest Gold into Hero/Buddy stats, and unlock branching adventures that reflect my real-world consistency.

## Core System Rules
- Attributes: Physique, Charisma, Wisdom, Sociability, Farming, Wealth, Survival.
- Card tiers: Paper → Rock → Bronze → Silver → Gold.
- Card merge rule: 3 cards of the same tier and same attribute upgrade to 1 card in the next tier.
- Strict merging: no cross-attribute merges.
- Task mapping: each task maps to exactly one attribute and one default card tier.
- Task completion can allow user-requested +1 tier when effort is significantly higher than planned.
- Rollover behavior:
  - No penalties for missed tasks.
  - Missed tasks roll over to the next day.
  - Same-template rollover instances merge into one active task.
  - Completing a merged task grants one reward only.
- Character model: two fixed characters in v1: Hero and Buddy.
- Gold-to-stat progression:
  - Gold cards are converted into attribute progress.
  - User chooses whether to apply progress to Hero or Buddy.
  - Attribute level-up threshold scales by `3 + current_level`.

## Adventure System (Updated)
- Story style: detective mystery inspired by Sherlock Holmes / Agatha Christie tone.
- Structure: branching mini-story arcs with investigation choices.
- Unlocking:
  - Story chapters, locations, suspects, and evidence interactions unlock progressively as Hero/Buddy attributes level up.
  - Some branches require minimum stat gates and then use probabilistic quality outcomes.
- Hint economy:
  - Users may trade in cards to purchase hints when progression feels blocked.
  - Hints can reveal suspect motives, next best investigation lead, clue interpretation, or branch unlock guidance.
  - Hint prices should be configurable and can scale by story chapter difficulty.

## MVP Screens
1. Onboarding (name Hero and Buddy, explain loop)
2. Task Templates & Cadence setup
3. Today Board (scheduled + rolled-over merged tasks)
4. Card Inventory + Forge (3→1 merge)
5. Hero/Buddy Stats (Gold progress and level-up bars)
6. Adventure (detective storyline with branching and hint trade-in)

## Suggested Tech
- Frontend: React + TypeScript + Vite
- Backend/API: Node + Express or Next.js API routes
- Database: SQLite + Prisma
- Local-first operation, no auth required for v1
