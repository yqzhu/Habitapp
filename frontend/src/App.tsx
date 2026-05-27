import { FormEvent, useEffect, useState } from 'react';

type TaskTemplate = {
  id: number;
  title: string;
  cadenceRule: string;
  attribute: string;
  baseTier: string;
  isActive: boolean;
};

type TodayTask = {
  id: number;
  status: 'ACTIVE' | 'DONE';
  template: TaskTemplate | null;
};

const API_BASE = 'http://localhost:3001';
const ATTRIBUTE_OPTIONS = ['Physique', 'Charisma', 'Wisdom', 'Sociability', 'Farming', 'Wealth', 'Survival'];
const TIER_OPTIONS = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'];

export function App() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
  const [newTemplate, setNewTemplate] = useState({ title: '', cadenceRule: 'daily', attribute: 'Physique', baseTier: 'Paper' });
  const [newOneOff, setNewOneOff] = useState({ title: '', attribute: 'Wisdom', baseTier: 'Paper' });

  const loadData = async () => {
    const [templatesRes, todayRes] = await Promise.all([
      fetch(`${API_BASE}/api/task-templates`),
      fetch(`${API_BASE}/api/today-board`),
    ]);

    setTemplates(await templatesRes.json());
    setTodayTasks(await todayRes.json());
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTemplate = async (event: FormEvent) => {
    event.preventDefault();
    await fetch(`${API_BASE}/api/task-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTemplate),
    });
    setNewTemplate({ title: '', cadenceRule: 'daily', attribute: 'Physique', baseTier: 'Paper' });
    await loadData();
  };

  const toggleTemplate = async (template: TaskTemplate) => {
    await fetch(`${API_BASE}/api/task-templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...template, isActive: !template.isActive }),
    });
    await loadData();
  };

  const createOneOff = async (event: FormEvent) => {
    event.preventDefault();
    await fetch(`${API_BASE}/api/today-board/one-off`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOneOff),
    });
    setNewOneOff({ title: '', attribute: 'Wisdom', baseTier: 'Paper' });
    await loadData();
  };

  const toggleTodayTask = async (task: TodayTask) => {
    const nextStatus = task.status === 'DONE' ? 'ACTIVE' : 'DONE';
    await fetch(`${API_BASE}/api/today-board/${task.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadData();
  };

  return (
    <main className="container">
      <h1>Hero Habit Forge — Phase 3</h1>

      <section>
        <h2>Task Templates</h2>
        <form onSubmit={createTemplate}>
          <input placeholder="Title" value={newTemplate.title} onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })} required />
          <input list="cadence-options" placeholder="Cadence" value={newTemplate.cadenceRule} onChange={(e) => setNewTemplate({ ...newTemplate, cadenceRule: e.target.value })} required />
          <datalist id="cadence-options">
            <option value="daily" />
            <option value="every other day" />
            <option value="every tues & thursday" />
            <option value="mon wed fri" />
          </datalist>
          <select value={newTemplate.attribute} onChange={(e) => setNewTemplate({ ...newTemplate, attribute: e.target.value })}>
            {ATTRIBUTE_OPTIONS.map((attribute) => <option key={attribute} value={attribute}>{attribute}</option>)}
          </select>
          <select value={newTemplate.baseTier} onChange={(e) => setNewTemplate({ ...newTemplate, baseTier: e.target.value })}>
            {TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
          </select>
          <button type="submit">Add template</button>
        </form>
        <ul>
          {templates.map((template) => (
            <li key={template.id}>
              {template.title} ({template.cadenceRule}) → {template.attribute}/{template.baseTier} — {template.isActive ? 'Active' : 'Paused'}
              <button onClick={() => toggleTemplate(template)}>{template.isActive ? 'Pause' : 'Activate'}</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Today Board</h2>
        <form onSubmit={createOneOff}>
          <input placeholder="One-off title" value={newOneOff.title} onChange={(e) => setNewOneOff({ ...newOneOff, title: e.target.value })} required />
          <select value={newOneOff.attribute} onChange={(e) => setNewOneOff({ ...newOneOff, attribute: e.target.value })}>
            {ATTRIBUTE_OPTIONS.map((attribute) => <option key={attribute} value={attribute}>{attribute}</option>)}
          </select>
          <select value={newOneOff.baseTier} onChange={(e) => setNewOneOff({ ...newOneOff, baseTier: e.target.value })}>
            {TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
          </select>
          <button type="submit">Add one-off</button>
        </form>

        <ul>
          {todayTasks.map((task) => (
            <li key={task.id}>
              [{task.status}] {task.template?.title ?? 'One-off task'} — {task.template?.attribute ?? 'Unmapped'} / {task.template?.baseTier ?? 'Paper'}
              <button onClick={() => toggleTodayTask(task)}>{task.status === 'DONE' ? 'Mark active' : 'Mark done'}</button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
