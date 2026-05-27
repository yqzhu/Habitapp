import { FormEvent, useEffect, useState } from 'react';

type TaskTemplate = { id: number; title: string; cadenceRule: string; attribute: string; baseTier: string; isActive: boolean };
type TodayTask = { id: number; status: 'ACTIVE' | 'DONE'; scheduledDate: string; template: TaskTemplate | null };
type InventoryGroup = { attribute: string; tiers: { tier: string; count: number }[] };

const API_BASE = 'http://localhost:3001';
const ATTRIBUTE_OPTIONS = ['Physique', 'Charisma', 'Wisdom', 'Sociability', 'Farming', 'Wealth', 'Survival'];
const TIER_OPTIONS = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'];
const todayIso = new Date().toISOString().slice(0, 10);

export function App() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
  const [inventory, setInventory] = useState<InventoryGroup[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [boardMessage, setBoardMessage] = useState('');
  const [forgeAttribute, setForgeAttribute] = useState('Physique');
  const [forgeTier, setForgeTier] = useState('Paper');
  const [forgeMessage, setForgeMessage] = useState('');
  const [newTemplate, setNewTemplate] = useState({ title: '', cadenceRule: 'daily', attribute: 'Physique', baseTier: 'Paper' });
  const [newOneOff, setNewOneOff] = useState({ title: '', attribute: 'Wisdom', baseTier: 'Paper' });

  const loadData = async (date = selectedDate) => {
    const [templatesRes, todayRes, inventoryRes] = await Promise.all([
      fetch(`${API_BASE}/api/task-templates`),
      fetch(`${API_BASE}/api/today-board?date=${date}`),
      fetch(`${API_BASE}/api/cards/inventory`),
    ]);

    setTemplates(await templatesRes.json());
    const boardData = await todayRes.json();
    setTodayTasks(boardData.tasks ?? []);
    const inventoryData = await inventoryRes.json();
    setInventory(inventoryData.inventory ?? []);
  };

  useEffect(() => { loadData(todayIso); }, []);

  const createTemplate = async (event: FormEvent) => { event.preventDefault(); await fetch(`${API_BASE}/api/task-templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTemplate, startDate: selectedDate }) }); setNewTemplate({ title: '', cadenceRule: 'daily', attribute: 'Physique', baseTier: 'Paper' }); await loadData(); };
  const toggleTemplate = async (template: TaskTemplate) => { await fetch(`${API_BASE}/api/task-templates/${template.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...template, isActive: !template.isActive }) }); await loadData(); };
  const createOneOff = async (event: FormEvent) => { event.preventDefault(); await fetch(`${API_BASE}/api/today-board/one-off`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newOneOff, date: selectedDate }) }); setNewOneOff({ title: '', attribute: 'Wisdom', baseTier: 'Paper' }); await loadData(); };

  const completeTask = async (task: TodayTask) => {
    const res = await fetch(`${API_BASE}/api/today-board/${task.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBoardMessage(data.error ?? 'Failed to complete task');
      return;
    }
    setBoardMessage(`Completed ${task.template?.title ?? 'task'} and received ${data.awardedCard.attribute}/${data.awardedCard.tier} card.`);
    await loadData();
  };


  const cancelCadence = async (task: TodayTask) => {
    if (!task.template?.id) return;
    await fetch(`${API_BASE}/api/task-templates/${task.template.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...task.template, isActive: false }),
    });
    await loadData();
  };

  const deleteTaskTemplate = async (task: TodayTask) => {
    if (!task.template?.id) return;
    await fetch(`${API_BASE}/api/task-templates/${task.template.id}`, { method: 'DELETE' });
    await loadData();
  };

  const forgeCards = async (event: FormEvent) => {
    event.preventDefault();
    setForgeMessage('');
    const res = await fetch(`${API_BASE}/api/cards/forge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attribute: forgeAttribute, tier: forgeTier }),
    });
    const data = await res.json();
    if (!res.ok) return setForgeMessage(data.error ?? 'Merge failed');
    setForgeMessage(`Merged 3 ${forgeAttribute} ${forgeTier} cards into 1 ${data.producedTier} card.`);
    await loadData();
  };

  return (
    <main className="container">
      <h1>Hero Habit Forge — Phase 4</h1>

      <section><h2>Task Templates</h2>
        <form onSubmit={createTemplate}><input placeholder="Title" value={newTemplate.title} onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })} required />
          <input list="cadence-options" placeholder="Cadence" value={newTemplate.cadenceRule} onChange={(e) => setNewTemplate({ ...newTemplate, cadenceRule: e.target.value })} required />
          <datalist id="cadence-options">
            <option value="daily" />
            <option value="every 1 day" />
            <option value="every 2 day" />
            <option value="every Fri" />
            <option value="every Mon,Wed,Fri" />
          </datalist>
          <select value={newTemplate.attribute} onChange={(e) => setNewTemplate({ ...newTemplate, attribute: e.target.value })}>{ATTRIBUTE_OPTIONS.map((attribute) => <option key={attribute} value={attribute}>{attribute}</option>)}</select>
          <select value={newTemplate.baseTier} onChange={(e) => setNewTemplate({ ...newTemplate, baseTier: e.target.value })}>{TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select>
          <button type="submit">Add template</button></form>
        <p>Cadence format: daily, every n day (n=1..30), or every Mon[,Tue,...]. New template starts from selected date.</p>
        <ul>{templates.map((template) => <li key={template.id}>{template.title} ({template.cadenceRule}) → {template.attribute}/{template.baseTier} — {template.isActive ? 'Active' : 'Paused'}<button onClick={() => toggleTemplate(template)}>{template.isActive ? 'Pause' : 'Activate'}</button></li>)}</ul>
      </section>

      <section><h2>Today Board</h2>
        <label>Pick date: <input type="date" min={todayIso} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); void loadData(e.target.value); }} /></label>
        <form onSubmit={createOneOff}><input placeholder="One-off title" value={newOneOff.title} onChange={(e) => setNewOneOff({ ...newOneOff, title: e.target.value })} required />
          <select value={newOneOff.attribute} onChange={(e) => setNewOneOff({ ...newOneOff, attribute: e.target.value })}>{ATTRIBUTE_OPTIONS.map((attribute) => <option key={attribute} value={attribute}>{attribute}</option>)}</select>
          <select value={newOneOff.baseTier} onChange={(e) => setNewOneOff({ ...newOneOff, baseTier: e.target.value })}>{TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select>
          <button type="submit">Add one-off</button></form>
        {boardMessage && <p>{boardMessage}</p>}
        <ul>{todayTasks.map((task) => <li key={task.id}>[{task.status}] {task.template?.title ?? 'One-off task'} — {task.template?.attribute ?? 'Unmapped'} / {task.template?.baseTier ?? 'Paper'} (due {task.scheduledDate.slice(0, 10)})<button onClick={() => completeTask(task)}>Mark done</button><button onClick={() => cancelCadence(task)}>Cancel cadence</button><button onClick={() => deleteTaskTemplate(task)}>Delete task</button></li>)}</ul>
      </section>

      <section>
        <h2>Card Inventory + Forge</h2>
        <p>Merge rule: 3 cards of same attribute+tier turns into 1 card of next tier.</p>
        <table><thead><tr><th>Attribute</th>{TIER_OPTIONS.map((tier) => <th key={tier}>{tier}</th>)}</tr></thead>
          <tbody>{inventory.map((row) => <tr key={row.attribute}><td>{row.attribute}</td>{row.tiers.map((tierInfo) => <td key={`${row.attribute}-${tierInfo.tier}`}>{tierInfo.count}</td>)}</tr>)}</tbody></table>
        <form onSubmit={forgeCards}><select value={forgeAttribute} onChange={(e) => setForgeAttribute(e.target.value)}>{ATTRIBUTE_OPTIONS.map((attribute) => <option key={attribute} value={attribute}>{attribute}</option>)}</select>
          <select value={forgeTier} onChange={(e) => setForgeTier(e.target.value)}>{TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select><button type="submit">Merge 3 → 1</button></form>
        {forgeMessage && <p>{forgeMessage}</p>}
      </section>
    </main>
  );
}
