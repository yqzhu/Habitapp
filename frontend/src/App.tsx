import { FormEvent, useEffect, useState } from 'react';

type TaskTemplate = { id: number; title: string; cadenceRule: string; attribute: string; baseTier: string; isActive: boolean };
type TodayTask = { id: number; status: 'ACTIVE' | 'DONE'; scheduledDate: string; template: TaskTemplate | null; isDone?: boolean };
type InventoryGroup = { attribute: string; tiers: { tier: string; count: number }[] };
type CharacterStat = { attribute: string; level: number; progressGold: number; neededGold: number };
type Character = { id: number; role: 'HERO' | 'BUDDY'; name: string; stats: CharacterStat[] };
type AdventureListItem = { id: number; chapter: number; title: string; difficulty: number; status: string };
type AdventureDetail = { id: number; chapter: number; title: string; status: string; currentMilestone: number; chapterCompleted?: boolean; branches: { intro: string; finalReveal?: string }; currentMilestoneData: { index: number; title: string; narrative: string; choices: { id: string; label: string }[] } | null; hints: { id: number; hintType: string; text: string; price: { attribute: string; tier: string; count: number; milestone?: number; bonus?: number } }[] };

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
      fetch(`${API_BASE}/api/task-templates`),
      fetch(`${API_BASE}/api/today-board?date=${date}`),
      fetch(`${API_BASE}/api/cards/inventory`),
      fetch(`${API_BASE}/api/stats`),
      fetch(`${API_BASE}/api/adventures`),
    ]);
    setTemplates(await templatesRes.json());
    const boardData = await todayRes.json();
    setTodayTasks((boardData.tasks ?? []).map((t: TodayTask) => ({ ...t, isDone: false })));
    const inventoryData = await inventoryRes.json();
    setInventory(inventoryData.inventory ?? []);
    const statsData = await statsRes.json();
    setCharacters(statsData.characters ?? []);
    const adventuresData = await adventuresRes.json();
    setAdventures(adventuresData.adventures ?? []);
  };

  useEffect(() => { loadData(todayIso); }, []);
  const createTemplate = async (event: FormEvent) => { event.preventDefault(); await fetch(`${API_BASE}/api/task-templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTemplate, startDate: selectedDate }) }); setNewTemplate({ title: '', cadenceRule: 'daily', attribute: 'Physique', baseTier: 'Paper' }); await loadData(); };
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
    setTodayTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isDone: true } : t)));
    await loadData();
  };


  const cancelCadence = async (task: TodayTask) => {
    await fetch(`${API_BASE}/api/today-board/${task.id}/cancel`, { method: 'PATCH' });
    setBoardMessage(`Cancelled this task occurrence: ${task.template?.title ?? 'task'}.`);
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



  const openAdventure = async (id: number, clearMessage = true) => {
    const res = await fetch(`${API_BASE}/api/adventures/${id}`);
    const data = await res.json();
    if (!res.ok) return setAdventureMessage(data.error ?? 'Could not load chapter');
    setSelectedAdventure(data);
    if (clearMessage) setAdventureMessage('');
  };

  const attemptChoice = async (choiceId: string) => {
    if (!selectedAdventure) return;
    const res = await fetch(`${API_BASE}/api/adventures/${selectedAdventure.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceId }),
    });
    const data = await res.json();
    setAdventureMessage(res.ok ? `${data.outcome.toUpperCase()} (Milestone ${data.milestone}): ${data.narrative} ${data.explanation}${data.chapterCompleted ? ` ${data.reveal}` : ''}` : (data.error ?? 'Attempt failed'));
    await loadData();
    await openAdventure(selectedAdventure.id, false);
  };

  const buyHint = async (hintId: number) => {
    if (!selectedAdventure) return;
    const res = await fetch(`${API_BASE}/api/adventures/${selectedAdventure.id}/hints/${hintId}/purchase`, { method: 'POST' });
    const data = await res.json();
    setAdventureMessage(res.ok ? `${data.hint.hintType.toUpperCase()} hint: ${data.hint.text} (milestone bonus now +${Math.round((data.totalMilestoneBonus ?? 0) * 100)}%)` : (data.error ?? 'Hint purchase failed'));
    await loadData();
  };

  const investGold = async (role: 'HERO' | 'BUDDY', attribute: string) => {
    setStatsMessage('');
    const res = await fetch(`${API_BASE}/api/stats/invest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, attribute }),
    });
    const data = await res.json();
    if (!res.ok) return setStatsMessage(data.error ?? 'Failed to invest Gold card');
    setStatsMessage(`${data.result.characterName} invested 1 ${attribute} Gold card. New level ${data.result.level}, progress ${data.result.progressGold}/${data.result.neededGold}.`);
    await loadData();
  };

  return (
    <main className="container">
      <h1>Hero Habit Forge — Phase 6</h1>

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
        <ul>{todayTasks.map((task) => <li key={task.id} style={{ opacity: task.isDone ? 0.5 : 1 }}>[{task.status}] {task.template?.title ?? 'One-off task'} — {task.template?.attribute ?? 'Unmapped'} / {task.template?.baseTier ?? 'Paper'} (due {task.scheduledDate.slice(0, 10)})<button disabled={task.isDone} onClick={() => completeTask(task)}>{task.isDone ? 'Done' : 'Mark done'}</button><button onClick={() => cancelCadence(task)}>Cancel cadence</button><button onClick={() => deleteTaskTemplate(task)}>Delete task</button></li>)}</ul>
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

      <section>
        <h2>Hero/Buddy Stats</h2>
        {statsMessage && <p>{statsMessage}</p>}
        <div>
          {characters.map((character) => (
            <article key={character.id}>
              <h3>{character.name}</h3>
              <ul>
                {character.stats.map((stat) => {
                  const pct = stat.neededGold > 0 ? Math.floor((stat.progressGold / stat.neededGold) * 100) : 0;
                  return (
                    <li key={`${character.id}-${stat.attribute}`}>
                      <strong>{stat.attribute}</strong>: level {stat.level} — {stat.progressGold}/{stat.neededGold}
                      <div style={{ width: '220px', border: '1px solid #999', margin: '4px 0', height: '12px' }}>
                        <div style={{ width: `${pct}%`, background: '#d4af37', height: '100%' }} />
                      </div>
                      <button onClick={() => investGold(character.role, stat.attribute)}>Invest 1 Gold</button>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Adventure</h2>
        <ul>
          {adventures.map((adventure) => (
            <li key={adventure.id}>
              Chapter {adventure.chapter}: {adventure.title} [{adventure.status}]
              <button disabled={adventure.status === 'LOCKED'} onClick={() => openAdventure(adventure.id)}>Open</button>
            </li>
          ))}
        </ul>
        {selectedAdventure && (
          <article>
            <h3>{selectedAdventure.title}</h3>
            <p>{selectedAdventure.branches.intro}</p>
            <p><strong>Current milestone {selectedAdventure.currentMilestone}:</strong> {selectedAdventure.currentMilestoneData?.title ?? 'Completed'}</p>
            <p>{selectedAdventure.currentMilestoneData?.narrative ?? selectedAdventure.branches.finalReveal}</p>
            <ul>
              {(selectedAdventure.currentMilestoneData?.choices ?? []).map((choice) => (
                <li key={choice.id}><button disabled={selectedAdventure.chapterCompleted} onClick={() => attemptChoice(choice.id)}>{choice.label}</button></li>
              ))}
            </ul>
            <h4>Hints</h4>
            <p>Each hint adds to your success chance on its milestone. Example: +5% means success chance increases by 5 percentage points. Hint bonuses stack additively, and you need zero fixed hints — buy as many as you want for better odds.</p>
            <ul>
              {selectedAdventure.hints.map((hint) => (
                <li key={hint.id}>
                  {hint.hintType} (M{hint.price.milestone ?? '?'} | {hint.price.count} {hint.price.attribute}/{hint.price.tier} | +{Math.round((hint.price.bonus ?? 0) * 100)}%)
                  <button onClick={() => buyHint(hint.id)}>Buy</button>
                </li>
              ))}
            </ul>
          </article>
        )}
        {adventureMessage && <p>{adventureMessage}</p>}
      </section>

    </main>
  );
}
