# Codex Build Prompt (Updated)

Build a local-first single-user web app for macOS called "Hero Habit Forge".

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node + Express (or Next.js API routes)
- DB: SQLite with Prisma
- Local run only (no auth, no cloud dependency for core operation)

## Core Design Rules
- Attributes: Physique, Charisma, Wisdom, Sociability, Wealth, Survival
- Card tiers: Paper, Rock, Bronze, Silver, Gold
- Merge: 3 cards of same attribute+tier -> 1 card of next tier
- Tasks are user-defined templates with cadence and fixed attribute+tier mapping
- One task maps to exactly one attribute
- Today view shows scheduled tasks; missed tasks roll over and merge by template into one active task
- Completing merged task grants one reward only
- One-off tasks can be added for today
- User may request +1 tier on completion for unusually high effort
- Two characters only: Hero and Buddy
- Gold cards contribute to attribute stat progress on either Hero or Buddy
- Level threshold: needed_gold = 3 + current_level

## Adventure System (Detective Theme)
- Story format: branching detective mystery inspired by Sherlock Holmes / Agatha Christie style
- Content unlocks by leveling Hero/Buddy attributes:
  - chapters
  - locations
  - suspects
  - clue analysis branches
- Branch checks are hybrid:
  - minimum stat gate to attempt
  - probability-weighted outcome quality based on relevant stats
- Add hint economy:
  - user can trade certain cards to buy hints
  - hints may reveal clue interpretation, likely suspect, next lead, or branch recommendation
  - hint pricing should be configurable and can scale by chapter difficulty

## Screens to Build
1) Onboarding
2) Task Templates/Cadence
3) Today Board
4) Card Inventory + Forge
5) Hero/Buddy Stats
6) Adventure (detective storyline + hint trade-in)

## Deliverables
- Working app runnable locally
- Seed data for:
  - 8 sample task templates
  - 5 detective story adventures
- README with setup/run steps for non-technical users
- Simple JSON backup export/import
