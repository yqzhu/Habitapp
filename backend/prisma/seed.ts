import { PrismaClient } from '@prisma/client';

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
  await prisma.hero.upsert({
    where: { role: 'HERO' },
    update: {},
    create: { name: 'Hero', role: 'HERO' },
  });

  await prisma.hero.upsert({
    where: { role: 'BUDDY' },
    update: {},
    create: { name: 'Buddy', role: 'BUDDY' },
  });

  for (const key of attributes) {
    await prisma.attribute.upsert({
      where: { key },
      update: {},
      create: { key, label: key[0].toUpperCase() + key.slice(1) },
    });

    await prisma.cardsInventory.upsert({
      where: {
        attribute_tier: {
          attribute: key,
          tier: 'PAPER',
        },
      },
      update: {},
      create: {
        attribute: key,
        tier: 'PAPER',
        count: 0,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
