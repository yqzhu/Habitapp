import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, app: 'Hero Habit Forge API' });
});

app.get('/api/bootstrap', (_req, res) => {
  res.json({
    appName: 'Hero Habit Forge',
    phase: 'Scaffold complete',
    next: 'DB schema and migrations',
  });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
