import cors from 'cors';
import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 3001);

const CANONICAL_ATTRIBUTES = ['Physique', 'Charisma', 'Wisdom', 'Sociability', 'Farming', 'Wealth', 'Survival'] as const;
const CANONICAL_TIERS = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'] as const;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function atMidnight(date: Date): Date {
  const out = new Date(date);
  out.setHours(0, 0, 0, 0);
  return out;
}

function parseLocalDate(input?: string): Date {
  if (!input) return atMidnight(new Date());
  const [y, m, d] = input.split('-').map(Number);
  if (!y || !m || !d) return atMidnight(new Date(input));
  return atMidnight(new Date(y, m - 1, d));
}

function normalizeCadenceRule(input: string): string {
  const raw = input.trim();
  const lower = raw.toLowerCase();
  if (lower === 'daily') return 'daily';
  const everyNDayMatch = lower.match(/^every\s+(\d+)\s+day(?:s)?$/);
  if (everyNDayMatch) {
    const n = Number(everyNDayMatch[1]);
    if (n >= 1 && n <= 30) return n === 1 ? 'daily' : `every_${n}_day`;
  }
  const weekdayMap: Record<string, string> = {
    mon: 'Mon', monday: 'Mon', tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
    wed: 'Wed', weds: 'Wed', wednesday: 'Wed', thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu',
    fri: 'Fri', friday: 'Fri', sat: 'Sat', saturday: 'Sat', sun: 'Sun', sunday: 'Sun',
  };
  if (lower.startsWith('every ')) {
    const tokens = lower.slice(6).split(',').map((t) => t.trim()).filter(Boolean);
    const days = Array.from(new Set(tokens.map((t) => weekdayMap[t]).filter(Boolean)));
    if (days.length > 0 && days.length === tokens.length) return `weekdays:${days.join(',')}`;
  }
  return raw;
}

function isSupportedCadenceRule(cadenceRule: string): boolean {
  if (cadenceRule === 'daily') return true;
  const everyNDayMatch = cadenceRule.match(/^every_(\d+)_day$/);
  if (everyNDayMatch) return Number(everyNDayMatch[1]) >= 2 && Number(everyNDayMatch[1]) <= 30;
  if (cadenceRule.startsWith('weekdays:')) {
    const days = cadenceRule.replace('weekdays:', '').split(',').map((d) => d.trim()).filter(Boolean);
    return days.length > 0 && days.every((d) => WEEKDAYS.includes(d as typeof WEEKDAYS[number]));
  }
  return false;
}

function cadenceMatchesDate(cadenceRule: string, date: Date, anchorDate: Date): boolean {
  if (cadenceRule === 'daily') return true;
  const everyNDayMatch = cadenceRule.match(/^every_(\d+)_day$/);
  if (everyNDayMatch) {
    const n = Number(everyNDayMatch[1]);
    const diff = Math.floor((date.getTime() - anchorDate.getTime()) / 86400000);
    return diff >= 0 && diff % n === 0;
  }
  if (cadenceRule.startsWith('weekdays:')) {
    const set = new Set(cadenceRule.replace('weekdays:', '').split(',').map((d) => d.trim()));
    return set.has(WEEKDAYS[date.getDay()]);
  }
  return false;
}

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, app: 'Hero Habit Forge API' }));
app.get('/api/bootstrap', (_req, res) => res.json({ appName: 'Hero Habit Forge', phase: 'Cards + Forge', next: 'Hero/Buddy stats' }));
app.get('/api/task-templates', async (_req, res) => res.json(await prisma.taskTemplate.findMany({ orderBy: { id: 'asc' } })));

app.post('/api/task-templates', async (req, res) => {
  const { title, cadenceRule, attribute, baseTier, startDate } = req.body;
  if (!title || !cadenceRule || !attribute || !baseTier) return res.status(400).json({ error: 'title, cadenceRule, attribute, and baseTier are required' });
  if (!CANONICAL_ATTRIBUTES.includes(attribute) || !CANONICAL_TIERS.includes(baseTier)) return res.status(400).json({ error: 'attribute or baseTier is invalid' });
  const normalizedCadenceRule = normalizeCadenceRule(cadenceRule);
  if (!isSupportedCadenceRule(normalizedCadenceRule)) return res.status(400).json({ error: 'Unsupported cadence. Use: daily, every n day (n=1..30), or every Mon[, Tue, ...]' });

  const anchorDate = parseLocalDate(startDate);
  const template = await prisma.taskTemplate.create({ data: { title, cadenceRule: normalizedCadenceRule, attribute, baseTier, isActive: true } });
  if (cadenceMatchesDate(normalizedCadenceRule, anchorDate, anchorDate)) {
    await prisma.taskInstance.create({ data: { templateId: template.id, scheduledDate: anchorDate, status: 'ACTIVE', mergedGroupKey: `template-${template.id}` } });
  }
  return res.status(201).json(template);
});

app.patch('/api/task-templates/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid template id' });
  const { title, cadenceRule, attribute, baseTier, isActive } = req.body;
  if (attribute && !CANONICAL_ATTRIBUTES.includes(attribute)) return res.status(400).json({ error: 'attribute is invalid' });
  if (baseTier && !CANONICAL_TIERS.includes(baseTier)) return res.status(400).json({ error: 'baseTier is invalid' });
  const normalizedCadenceRule = cadenceRule ? normalizeCadenceRule(cadenceRule) : undefined;
  if (normalizedCadenceRule && !isSupportedCadenceRule(normalizedCadenceRule)) return res.status(400).json({ error: 'Unsupported cadence. Use: daily, every n day (n=1..30), or every Mon[, Tue, ...]' });
  res.json(await prisma.taskTemplate.update({ where: { id }, data: { title, cadenceRule: normalizedCadenceRule, attribute, baseTier, isActive } }));
});

app.delete('/api/task-templates/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid template id' });
  await prisma.taskInstance.deleteMany({ where: { templateId: id } });
  await prisma.taskTemplate.delete({ where: { id } });
  res.json({ success: true });
});

app.get('/api/today-board', async (req, res) => {
  const boardDate = parseLocalDate(typeof req.query.date === 'string' ? req.query.date : undefined);

  const activeTemplates = await prisma.taskTemplate.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
  for (const template of activeTemplates) {
    const earliest = await prisma.taskInstance.findFirst({ where: { templateId: template.id }, orderBy: { scheduledDate: 'asc' } });
    const anchorDate = earliest ? atMidnight(earliest.scheduledDate) : boardDate;
    const existsOnDate = await prisma.taskInstance.findFirst({ where: { templateId: template.id, scheduledDate: boardDate } });
    if (!existsOnDate && boardDate >= anchorDate && cadenceMatchesDate(template.cadenceRule, boardDate, anchorDate)) {
      await prisma.taskInstance.create({ data: { templateId: template.id, scheduledDate: boardDate, status: 'ACTIVE', mergedGroupKey: `template-${template.id}` } });
    }
  }

  const allActive = await prisma.taskInstance.findMany({ where: { status: 'ACTIVE', scheduledDate: { lte: boardDate } }, orderBy: [{ scheduledDate: 'asc' }, { id: 'asc' }] });
  const templateIds = [...new Set(allActive.map((task: { templateId: number | null }) => task.templateId).filter((id: number | null): id is number => id !== null))];
  const templates = await prisma.taskTemplate.findMany({ where: { id: { in: templateIds } } });
  const templateMap = new Map(templates.map((t: { id: number }) => [t.id, t]));
  res.json({ boardDate: boardDate.toISOString().slice(0, 10), tasks: allActive.map((task: { templateId: number | null }) => ({ ...task, template: task.templateId ? templateMap.get(task.templateId) ?? null : null })) });
});

app.post('/api/today-board/one-off', async (req, res) => {
  const { title, attribute, baseTier, date } = req.body;
  if (!title || !attribute || !baseTier) return res.status(400).json({ error: 'title, attribute, and baseTier are required' });
  if (!CANONICAL_ATTRIBUTES.includes(attribute) || !CANONICAL_TIERS.includes(baseTier)) return res.status(400).json({ error: 'attribute or baseTier is invalid' });
  const scheduledDate = parseLocalDate(date);
  const oneOffTemplate = await prisma.taskTemplate.create({ data: { title, cadenceRule: 'one-off', attribute, baseTier, isActive: false } });
  const task = await prisma.taskInstance.create({ data: { templateId: oneOffTemplate.id, scheduledDate, status: 'ACTIVE', mergedGroupKey: `oneoff-${oneOffTemplate.id}` } });
  return res.status(201).json({ ...task, template: oneOffTemplate });
});


app.patch('/api/today-board/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
  const task = await prisma.taskInstance.findUnique({ where: { id } });
  if (!task || task.status !== 'ACTIVE') return res.status(404).json({ error: 'Active task not found' });
  const updated = await prisma.taskInstance.update({ where: { id }, data: { status: 'CANCELLED' } });
  res.json({ success: true, task: updated });
});

app.patch('/api/today-board/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id) || req.body.status !== 'DONE') return res.status(400).json({ error: 'Only marking task DONE is supported' });
  const task = await prisma.taskInstance.findUnique({ where: { id } });
  if (!task || task.status !== 'ACTIVE' || task.templateId === null) return res.status(404).json({ error: 'Active task not found' });
  const template = await prisma.taskTemplate.findUnique({ where: { id: task.templateId } });
  if (!template) return res.status(404).json({ error: 'Template not found' });
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.taskInstance.update({ where: { id }, data: { status: 'DONE' } });
    await tx.cardsInventory.upsert({ where: { attribute_tier: { attribute: template.attribute, tier: template.baseTier } }, create: { attribute: template.attribute, tier: template.baseTier, count: 1 }, update: { count: { increment: 1 } } });
  });
  res.json({ success: true, awardedCard: { attribute: template.attribute, tier: template.baseTier } });
});

app.get('/api/cards/inventory', async (_req, res) => {
  const cards = await prisma.cardsInventory.findMany({ orderBy: [{ attribute: 'asc' }, { tier: 'asc' }] });
  const grouped = CANONICAL_ATTRIBUTES.map((attribute) => ({ attribute, tiers: CANONICAL_TIERS.map((tier) => ({ tier, count: cards.find((c: { attribute: string; tier: string; count: number }) => c.attribute === attribute && c.tier === tier)?.count ?? 0 })) }));
  res.json({ inventory: grouped, tiers: CANONICAL_TIERS });
});

app.post('/api/cards/forge', async (req, res) => {
  const { attribute, tier } = req.body;
  if (!CANONICAL_ATTRIBUTES.includes(attribute) || !CANONICAL_TIERS.includes(tier)) return res.status(400).json({ error: 'attribute or tier is invalid' });
  const i = CANONICAL_TIERS.indexOf(tier);
  if (i === CANONICAL_TIERS.length - 1) return res.status(400).json({ error: 'Gold cards cannot be merged further' });
  const nextTier = CANONICAL_TIERS[i + 1];
  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.cardsInventory.findUnique({ where: { attribute_tier: { attribute, tier } } });
      const count = current?.count ?? 0;
      if (count < 3) throw new Error(`Not enough cards to merge: ${attribute} ${tier} has ${count}, needs 3`);
      await tx.cardsInventory.upsert({ where: { attribute_tier: { attribute, tier } }, create: { attribute, tier, count: count - 3 }, update: { count: count - 3 } });
      await tx.cardsInventory.upsert({ where: { attribute_tier: { attribute, tier: nextTier } }, create: { attribute, tier: nextTier, count: 1 }, update: { count: { increment: 1 } } });
      return { attribute, consumedTier: tier, producedTier: nextTier };
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Merge failed' });
  }
});

app.get('/api/stats', async (_req, res) => {
  const heroes = await prisma.hero.findMany({
    where: { role: { in: ['HERO', 'BUDDY'] } },
    include: { stats: { include: { attribute: true }, orderBy: { attribute: { label: 'asc' } } } },
    orderBy: { id: 'asc' },
  });

  const payload = heroes.map((hero: { id: number; role: string; name: string; stats: { level: number; progressGold: number; attribute: { label: string } }[] }) => ({
    id: hero.id,
    role: hero.role,
    name: hero.name,
    stats: CANONICAL_ATTRIBUTES.map((attributeLabel) => {
      const stat = hero.stats.find((s: { level: number; progressGold: number; attribute: { label: string } }) => s.attribute.label === attributeLabel);
      const level = stat?.level ?? 0;
      return {
        attribute: attributeLabel,
        level,
        progressGold: stat?.progressGold ?? 0,
        neededGold: 3 + level,
      };
    }),
  }));

  res.json({ characters: payload });
});

app.post('/api/stats/invest', async (req, res) => {
  const { role, attribute } = req.body;
  if (!['HERO', 'BUDDY'].includes(role)) return res.status(400).json({ error: 'role must be HERO or BUDDY' });
  if (!CANONICAL_ATTRIBUTES.includes(attribute)) return res.status(400).json({ error: `attribute must be one of: ${CANONICAL_ATTRIBUTES.join(', ')}` });

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const gold = await tx.cardsInventory.findUnique({ where: { attribute_tier: { attribute, tier: 'Gold' } } });
      const goldCount = gold?.count ?? 0;
      if (goldCount < 1) {
        throw new Error(`Not enough Gold cards for ${attribute}. Current count: ${goldCount}`);
      }

      const hero = await tx.hero.findUnique({ where: { role } });
      if (!hero) throw new Error(`${role} character not found`);
      const dbAttribute = await tx.attribute.findFirst({ where: { label: attribute } });
      if (!dbAttribute) throw new Error(`Attribute '${attribute}' not found`);

      const current = await tx.heroStat.upsert({
        where: { heroId_attributeId: { heroId: hero.id, attributeId: dbAttribute.id } },
        create: { heroId: hero.id, attributeId: dbAttribute.id, level: 0, progressGold: 0 },
        update: {},
      });

      let level = current.level;
      let progressGold = current.progressGold + 1;
      while (progressGold >= 3 + level) {
        progressGold -= 3 + level;
        level += 1;
      }

      const updated = await tx.heroStat.update({ where: { id: current.id }, data: { level, progressGold } });
      await tx.cardsInventory.update({ where: { attribute_tier: { attribute, tier: 'Gold' } }, data: { count: { decrement: 1 } } });

      return {
        role: hero.role,
        characterName: hero.name,
        attribute,
        level: updated.level,
        progressGold: updated.progressGold,
        neededGold: 3 + updated.level,
      };
    });

    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to invest Gold card' });
  }
});



async function getAttributeLevels(): Promise<Record<string, number>> {
  const stats = await prisma.heroStat.findMany({ include: { attribute: true } });
  const levels: Record<string, number> = {};
  for (const row of stats) {
    const key = row.attribute.label;
    levels[key] = Math.max(levels[key] ?? 0, row.level);
  }
  return levels;
}

function scoreOutcome(stats: Record<string, number>, checks: { attribute: string; min: number; weight: number }[]) {
  const gateFailed = checks.find((check) => (stats[check.attribute] ?? 0) < check.min);
  if (gateFailed) return { allowed: false, outcome: 'fail', reason: `Requires ${gateFailed.attribute} level ${gateFailed.min}` };

  const weightedPower = checks.reduce((sum, check) => sum + (stats[check.attribute] ?? 0) * check.weight, 0);
  const roll = Math.random();
  const successCutoff = Math.min(0.9, 0.35 + weightedPower * 0.08);
  const partialCutoff = Math.min(0.97, successCutoff + 0.35);

  if (roll <= successCutoff) return { allowed: true, outcome: 'success', reason: `Great execution (${(successCutoff * 100).toFixed(0)}% success chance).` };
  if (roll <= partialCutoff) return { allowed: true, outcome: 'partial', reason: 'You made progress, but not a clean finish.' };
  return { allowed: true, outcome: 'fail', reason: 'The attempt slipped this time.' };
}

app.get('/api/adventures', async (_req, res) => {
  const adventures = await prisma.adventure.findMany({ orderBy: { chapter: 'asc' } });
  const progress = await prisma.adventureProgress.findMany();
  const byId = new Map(progress.map((p) => [p.adventureId, p]));
  const payload = adventures.map((a) => ({
    id: a.id,
    chapter: a.chapter,
    title: a.title,
    difficulty: a.difficulty,
    status: byId.get(a.id)?.status ?? (a.chapter === 1 ? 'UNLOCKED' : 'LOCKED'),
  }));
  res.json({ adventures: payload });
});

app.get('/api/adventures/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid adventure id' });
  const adventure = await prisma.adventure.findUnique({ where: { id } });
  if (!adventure) return res.status(404).json({ error: 'Adventure not found' });
  const progress = await prisma.adventureProgress.findUnique({ where: { adventureId: id } });
  const hints = await prisma.hintStore.findMany({ where: { adventureId: id }, orderBy: { id: 'asc' } });
  res.json({
    id: adventure.id,
    chapter: adventure.chapter,
    title: adventure.title,
    difficulty: adventure.difficulty,
    requirements: JSON.parse(adventure.requirementsJson),
    branches: JSON.parse(adventure.branchesJson),
    status: progress?.status ?? (adventure.chapter === 1 ? 'UNLOCKED' : 'LOCKED'),
    hints: hints.map((h) => ({ id: h.id, hintType: h.hintType, price: JSON.parse(h.priceJson) })),
  });
});

app.post('/api/adventures/:id/attempt', async (req, res) => {
  const id = Number(req.params.id);
  const { choiceId } = req.body;
  if (Number.isNaN(id) || !choiceId) return res.status(400).json({ error: 'adventure id and choiceId are required' });

  const adventure = await prisma.adventure.findUnique({ where: { id } });
  if (!adventure) return res.status(404).json({ error: 'Adventure not found' });
  const branches = JSON.parse(adventure.branchesJson);
  const choice = (branches.choices ?? []).find((c: { id: string }) => c.id === choiceId);
  if (!choice) return res.status(400).json({ error: 'Choice not found for this chapter' });

  const stats = await getAttributeLevels();
  const scored = scoreOutcome(stats, choice.checks ?? []);
  if (!scored.allowed) return res.status(400).json({ error: `Cannot attempt: ${scored.reason}` });

  const narrative = choice.outcomes?.[scored.outcome] ?? 'Outcome resolved.';
  await prisma.adventureRun.create({ data: { adventureId: id, resultJson: JSON.stringify({ choiceId, outcome: scored.outcome, narrative }) } });

  await prisma.adventureProgress.upsert({
    where: { adventureId: id },
    update: { status: scored.outcome === 'success' ? 'COMPLETED' : 'UNLOCKED', bestOutcome: scored.outcome },
    create: { adventureId: id, status: scored.outcome === 'success' ? 'COMPLETED' : 'UNLOCKED', bestOutcome: scored.outcome },
  });

  if (scored.outcome === 'success') {
    const next = await prisma.adventure.findFirst({ where: { chapter: adventure.chapter + 1 } });
    if (next) {
      await prisma.adventureProgress.upsert({ where: { adventureId: next.id }, update: { status: 'UNLOCKED' }, create: { adventureId: next.id, status: 'UNLOCKED' } });
    }
  }

  res.json({ success: true, outcome: scored.outcome, explanation: scored.reason, narrative });
});

app.post('/api/adventures/:id/hints/:hintId/purchase', async (req, res) => {
  const id = Number(req.params.id);
  const hintId = Number(req.params.hintId);
  if (Number.isNaN(id) || Number.isNaN(hintId)) return res.status(400).json({ error: 'Invalid ids' });
  const hint = await prisma.hintStore.findUnique({ where: { id: hintId } });
  if (!hint || hint.adventureId !== id) return res.status(404).json({ error: 'Hint not found for this chapter' });
  const price = JSON.parse(hint.priceJson) as { attribute: string; tier: string; count: number };

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.cardsInventory.findUnique({ where: { attribute_tier: { attribute: price.attribute, tier: price.tier } } });
    const current = entry?.count ?? 0;
    if (current < price.count) throw new Error(`Need ${price.count} ${price.attribute}/${price.tier} cards, but only ${current} available.`);
    await tx.cardsInventory.update({ where: { attribute_tier: { attribute: price.attribute, tier: price.tier } }, data: { count: { decrement: price.count } } });
    return { remaining: current - price.count };
  }).catch((error) => ({ error: error instanceof Error ? error.message : 'Could not buy hint' }));

  if ('error' in result) return res.status(400).json({ error: result.error });
  res.json({ success: true, hint: { hintType: hint.hintType, text: hint.scope }, cost: price, remaining: result.remaining });
});

app.listen(port, () => console.log(`Hero Habit Forge backend listening on http://localhost:${port}`));
