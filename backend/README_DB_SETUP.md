# Phase 2 — Database Setup (Prisma + SQLite)

This project uses a local SQLite database for development.

## 1) Create backend env file

From repo root:

```bash
cp backend/.env.example backend/.env
```

## 2) Install dependencies

```bash
npm install
```

## 3) Generate Prisma client

```bash
npm run db:generate -w backend
```

## 4) Apply migration

```bash
npm run db:migrate -w backend
```

## 5) Seed baseline data

```bash
npm run db:seed -w backend
```

Seed creates:
- 2 heroes: Hero, Buddy
- 7 attributes
- initial PAPER inventory rows for all attributes
