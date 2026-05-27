import { PrismaClient, CardTier, HeroRole } from '@prisma/client';

const prisma = new PrismaClient();

const attributes = [
  'physique',
  'charisma',
  'wisdom',
  'sociability',
  'farming',
  'wealth',
  'survival',
];

async function main() {
  await prisma.hero.upsert({ where: { role: HeroRole.HERO }, update: {}, create: { name: 'Hero', role: HeroRole.HERO } });
  await prisma.hero.upsert({ where: { role: HeroRole.BUDDY }, update: {}, create: { name: 'Buddy', role: HeroRole.BUDDY } });

  for (const key of attributes) {
    await prisma.attribute.upsert({ where: { key }, update: {}, create: { key, label: key[0].toUpperCase() + key.slice(1) } });
    await prisma.cardsInventory.upsert({ where: { attribute_tier: { attribute: key, tier: CardTier.PAPER } }, update: {}, create: { attribute: key, tier: CardTier.PAPER, count: 0 } });
  }
}

main().finally(async () => prisma.$disconnect());
