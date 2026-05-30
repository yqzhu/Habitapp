import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const attributes = ['Physique', 'Charisma', 'Wisdom', 'Sociability', 'Wealth', 'Survival'];
const CARD_TIERS = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'];

async function main() {
  await prisma.hero.upsert({ where: { role: 'HERO' }, update: {}, create: { name: 'Hero', role: 'HERO' } });
  await prisma.hero.upsert({ where: { role: 'BUDDY' }, update: {}, create: { name: 'Buddy', role: 'BUDDY' } });

  for (const label of attributes) {
    await prisma.attribute.upsert({ where: { key: label.toLowerCase() }, update: { label }, create: { key: label.toLowerCase(), label } });
    for (const tier of CARD_TIERS) {
      await prisma.cardsInventory.upsert({ where: { attribute_tier: { attribute: label, tier } }, update: {}, create: { attribute: label, tier, count: 0 } });
    }
  }

  const chapter1Requirements = {
    unlock: { minAnyStatLevel: 0 },
    recommended: [
      'All Chapter 1 milestones are attemptable by beginners; stats and hints improve odds instead of hard-blocking progress.',
      'Designed so active users earning 3-4 Rock cards per day can buy a few optional hints and close the case in roughly 2-3 weeks.',
    ],
  };

  // TODO(PR6): Extract adventure chapters into dedicated content files with validation so copy, checks, and hint ladders are easier to review safely.
  const chapter1Branches = {
    intro: 'Dawnmarket wakes to a scandal: the famed blue sapphire has vanished from Bellwether Jewellers while the morning bell was still ringing. The smashed window looks dramatic, but the mud in the alley, a scrap of pale-blue thread, and a witness who swears a city inspector entered before sunrise all suggest a quieter hand behind the crime.',
    finalReveal: 'Final reveal: Elias Quill, accountant of the Brass Finch, arranged the theft before dawn to cover gambling debts hidden in his ledgers. He forged an inspector badge to enter the shop, paid Mara Voss to carry a sealed parcel toward the docks, then staged the broken window after the market bell to make the crime look like a rushed street robbery. The blue thread fixed the timing, the cellar dust separated the courier from the mastermind, and the coded payments proved Elias planned the theft days before the sapphire vanished.',
    milestones: [
      {
        index: 1,
        title: 'The Bellwether Window',
        narrative: 'Bellwether Jewellers smells of lamp oil, wet stone, and panic. A display case lies open beneath a neatly broken window, yet the glass has fallen mostly outward into the alley. On the sill you notice dock mud, a pale-blue thread snagged on brass, and scrape marks too deliberate for a hurried thief. Your first job is to decide whether the thief fled through the alley or only wanted everyone to think so.',
        checks: [],
        choices: [
          {
            id: 'm1-direct',
            label: 'Track the alley mud and window scrape marks',
            checks: [{ attribute: 'Survival', min: 0, weight: 0.6 }, { attribute: 'Physique', min: 0, weight: 0.4 }],
            outcomes: {
              success: 'You follow two kinds of residue: heavy dock mud outside and finer tavern-cellar dust just inside the sill. The clean separation tells you the window was staged after the sapphire had already left the room. A chipped brick shows where someone braced a boot while breaking the pane from the alley side, long after the display case was opened. That makes the trail to the Brass Finch route a question of who arranged the false escape, not who grabbed the gem in a panic.',
              partial: 'Rain chews up the footprints, but you preserve a deep heel print and a smear of cellar dust beneath the sill. The evidence does not name a culprit yet. It does prove the alley scene was arranged rather than improvised. Because the cellar dust sits inside the shop while dock mud waits outside, the next sensible step is to ask who could enter before the window drama began.',
              fail: 'A fish cart splashes through the lane before you can cast the tracks. The best footprints dissolve into brown water, so the physical trail cannot carry the case by itself. Even so, the outward-fallen glass and untouched indoor dust contradict the shopkeeper’s “fleeing burglar” story. That failure still narrows your work: you need witnesses who saw who entered before dawn, before someone staged the alley.',
            },
          },
          {
            id: 'm1-social',
            label: 'Canvass vendors about the pre-dawn inspector',
            checks: [{ attribute: 'Sociability', min: 0, weight: 0.5 }, { attribute: 'Wisdom', min: 0, weight: 0.5 }],
            outcomes: {
              success: 'The flower seller remembers a polite “inspector” with a pale-blue cuff stepping inside before the bell, not after it. She even recalls him tipping his hat to avoid showing his face beneath the awning. Her timing places the suspect in the shop while the sapphire was still locked away. That turns the broken window into a false ending and gives you a precise alibi to test at the Brass Finch.',
              partial: 'The vendors argue over the man’s face, but they agree on the bell. The inspector entered before sunrise, and no one heard breaking glass until later. You cannot identify him yet, but the sequence is too strange to ignore. The contradiction gives you a lead worth testing against tavern alibis and anyone seen changing coats after the rain began.',
              fail: 'The market crowd closes ranks, wary of blame. Your questions sound too official, and several vendors suddenly remember urgent errands. Still, a pie boy blurts out that the inspector smelled of spilled ale and coal smoke. That rough clue is enough to send your attention from the jeweller’s counter to the Brass Finch tavern district.',
            },
          },
        ],
      },
      {
        index: 2,
        title: 'The Porter and the Bell',
        narrative: 'By midmorning, rumor names Mara Voss, a dock porter with boots that match the alley heel, and Elias Quill, the Brass Finch accountant whose books were due for inspection. Mara was seen near the shop after the bell; Elias claims he never left his counting room. The case now turns on movement and timing: who carried something, and who knew what needed carrying?',
        checks: [],
        choices: [
          {
            id: 'm2-direct',
            label: 'Tail Mara Voss along the dock route',
            checks: [{ attribute: 'Physique', min: 0, weight: 0.55 }, { attribute: 'Survival', min: 0, weight: 0.45 }],
            outcomes: {
              success: 'You keep Mara in sight through fish smoke and rope yards until she doubles back to the Brass Finch cellar door. Her route notes mention a sealed blue packet. The pickup time is before the window broke, which matters more than the boot print. Mara now looks like a courier hired for a timed handoff, not the mind that invented the staged burglary.',
              partial: 'Mara spots your shadow and vanishes into the wharf crowd. She moves too quickly for a clean tail, but a waxy scrap falls from her route book. The scrap carries the Brass Finch cellar seal and a smudged hour mark. That evidence ties the physical trail to the tavern and suggests someone gave Mara instructions before the market ever woke.',
              fail: 'You lose Mara when a dray horse blocks the lane. The chase fails as surveillance, and she disappears before you can see what she carries. It still pays off when two dockhands complain she was nervous because “the bookman changed the hour.” That phrase changes the shape of the suspect list. The accountant’s timeline becomes more important than her boots, and Mara stays in the case as a witness rather than the central villain.',
            },
          },
          {
            id: 'm2-social',
            label: 'Reconcile witness statements against the market bell',
            checks: [{ attribute: 'Wisdom', min: 0, weight: 0.6 }, { attribute: 'Charisma', min: 0, weight: 0.4 }],
            outcomes: {
              success: 'You line up the bellringer, flower seller, and jeweller’s apprentice until the contradiction sharpens. Elias was seen returning to the Brass Finch with a dry coat minutes before rain began. The supposed burglar appeared later in wet dock gear, which means those sightings cannot describe the same person. The timeline now points at a planner indoors before dawn and a courier outdoors afterward.',
              partial: 'The witnesses cannot agree on faces, but your calm questioning fixes the order of events. First came the inspector. Then came the sealed parcel, and only after that did anyone hear breaking glass. The theft began indoors before Mara ever crossed the alley, so your next lead is whoever could control the tavern route and its records.',
              fail: 'Your timeline board fills with crossed-out claims and irritated witnesses. The social approach stumbles because everyone fears being named as an accomplice. One useful detail survives: a pale-blue cuff appears in two separate accounts. Elias owns the tavern’s only blue audit jacket, so even a messy interview points you back to the Brass Finch.',
            },
          },
        ],
      },
      {
        index: 3,
        title: 'Back Room of the Brass Finch',
        narrative: 'The Brass Finch is crowded, smoky, and suddenly very quiet when you ask about the morning. Behind the bar, a locked counting room shares a wall with the cellar stairs. Somewhere between the taproom gossip and Elias Quill’s ledgers lies the bridge between the fake inspector, Mara’s route, and the sapphire’s sealed packet.',
        checks: [],
        choices: [
          {
            id: 'm3-direct',
            label: 'Press the night guard for counting-room access',
            checks: [{ attribute: 'Physique', min: 0, weight: 0.6 }, { attribute: 'Charisma', min: 0, weight: 0.4 }],
            outcomes: {
              success: 'The guard folds when you describe the staged window and the cellar seal. He unlocks the counting room, but only after making you promise not to name him to Elias. Inside, fresh scratches ring the accountant’s cashbox, and a smear of the same fine dust from the jeweller’s sill marks the desk leg. The room becomes the bridge between shop, cellar, and ledger, so the investigation can finally follow money instead of rumor.',
              partial: 'The guard refuses to surrender the key. He is frightened of Elias and more frightened of losing his job. Under pressure, he admits Elias ordered him away from the back stair during the bell. That gap explains how a parcel could leave through the cellar without the taproom seeing it, and it makes the watch schedule a piece of evidence.',
              fail: 'Your pressure makes the guard defensive, and he bars the door before you can enter. The tactic fails to win cooperation, but the argument draws his hand toward the schedule slate. You spot that Elias changed the watch rotation last night. That change created the exact blind spot Mara used, giving you a procedural clue even without access to the room.',
            },
          },
          {
            id: 'm3-social',
            label: 'Earn the barmaid’s trust over coded tabs',
            checks: [{ attribute: 'Sociability', min: 0, weight: 0.5 }, { attribute: 'Charisma', min: 0, weight: 0.5 }],
            outcomes: {
              success: 'The barmaid slides you a page of “special tabs” Elias told staff never to settle aloud. Three entries use blue ink and match Mara’s initials. Their dates fall before the theft, which destroys the idea of an opportunistic robbery. The page proves the courier was hired in advance and tells you the ledger code is where Elias hid the plan.',
              partial: 'She will not hand over the page. Trust gets you only halfway because the staff still fear Elias’s retaliation. She does whisper the pattern: blue marks for dock runners, black marks for ordinary debts. That color code gives you a way to read Elias’s ledger if you can reach it before he destroys the receipts.',
              fail: 'She keeps her distance until you stop accusing the staff. The conversation starts poorly, and no one wants to be seen helping you. As you leave, she warns that Elias burns spoiled receipts in the cellar stove every Thursday. That makes his records urgent evidence rather than tavern gossip, and it tells you why the next move must happen quickly.',
            },
          },
        ],
      },
      {
        index: 4,
        title: 'The Ledger Under Blue Ink',
        narrative: 'Elias’s records are not a confession at first glance. They are columns of ale, coal, linen, and false arithmetic, with blue dots where coin should be. A locked chest holds older slips; the open ledger hides newer ones in code. To prove planning instead of coincidence, you need the payment trail behind Mara’s sealed packet.',
        checks: [],
        choices: [
          {
            id: 'm4-direct',
            label: 'Open the records chest before the receipts burn',
            checks: [{ attribute: 'Physique', min: 0, weight: 0.55 }, { attribute: 'Survival', min: 0, weight: 0.45 }],
            outcomes: {
              success: 'You spring the chest without scattering the slips. Inside are payments to “M.V.” for a blue parcel, a copied inspector badge sketch, and a debt notice from a card room dated three days before the theft. The chest proves planning, disguise, and motive in one place. It also clarifies Mara’s role: she moved the parcel, while Elias bought the means and needed the money.',
              partial: 'The chest hinge splits and several receipts tear. You lose names and totals in the damage, but one line survives: “M.V. — blue packet — before bell.” That fragment proves Mara was paid for timing rather than impulse. The scorched debt notice beside it points to Elias’s motive and gives you enough leverage for a confrontation.',
              fail: 'The lock resists until smoke curls from the cellar stove. You arrive too late to save the full packet of receipts. You save only the chest seal and one charred corner, but both bear Elias’s private accounting mark. That failure weakens the paper trail, yet it ties the destroyed records to his office rather than Mara’s hands.',
            },
          },
          {
            id: 'm4-intel',
            label: 'Decode the blue-ink ledger entries',
            checks: [{ attribute: 'Wisdom', min: 0, weight: 0.7 }, { attribute: 'Wealth', min: 0, weight: 0.3 }],
            outcomes: {
              success: 'You notice every third blue dot subtracts from ale profits and reappears under “linen.” The converted sums equal Mara’s fee, the fake badge cost, and Elias’s gambling debt. The code turns ordinary tavern bookkeeping into a rehearsal for the crime. The dates line up before the market bell ever rang. Most importantly, they prove the theft was budgeted before it was performed.',
              partial: 'The code does not fully open, but the dates do. Blue entries begin three days before the sapphire vanished and stop on the morning bell. You cannot yet translate every amount, but chronology is its own confession. It gives you enough structure to confront Elias on planning rather than merely accusing him of profiting afterward.',
              fail: 'The arithmetic blurs into tavern nonsense. The ledger resists interpretation, and the blue dots seem decorative at first. Then the missing totals reveal the trick by absence: someone removed exactly the value of a courier fee. Only Elias controlled the ledger at dawn, so even the failed decoding attempt leaves him isolated as the person with access.',
            },
          },
        ],
      },
      {
        index: 5,
        title: 'A Confession by the Morning Bell',
        narrative: 'You gather Elias, Mara, the jeweller, and half of Dawnmarket beneath the tavern clock. Elias still has a tidy alibi and a cleaner coat than any innocent accountant should need. The final move is not merely to accuse him, but to bind thread, mud, witness timing, and blue-ink debts into a story he cannot escape.',
        checks: [],
        choices: [
          {
            id: 'm5-direct',
            label: 'Corner Elias with the chest seal and courier route',
            checks: [{ attribute: 'Physique', min: 0, weight: 0.5 }, { attribute: 'Charisma', min: 0, weight: 0.5 }],
            outcomes: {
              success: 'You block Elias at the cellar stair and lay out the seal, route note, and debt notice. Mara, seeing the mastermind exposed, admits she carried a sealed packet before the bell. The crowd understands the window was theater because the sapphire was already gone when the glass broke. Elias breaks when his tidy alibi becomes proof that he had time to plan, pay, and stage every piece.',
              partial: 'Elias denies theft but flinches when you name the changed watch rotation. Mara confirms the blue packet, and the jeweller identifies the fake badge sketch. The confrontation does not produce a full confession, but it strips away his cleanest denials. The crowd sees that each clue comes from a different source. Elias is left with motive, means, and control of the route even before he says the word “sapphire.”',
              fail: 'Elias keeps his voice steady and calls you theatrical. The direct pressure fails to rattle him in public. The physical chain still holds: his seal, his schedule change, and his debt notice place him behind Mara’s courier run. That evidence is strong enough to force the magistrate to seize his ledger, even without a dramatic confession.',
            },
          },
          {
            id: 'm5-social',
            label: 'Cross-examine the timeline in front of Dawnmarket',
            checks: [{ attribute: 'Wisdom', min: 0, weight: 0.55 }, { attribute: 'Sociability', min: 0, weight: 0.45 }],
            outcomes: {
              success: 'You ask each witness for one fact only: bell, coat, parcel, window. The answers lock together in public, and no single witness has to carry the whole accusation. Elias’s alibi collapses between the pre-dawn inspector and the later staged glass. He confesses to hiring Mara and hiding the sapphire to cover his debts because the timeline leaves him nowhere else to stand.',
              partial: 'The crowd grows restless, but your sequence lands. Inspector before bell, courier before glass, ledger before crime. Elias refuses a full confession, yet his silence when Mara names the blue packet becomes louder than denial. The magistrate has all the probable cause needed because the social testimony and the ledger chronology now support each other.',
              fail: 'Elias tries to drown the room in objections. The cross-examination loses its rhythm, and the crowd never gets the clean confession you hoped for. You lose the dramatic moment, but not the case. The witnesses now understand the timeline contradiction, and the blue-ink ledger explains why Elias, not Mara, needed the sapphire gone.',
            },
          },
        ],
      },
    ],
  };

  await prisma.adventure.upsert({
    where: { id: 1 },
    update: {
      chapter: 1,
      title: 'The Sapphire at Dawnmarket',
      requirementsJson: JSON.stringify(chapter1Requirements),
      branchesJson: JSON.stringify(chapter1Branches),
      difficulty: 1,
    },
    create: {
      id: 1,
      chapter: 1,
      title: 'The Sapphire at Dawnmarket',
      requirementsJson: JSON.stringify(chapter1Requirements),
      branchesJson: JSON.stringify(chapter1Branches),
      difficulty: 1,
    },
  });

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
    { adventureId: 1, hintType: 'light', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Paper', count: 1, milestone: 1, bonus: 0.04 }), scope: 'Start with the window, not the missing gem. Glass falling outward means the dramatic escape may have been staged after the theft. If the escape is fake, the first real question is who entered the shop before anyone heard the pane break.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'medium', priceJson: JSON.stringify({ attribute: 'Survival', tier: 'Paper', count: 2, milestone: 1, bonus: 0.07 }), scope: 'Compare the dock mud outside with the cleaner dust inside the sill. Two residues suggest two moments, not one frantic exit. The mixed traces make Survival useful because you are reading sequence, not simply chasing footprints.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'strong', priceJson: JSON.stringify({ attribute: 'Sociability', tier: 'Rock', count: 1, milestone: 1, bonus: 0.11 }), scope: 'If tracking feels uncertain, canvass the vendors. The pre-dawn inspector sighting gives the clearest timeline contradiction for milestone 1. A social approach is safer when physical traces are being ruined by rain and market traffic.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'light', priceJson: JSON.stringify({ attribute: 'Sociability', tier: 'Paper', count: 1, milestone: 2, bonus: 0.04 }), scope: 'Mara’s boots matter, but timing matters more. Ask whether she moved before or after the bell before deciding she planned the theft. A courier can leave tracks without being the person who designed the crime.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'medium', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Paper', count: 2, milestone: 2, bonus: 0.07 }), scope: 'Put each witness on the bell timeline. The false inspector appears before the broken glass, while Mara appears after it. That order turns the investigation away from a simple chase and toward whoever controlled the plan in advance.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'strong', priceJson: JSON.stringify({ attribute: 'Charisma', tier: 'Rock', count: 1, milestone: 2, bonus: 0.11 }), scope: 'The safer play is reconstructing statements, not accusing Mara outright. The contradiction around Elias’s dry coat points toward the planner. Use Charisma to keep witnesses talking long enough for Wisdom to expose the timing problem.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'light', priceJson: JSON.stringify({ attribute: 'Charisma', tier: 'Paper', count: 1, milestone: 3, bonus: 0.04 }), scope: 'The Brass Finch staff are afraid of being blamed. A controlled tone can reveal more than broad accusations. If they believe you are separating accomplices from witnesses, they are more likely to discuss Elias’s routines.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'medium', priceJson: JSON.stringify({ attribute: 'Sociability', tier: 'Paper', count: 2, milestone: 3, bonus: 0.07 }), scope: 'Blue marks on tavern tabs are not decoration. They separate dock-runner payments from ordinary ale debts. Follow those marks and the tavern stops being a backdrop; it becomes the payment hub for the theft.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'strong', priceJson: JSON.stringify({ attribute: 'Physique', tier: 'Rock', count: 1, milestone: 3, bonus: 0.11 }), scope: 'If you choose pressure, focus on the changed watch rotation and cellar door access. The guard can confirm Elias created the blind spot. Do not waste the confrontation on general threats; the useful answer is who ordered him away from the stair.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'light', priceJson: JSON.stringify({ attribute: 'Wealth', tier: 'Paper', count: 1, milestone: 4, bonus: 0.04 }), scope: 'The ledger discrepancy points to access and planning, not simple greed. Watch where blue-ink expenses are reclassified. Wealth helps here as resource literacy: you are noticing how payments are hidden, not buying the solution.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'medium', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Paper', count: 2, milestone: 4, bonus: 0.07 }), scope: 'Every third blue mark shifts money from tavern income to harmless-looking linen. Those dates begin before the sapphire disappears. The date pattern is the clue that proves premeditation, even if the totals remain partly coded.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'strong', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Rock', count: 1, milestone: 4, bonus: 0.11 }), scope: 'Decoding the ledger is the cleanest route if you have Wisdom. Forcing the chest can work, but the code more directly proves premeditation. Choose the ledger when you want to show Elias planned the theft before Mara ever carried the parcel.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'light', priceJson: JSON.stringify({ attribute: 'Charisma', tier: 'Paper', count: 1, milestone: 5, bonus: 0.04 }), scope: 'Do not open with “Mara stole it.” She carried the parcel; Elias needed the theft to hide his debt. The final accusation should distinguish the courier from the mastermind. If you blur those roles, Elias can redirect blame onto her boots.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'medium', priceJson: JSON.stringify({ attribute: 'Wisdom', tier: 'Paper', count: 2, milestone: 5, bonus: 0.07 }), scope: 'Your closing argument should chain four facts. Inspector before bell, courier before glass, ledger before crime, debt before motive. This order makes the reveal feel earned because each prior milestone supplies one link.', difficultyBand: 1 },
    { adventureId: 1, hintType: 'strong', priceJson: JSON.stringify({ attribute: 'Sociability', tier: 'Rock', count: 1, milestone: 5, bonus: 0.11 }), scope: 'Public cross-examination is safest when your clue chain is strong. Let each witness supply one piece so Elias cannot dismiss it as your theory alone. Sociability matters because the crowd becomes a caseboard, not just an audience.', difficultyBand: 1 },
  ] as const;

  for (const [i, hint] of hints.entries()) await prisma.hintStore.upsert({ where: { id: i + 1 }, update: hint, create: { id: i + 1, ...hint } });

  await prisma.adventureProgress.upsert({ where: { adventureId: 1 }, update: { status: 'UNLOCKED', bestOutcome: null }, create: { adventureId: 1, status: 'UNLOCKED' } });
  await prisma.adventureProgress.upsert({ where: { adventureId: 2 }, update: { status: 'LOCKED', bestOutcome: null }, create: { adventureId: 2, status: 'LOCKED' } });
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
