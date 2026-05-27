import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const attributes = [
  'Physique',
  'Charisma',
  'Wisdom',
  'Sociability',
  'Farming',
  'Wealth',
  'Survival',
];

const tiers = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'];

async function main() {
  await prisma.hero.upsert({ where: { role: 'HERO' }, update: {}, create: { name: 'Hero', role: 'HERO' } });
  await prisma.hero.upsert({ where: { role: 'BUDDY' }, update: {}, create: { name: 'Buddy', role: 'BUDDY' } });

  for (const label of attributes) {
    await prisma.attribute.upsert({ where: { key: label.toLowerCase() }, update: { label }, create: { key: label.toLowerCase(), label } });
    for (const tier of tiers) {
      await prisma.cardsInventory.upsert({ where: { attribute_tier: { attribute: label, tier } }, update: {}, create: { attribute: label, tier, count: 0 } });
    }
  }

  const chapter1Requirements = {
    unlock: { minAnyStatLevel: 0 },
    recommended: ['Wisdom 1', 'Physique 1 or Sociability 1'],
  };

  const chapter1Branches = {
    intro: 'A jeweler reports a stolen sapphire at Dawnmarket. You can inspect the alley or interview the anxious clerk.',
    choices: [
      {
        id: 'alley-track',
        label: 'Chase muddy boot prints through the alley (Direct path)',
        checks: [{ attribute: 'Physique', min: 1, weight: 0.55 }, { attribute: 'Survival', min: 1, weight: 0.45 }],
        outcomes: {
          success: 'You corner the courier and recover the ledger page proving who ordered the theft.',
          partial: 'You lose the courier but find a torn glove tag: "Brass Finch".',
          fail: 'Rain ruins the tracks. You only confirm the thief escaped toward the tavern district.',
        },
      },
      {
        id: 'clerk-interview',
        label: 'Calm the clerk and reconstruct witness timeline (Social path)',
        checks: [{ attribute: 'Sociability', min: 1, weight: 0.5 }, { attribute: 'Wisdom', min: 1, weight: 0.5 }],
        outcomes: {
          success: 'The clerk reveals a fake inspector badge and points to suspect Elias Quill.',
          partial: 'You get inconsistent testimony, but identify the suspect wore a dockworker coat.',
          fail: 'The clerk panics and gives little detail; you only learn the theft happened before dawn.',
        },
      },
    ],
    rewardOnComplete: { cards: [{ attribute: 'Wisdom', tier: 'Paper', count: 1 }] },
  };

  const chapter2Requirements = { unlock: { chapterComplete: 1 }, recommended: ['Charisma 1', 'Wisdom 2'] };
  const chapter2Branches = {
    intro: 'At Brass Finch Tavern, suspects split into a bribed porter and a blackmailer accountant.',
    choices: [
      {
        id: 'pressure-porter',
        label: 'Pressure the porter with firm interrogation (Direct path)',
        checks: [{ attribute: 'Physique', min: 1, weight: 0.6 }, { attribute: 'Charisma', min: 1, weight: 0.4 }],
        outcomes: { success: 'Porter confesses route details.', partial: 'Porter lies, but you get warehouse district clue.', fail: 'Porter bolts and you lose time.' },
      },
      {
        id: 'audit-ledger',
        label: 'Audit tavern ledgers for hidden payoffs (Intellectual path)',
        checks: [{ attribute: 'Wisdom', min: 2, weight: 0.6 }, { attribute: 'Wealth', min: 1, weight: 0.4 }],
        outcomes: { success: 'You map payment chain to the mastermind.', partial: 'You find one alias, enough to continue.', fail: 'Entries are coded; progress stalls.' },
      },
    ],
    rewardOnComplete: { cards: [{ attribute: 'Sociability', tier: 'Paper', count: 1 }] },
  };

  await prisma.adventure.upsert({ where: { id: 1 }, update: { chapter: 1, title: 'The Sapphire at Dawnmarket', requirementsJson: JSON.stringify(chapter1Requirements), branchesJson: JSON.stringify(chapter1Branches), difficulty: 1 }, create: { id: 1, chapter: 1, title: 'The Sapphire at Dawnmarket', requirementsJson: JSON.stringify(chapter1Requirements), branchesJson: JSON.stringify(chapter1Branches), difficulty: 1 } });
  await prisma.adventure.upsert({ where: { id: 2 }, update: { chapter: 2, title: 'Echoes in Brass Finch', requirementsJson: JSON.stringify(chapter2Requirements), branchesJson: JSON.stringify(chapter2Branches), difficulty: 2 }, create: { id: 2, chapter: 2, title: 'Echoes in Brass Finch', requirementsJson: JSON.stringify(chapter2Requirements), branchesJson: JSON.stringify(chapter2Branches), difficulty: 2 } });

  const hints = [
    { adventureId: 1, hintType: 'light', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Paper', count: 1 }), scope: 'Chapter 1: Compare who benefits from a fake inspector badge.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'medium', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Paper', count: 2 }), scope: 'Chapter 1: Both paths point toward Brass Finch Tavern.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'strong', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Rock', count: 1 }), scope: 'Chapter 1: Prioritize the branch matching your stronger stat for best odds.', difficultyBand: 1 },
  ] as const;

  for (const hint of hints) {
    await prisma.hintStore.upsert({ where: { id: hints.indexOf(hint) + 1 }, update: hint, create: { id: hints.indexOf(hint) + 1, ...hint } });
  }

  await prisma.adventureProgress.upsert({ where: { adventureId: 1 }, update: { status: 'UNLOCKED' }, create: { adventureId: 1, status: 'UNLOCKED' } });
  await prisma.adventureProgress.upsert({ where: { adventureId: 2 }, update: { status: 'LOCKED' }, create: { adventureId: 2, status: 'LOCKED' } });
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
