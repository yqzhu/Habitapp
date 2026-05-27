import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const attributes = ['Physique', 'Charisma', 'Wisdom', 'Sociability', 'Farming', 'Wealth', 'Survival'];
const tiers = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'];

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

  const chapter1Requirements = { unlock: { minAnyStatLevel: 0 }, recommended: ['First 3 milestones are beginner friendly', 'Last 2 require level 1 in related stat'] };
  const chapter1Branches = {
    intro: 'Detective case: The Sapphire at Dawnmarket. Complete five milestones to reveal the criminal.',
    finalReveal: 'Truth revealed: Elias Quill, the tavern accountant, staged the theft and hired a courier.',
    milestones: [
      { index: 1, title: 'Survey the scene', narrative: 'You arrive at the jeweler and gather first impressions.', checks: [], choices: [
        { id: 'm1-direct', label: 'Inspect alley footprints (direct)', checks: [{ attribute: 'Survival', min: 0, weight: 0.6 }, { attribute: 'Physique', min: 0, weight: 0.4 }], outcomes: { success: 'You mark a clean trail to the docks.', partial: 'You recover one boot print and mud sample.', fail: 'Rain blurs tracks, but you still confirm escape route.' } },
        { id: 'm1-social', label: 'Question nearby vendors (social/intellectual)', checks: [{ attribute: 'Sociability', min: 0, weight: 0.5 }, { attribute: 'Wisdom', min: 0, weight: 0.5 }], outcomes: { success: 'A vendor identifies a fake inspector badge.', partial: 'You get timing but no face.', fail: 'Witnesses are unsure, but mention tavern district.' } },
      ] },
      { index: 2, title: 'Build suspect list', narrative: 'Two names surface: a porter and accountant Elias Quill.', checks: [], choices: [
        { id: 'm2-direct', label: 'Tail the porter (direct)', checks: [{ attribute: 'Physique', min: 0, weight: 0.55 }, { attribute: 'Survival', min: 0, weight: 0.45 }], outcomes: { success: 'You follow him to Brass Finch backdoor.', partial: 'You lose him but find his route notes.', fail: 'He slips away, but you confirm tavern involvement.' } },
        { id: 'm2-social', label: 'Audit witness timelines (social/intellectual)', checks: [{ attribute: 'Wisdom', min: 0, weight: 0.6 }, { attribute: 'Charisma', min: 0, weight: 0.4 }], outcomes: { success: 'You spot Elias in conflicting alibis.', partial: 'You narrow time window of theft.', fail: 'No clear contradiction yet.' } },
      ] },
      { index: 3, title: 'Enter Brass Finch', narrative: 'Inside the tavern, you need leverage for ledgers or testimony.', checks: [], choices: [
        { id: 'm3-direct', label: 'Pressure guard for access (direct)', checks: [{ attribute: 'Physique', min: 0, weight: 0.6 }, { attribute: 'Charisma', min: 0, weight: 0.4 }], outcomes: { success: 'Guard yields private ledger room.', partial: 'Guard stalls, but reveals Elias works late.', fail: 'Guard refuses; you still map the staff schedule.' } },
        { id: 'm3-social', label: 'Befriend the barmaid (social)', checks: [{ attribute: 'Sociability', min: 0, weight: 0.5 }, { attribute: 'Charisma', min: 0, weight: 0.5 }], outcomes: { success: 'She reveals hidden payment slips.', partial: 'She hints at coded tabs.', fail: 'She stays cautious, but points to accounting desk.' } },
      ] },
      { index: 4, title: 'Decode payment trail', narrative: 'Now stronger evidence requires trained judgement.', checks: [{ attribute: 'Wisdom', min: 1 }], choices: [
        { id: 'm4-direct', label: 'Force open locked records chest (direct)', checks: [{ attribute: 'Physique', min: 1, weight: 0.6 }, { attribute: 'Survival', min: 1, weight: 0.4 }], outcomes: { success: 'You recover payroll tied to fake courier.', partial: 'Chest cracks; only partial receipts remain.', fail: 'No opening, but chest seal links to Elias office.' } },
        { id: 'm4-intel', label: 'Decrypt coded ledger entries (intellectual)', checks: [{ attribute: 'Wisdom', min: 1, weight: 0.7 }, { attribute: 'Wealth', min: 1, weight: 0.3 }], outcomes: { success: 'You decode payments signed by E.Q.', partial: 'You decode initials and date blocks.', fail: 'Code resists, but date links to theft night.' } },
      ] },
      { index: 5, title: 'Final confrontation', narrative: 'Confront suspect and prove motive.', checks: [{ attribute: 'Charisma', min: 1 }], choices: [
        { id: 'm5-direct', label: 'Corner Elias with physical pressure (direct)', checks: [{ attribute: 'Physique', min: 1, weight: 0.55 }, { attribute: 'Charisma', min: 1, weight: 0.45 }], outcomes: { success: 'Elias confesses under pressure.', partial: 'He cracks partially; motive confirmed.', fail: 'He stalls, but evidence still links him.' } },
        { id: 'm5-social', label: 'Cross-examine Elias publicly (social/intellectual)', checks: [{ attribute: 'Wisdom', min: 1, weight: 0.5 }, { attribute: 'Sociability', min: 1, weight: 0.5 }], outcomes: { success: 'Your timeline trap forces a full confession.', partial: 'Crowd pressure wins a partial admission.', fail: 'He deflects, but forged badge ties back to him.' } },
      ] },
    ],
  };

  await prisma.adventure.upsert({ where: { id: 1 }, update: { chapter: 1, title: 'The Sapphire at Dawnmarket', requirementsJson: JSON.stringify(chapter1Requirements), branchesJson: JSON.stringify(chapter1Branches), difficulty: 1 }, create: { id: 1, chapter: 1, title: 'The Sapphire at Dawnmarket', requirementsJson: JSON.stringify(chapter1Requirements), branchesJson: JSON.stringify(chapter1Branches), difficulty: 1 } });

  const chapter2Requirements = { unlock: { chapterComplete: 1 }, recommended: ['Wisdom 1', 'Sociability 1'] };
  const chapter2Branches = {
    intro: 'After exposing Elias, you investigate his financier known only as The Broker.',
    finalReveal: 'To be continued in next phase.',
    milestones: [
      { index: 1, title: 'Prologue unlocked', narrative: 'Chapter 2 is now unlocked. Full content arrives in next phase.', checks: [], choices: [
        { id: 'c2-hold', label: 'Review caseboard notes', checks: [{ attribute: 'Wisdom', min: 0, weight: 1 }], outcomes: { success: 'You prepare for the next investigation.', partial: 'You organize partial notes.', fail: 'You postpone review.' } },
      ] },
    ],
  };

  await prisma.adventure.upsert({ where: { id: 2 }, update: { chapter: 2, title: 'The Broker in the Fog', requirementsJson: JSON.stringify(chapter2Requirements), branchesJson: JSON.stringify(chapter2Branches), difficulty: 2 }, create: { id: 2, chapter: 2, title: 'The Broker in the Fog', requirementsJson: JSON.stringify(chapter2Requirements), branchesJson: JSON.stringify(chapter2Branches), difficulty: 2 } });

  const hints = [
    { adventureId: 1, hintType: 'light', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Paper', count: 1, milestone: 1, bonus: 0.05 }), scope: 'Check mud depth against wagon wheel marks.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'medium', priceJson: JSON.stringify({ attribute: 'Sociability', tier: 'Paper', count: 1, milestone: 2, bonus: 0.08 }), scope: 'Ask vendors who saw the fake inspector after dawn.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'strong', priceJson: JSON.stringify({ attribute: 'Charisma', tier: 'Rock', count: 1, milestone: 4, bonus: 0.12 }), scope: 'Ledger code repeats every third transaction.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'light', priceJson: JSON.stringify({ attribute: 'Survival', tier: 'Paper', count: 1, milestone: 5, bonus: 0.05 }), scope: 'Courier boots match tavern cellar dust.', difficultyBand: 1 },
  ] as const;

  for (const [i, hint] of hints.entries()) await prisma.hintStore.upsert({ where: { id: i + 1 }, update: hint, create: { id: i + 1, ...hint } });

  await prisma.adventureProgress.upsert({ where: { adventureId: 1 }, update: { status: 'UNLOCKED', bestOutcome: null }, create: { adventureId: 1, status: 'UNLOCKED' } });
  await prisma.adventureProgress.upsert({ where: { adventureId: 2 }, update: { status: 'LOCKED', bestOutcome: null }, create: { adventureId: 2, status: 'LOCKED' } });
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
