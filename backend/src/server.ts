import cors from 'cors';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, app: 'Hero Habit Forge API' });
});

app.get('/api/bootstrap', (_req, res) => {
  res.json({
    appName: 'Hero Habit Forge',
    phase: 'Task templates + Today Board',
    next: 'Cards and forge',
  });
});

app.get('/api/task-templates', async (_req, res) => {
  const templates = await prisma.taskTemplate.findMany({ orderBy: { id: 'asc' } });
  res.json(templates);
});

app.post('/api/task-templates', async (req, res) => {
  const { title, cadenceRule, attribute, baseTier } = req.body;
  if (!title || !cadenceRule || !attribute || !baseTier) {
    return res.status(400).json({ error: 'title, cadenceRule, attribute, and baseTier are required' });
  }

  const template = await prisma.taskTemplate.create({
    data: { title, cadenceRule, attribute, baseTier, isActive: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.taskInstance.create({
    data: {
      templateId: template.id,
      scheduledDate: today,
      status: 'ACTIVE',
      mergedGroupKey: `template-${template.id}`,
    },
  });

  return res.status(201).json(template);
});

app.patch('/api/task-templates/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid template id' });
  }

  const { title, cadenceRule, attribute, baseTier, isActive } = req.body;

  const template = await prisma.taskTemplate.update({
    where: { id },
    data: { title, cadenceRule, attribute, baseTier, isActive },
  });

  return res.json(template);
});

app.get('/api/today-board', async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = await prisma.taskInstance.findMany({
    where: { scheduledDate: today },
    orderBy: { id: 'asc' },
  });

  const templateIds = [...new Set(tasks.map((task: { templateId: number | null }) => task.templateId).filter((id: number | null): id is number => id !== null))];
  const templates = await prisma.taskTemplate.findMany({ where: { id: { in: templateIds } } });
  const templateMap = new Map(templates.map((template: { id: number }) => [template.id, template]));

  const board = tasks.map((task: { templateId: number | null }) => ({
    ...task,
    template: task.templateId ? templateMap.get(task.templateId) ?? null : null,
  }));

  return res.json(board);
});

app.post('/api/today-board/one-off', async (req, res) => {
  const { title, attribute, baseTier } = req.body;
  if (!title || !attribute || !baseTier) {
    return res.status(400).json({ error: 'title, attribute, and baseTier are required' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const task = await prisma.taskInstance.create({
    data: {
      templateId: null,
      scheduledDate: today,
      status: 'ACTIVE',
      mergedGroupKey: `oneoff-${Date.now()}`,
    },
  });

  return res.status(201).json({
    ...task,
    template: {
      id: null,
      title,
      cadenceRule: 'one-off',
      attribute,
      baseTier,
      isActive: true,
    },
  });
});

app.patch('/api/today-board/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (Number.isNaN(id) || !['ACTIVE', 'DONE'].includes(status)) {
    return res.status(400).json({ error: 'Invalid id or status' });
  }

  const task = await prisma.taskInstance.update({
    where: { id },
    data: { status },
  });

  return res.json(task);
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
