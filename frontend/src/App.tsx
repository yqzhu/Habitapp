import { FormEvent, useEffect, useState } from 'react';

type TaskTemplate = { id: number; title: string; cadenceRule: string; attribute: string; baseTier: string; isActive: boolean };
type TodayTask = { id: number; status: 'ACTIVE' | 'DONE'; scheduledDate: string; template: TaskTemplate | null; isDone?: boolean };
type InventoryGroup = { attribute: string; tiers: { tier: string; count: number }[] };
type CharacterStat = { attribute: string; level: number; progressGold: number; neededGold: number };
type Character = { id: number; role: 'HERO' | 'BUDDY'; name: string; stats: CharacterStat[] };
type AdventureListItem = { id: number; chapter: number; title: string; difficulty: number; status: string };
type AdventureDetail = { id: number; chapter: number; title: string; status: string; branches: { intro: string; choices: { id: string; label: string }[] }; hints: { id: number; hintType: string; price: { attribute: string; tier: string; count: number } }[] };

const API_BASE = 'http://localhost:3001';
const ATTRIBUTE_OPTIONS = ['Physique', 'Charisma', 'Wisdom', 'Sociability', 'Farming', 'Wealth', 'Survival'];
const TIER_OPTIONS = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'];
const formatLocalDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayIso = formatLocalDate(new Date());

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
  const [characters, setCharacters] = useState<Character[]>([]);
  const [statsMessage, setStatsMessage] = useState('');
  const [adventures, setAdventures] = useState<AdventureListItem[]>([]);
  const [selectedAdventure, setSelectedAdventure] = useState<AdventureDetail | null>(null);
  const [adventureMessage, setAdventureMessage] = useState('');

  const loadData = async (date = selectedDate) => {
    const [templatesRes, todayRes, inventoryRes, statsRes, adventuresRes] = await Promise.all([
      fetch(`${API_BASE}/api/task-templates`), fetch(`${API_BASE}/api/today-board?date=${date}`), fetch(`${API_BASE}/api/cards/inventory`), fetch(`${API_BASE}/api/stats`), fetch(`${API_BASE}/api/adventures`),
    ]);
    setTemplates(await templatesRes.json());
    const boardData = await todayRes.json(); setTodayTasks((boardData.tasks ?? []).map((t: TodayTask) => ({ ...t, isDone: false })));
    const inventoryData = await inventoryRes.json(); setInventory(inventoryData.inventory ?? []);
    const statsData = await statsRes.json(); setCharacters(statsData.characters ?? []);
    const adventuresData = await adventuresRes.json(); setAdventures(adventuresData.adventures ?? []);
  };

  useEffect(() => { loadData(todayIso); }, []);
  const createTemplate = async (event: FormEvent) => { event.preventDefault(); await fetch(`${API_BASE}/api/task-templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTemplate, startDate: selectedDate }) }); setNewTemplate({ title: '', cadenceRule: 'daily', attribute: 'Physique', baseTier: 'Paper' }); await loadData(); };
  const createOneOff = async (event: FormEvent) => { event.preventDefault(); await fetch(`${API_BASE}/api/today-board/one-off`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newOneOff, date: selectedDate }) }); setNewOneOff({ title: '', attribute: 'Wisdom', baseTier: 'Paper' }); await loadData(); };
  const completeTask = async (task: TodayTask) => { const res = await fetch(`${API_BASE}/api/today-board/${task.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'DONE' }) }); const data = await res.json(); if (!res.ok) return setBoardMessage(data.error ?? 'Failed'); setBoardMessage(`Completed ${task.template?.title ?? 'task'}.`); await loadData(); };
  const forgeCards = async (event: FormEvent) => { event.preventDefault(); const res = await fetch(`${API_BASE}/api/cards/forge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attribute: forgeAttribute, tier: forgeTier }) }); const data = await res.json(); setForgeMessage(res.ok ? `Merged into ${data.producedTier}.` : data.error); await loadData(); };
  const investGold = async (role: 'HERO' | 'BUDDY', attribute: string) => { const res = await fetch(`${API_BASE}/api/stats/invest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, attribute }) }); const data = await res.json(); setStatsMessage(res.ok ? `${data.result.characterName} improved ${attribute}.` : data.error); await loadData(); };
  const openAdventure = async (id: number) => { const res = await fetch(`${API_BASE}/api/adventures/${id}`); const data = await res.json(); if (!res.ok) return setAdventureMessage(data.error ?? 'Could not load chapter'); setSelectedAdventure(data); setAdventureMessage(''); };
  const attemptChoice = async (choiceId: string) => { if (!selectedAdventure) return; const res = await fetch(`${API_BASE}/api/adventures/${selectedAdventure.id}/attempt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ choiceId }) }); const data = await res.json(); setAdventureMessage(res.ok ? `${data.outcome.toUpperCase()}: ${data.narrative} ${data.explanation}` : data.error); await loadData(); await openAdventure(selectedAdventure.id); };
  const buyHint = async (hintId: number) => { if (!selectedAdventure) return; const res = await fetch(`${API_BASE}/api/adventures/${selectedAdventure.id}/hints/${hintId}/purchase`, { method: 'POST' }); const data = await res.json(); setAdventureMessage(res.ok ? `${data.hint.hintType.toUpperCase()} hint: ${data.hint.text}` : data.error); await loadData(); };

  return <main className="container"><h1>Hero Habit Forge — Phase 6 Adventure</h1>
    <section><h2>Task Templates</h2><form onSubmit={createTemplate}><input placeholder="Title" value={newTemplate.title} onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })} required /><select value={newTemplate.attribute} onChange={(e) => setNewTemplate({ ...newTemplate, attribute: e.target.value })}>{ATTRIBUTE_OPTIONS.map((a) => <option key={a}>{a}</option>)}</select><select value={newTemplate.baseTier} onChange={(e) => setNewTemplate({ ...newTemplate, baseTier: e.target.value })}>{TIER_OPTIONS.map((t) => <option key={t}>{t}</option>)}</select><button>Add template</button></form><ul>{templates.map((t) => <li key={t.id}>{t.title}</li>)}</ul></section>
    <section><h2>Today Board</h2><label><input type="date" min={todayIso} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); void loadData(e.target.value); }} /></label><form onSubmit={createOneOff}><input placeholder="One-off title" value={newOneOff.title} onChange={(e) => setNewOneOff({ ...newOneOff, title: e.target.value })} required /><button>Add one-off</button></form>{boardMessage && <p>{boardMessage}</p>}<ul>{todayTasks.map((task) => <li key={task.id}>{task.template?.title}<button onClick={() => completeTask(task)}>Mark done</button></li>)}</ul></section>
    <section><h2>Card Inventory + Forge</h2><table><tbody>{inventory.map((row) => <tr key={row.attribute}><td>{row.attribute}</td>{row.tiers.map((tierInfo) => <td key={`${row.attribute}-${tierInfo.tier}`}>{tierInfo.count}</td>)}</tr>)}</tbody></table><form onSubmit={forgeCards}><select value={forgeAttribute} onChange={(e) => setForgeAttribute(e.target.value)}>{ATTRIBUTE_OPTIONS.map((a) => <option key={a}>{a}</option>)}</select><select value={forgeTier} onChange={(e) => setForgeTier(e.target.value)}>{TIER_OPTIONS.map((t) => <option key={t}>{t}</option>)}</select><button>Merge</button></form>{forgeMessage && <p>{forgeMessage}</p>}</section>
    <section><h2>Hero/Buddy Stats</h2>{statsMessage && <p>{statsMessage}</p>}{characters.map((c) => <article key={c.id}><h3>{c.name}</h3><ul>{c.stats.map((s) => <li key={s.attribute}>{s.attribute} Lv{s.level} <button onClick={() => investGold(c.role, s.attribute)}>Invest Gold</button></li>)}</ul></article>)}</section>
    <section><h2>Adventure</h2><ul>{adventures.map((a) => <li key={a.id}>Chapter {a.chapter}: {a.title} [{a.status}] <button disabled={a.status === 'LOCKED'} onClick={() => openAdventure(a.id)}>Open</button></li>)}</ul>{selectedAdventure && <article><h3>{selectedAdventure.title}</h3><p>{selectedAdventure.branches.intro}</p><ul>{selectedAdventure.branches.choices.map((choice) => <li key={choice.id}><button onClick={() => attemptChoice(choice.id)}>{choice.label}</button></li>)}</ul><h4>Hints</h4><ul>{selectedAdventure.hints.map((h) => <li key={h.id}>{h.hintType} ({h.price.count} {h.price.attribute}/{h.price.tier}) <button onClick={() => buyHint(h.id)}>Buy</button></li>)}</ul></article>}{adventureMessage && <p>{adventureMessage}</p>}</section>
  </main>;
}
