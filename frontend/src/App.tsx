import { FormEvent, useEffect, useState } from 'react';

const heroImageUrl = new URL('../../cards/Hero_image.png', import.meta.url).href;
const buddyImageUrl = new URL('../../cards/Buddy_image.png', import.meta.url).href;

type TaskTemplate = { id: number; title: string; cadenceRule: string; attribute: string; baseTier: string; isActive: boolean };
type TodayTask = { id: number; status: 'ACTIVE' | 'DONE'; scheduledDate: string; template: TaskTemplate | null; isDone?: boolean };
type InventoryGroup = { attribute: string; tiers: { tier: string; count: number }[] };
type CharacterStat = { attribute: string; level: number; progressGold: number; neededGold: number };
type Character = { id: number; role: 'HERO' | 'BUDDY'; name: string; stats: CharacterStat[] };
type AdventureListItem = { id: number; chapter: number; title: string; difficulty: number; status: string };
type AdventureDetail = { id: number; chapter: number; title: string; status: string; currentMilestone: number; chapterCompleted?: boolean; branches: { intro: string; finalReveal?: string }; currentMilestoneData: { index: number; title: string; narrative: string; choices: { id: string; label: string }[] } | null; hints: { id: number; hintType: string; text: string; price: { attribute: string; tier: string; count: number; milestone?: number; bonus?: number } }[] };
type AppTab = 'templates' | 'today' | 'cards' | 'stats' | 'adventure';

const API_BASE = 'http://localhost:3001';
const ATTRIBUTE_OPTIONS = ['Physique', 'Charisma', 'Wisdom', 'Sociability', 'Farming', 'Wealth', 'Survival'];
const TIER_OPTIONS = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'];
const formatLocalDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayIso = formatLocalDate(new Date());
const tierClassName = (tier: string) => `tier-${tier.toLowerCase()}`;
const TABS: { id: AppTab; label: string }[] = [
  { id: 'templates', label: 'Templates' },
  { id: 'today', label: 'Today Board' },
  { id: 'cards', label: 'Cards + Forge' },
  { id: 'stats', label: 'Stats' },
  { id: 'adventure', label: 'Adventure' },
];

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
  const [activeTab, setActiveTab] = useState<AppTab>('templates');

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

  const createTemplate = async (event: FormEvent) => {
    event.preventDefault();
    await fetch(`${API_BASE}/api/task-templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTemplate, startDate: selectedDate }) });
    setNewTemplate({ title: '', cadenceRule: 'daily', attribute: 'Physique', baseTier: 'Paper' });
    await loadData();
  };

  const toggleTemplate = async (template: TaskTemplate) => {
    await fetch(`${API_BASE}/api/task-templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    await loadData();
  };

  const createOneOff = async (event: FormEvent) => {
    event.preventDefault();
    await fetch(`${API_BASE}/api/today-board/one-off`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newOneOff, date: selectedDate }) });
    setNewOneOff({ title: '', attribute: 'Wisdom', baseTier: 'Paper' });
    await loadData();
  };

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
    <main className="app-shell">
      <header className="hero-banner">
        <p className="eyebrow">Local-first habit RPG</p>
        <h1>Hero Habit Forge</h1>
        <p className="hero-copy">Turn daily effort into cards, forge stronger tiers, and spend Gold to unlock a detective adventure for Hero and Buddy.</p>
      </header>

      <nav className="tab-toolbar" aria-label="Hero Habit Forge sections">
        {TABS.map((tab) => (
          <button
            className={`tab-button ${activeTab === tab.id ? 'is-active' : ''}`}
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'templates' && (
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Plan the grind</p>
          <h2>Task Templates</h2>
          <p>Define recurring habits with cadence, attribute, and card tier rewards.</p>
        </div>
        <form className="control-grid" onSubmit={createTemplate}>
          <input placeholder="Title" value={newTemplate.title} onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })} required />
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
          <button type="submit">Add template</button>
        </form>
        <p className="hint-text">Cadence format: daily, every n day (n=1..30), or every Mon[,Tue,...]. New template starts from selected date.</p>
        <div className="item-list">
          {templates.map((template) => (
            <article className="list-card" key={template.id}>
              <div>
                <h3>{template.title}</h3>
                <p>{template.cadenceRule} → {template.attribute}/{template.baseTier}</p>
              </div>
              <span className={`status-pill ${template.isActive ? 'status-active' : 'status-muted'}`}>{template.isActive ? 'Active' : 'Paused'}</span>
              <button className="button-secondary" onClick={() => toggleTemplate(template)}>{template.isActive ? 'Pause' : 'Activate'}</button>
            </article>
          ))}
        </div>
      </section>
      )}

      {activeTab === 'today' && (
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Today</p>
          <h2>Today Board</h2>
          <p>Review scheduled work, add one-offs, and collect card rewards for completed tasks.</p>
        </div>
        <div className="date-row">
          <label>Pick date: <input type="date" min={todayIso} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); void loadData(e.target.value); }} /></label>
        </div>
        <form className="control-grid" onSubmit={createOneOff}>
          <input placeholder="One-off title" value={newOneOff.title} onChange={(e) => setNewOneOff({ ...newOneOff, title: e.target.value })} required />
          <select value={newOneOff.attribute} onChange={(e) => setNewOneOff({ ...newOneOff, attribute: e.target.value })}>{ATTRIBUTE_OPTIONS.map((attribute) => <option key={attribute} value={attribute}>{attribute}</option>)}</select>
          <select value={newOneOff.baseTier} onChange={(e) => setNewOneOff({ ...newOneOff, baseTier: e.target.value })}>{TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select>
          <button type="submit">Add one-off</button>
        </form>
        {boardMessage && <p className="feedback feedback-info">{boardMessage}</p>}
        <div className="item-list">
          {todayTasks.map((task) => (
            <article className={`list-card task-card ${task.isDone ? 'is-done' : ''}`} key={task.id}>
              <div>
                <span className={`status-pill ${task.status === 'ACTIVE' ? 'status-active' : 'status-muted'}`}>{task.status}</span>
                <h3>{task.template?.title ?? 'One-off task'}</h3>
                <p>{task.template?.attribute ?? 'Unmapped'} / {task.template?.baseTier ?? 'Paper'} · due {task.scheduledDate.slice(0, 10)}</p>
              </div>
              <div className="action-row">
                <button disabled={task.isDone} onClick={() => completeTask(task)}>{task.isDone ? 'Done' : 'Mark done'}</button>
                <button className="button-secondary" onClick={() => cancelCadence(task)}>Cancel cadence</button>
                <button className="button-danger" onClick={() => deleteTaskTemplate(task)}>Delete task</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      {activeTab === 'cards' && (
      <section className="panel card-panel">
        <div className="section-heading">
          <p className="eyebrow">Forge cards</p>
          <h2>Card Inventory + Forge</h2>
          <p>Merge rule: 3 cards of same attribute+tier turns into 1 card of next tier.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Attribute</th>{TIER_OPTIONS.map((tier) => <th key={tier}>{tier}</th>)}</tr></thead>
            <tbody>
              {inventory.map((row) => (
                <tr key={row.attribute}>
                  <td>{row.attribute}</td>
                  {row.tiers.map((tierInfo) => <td key={`${row.attribute}-${tierInfo.tier}`}><span className={`card-count ${tierClassName(tierInfo.tier)}`}>{tierInfo.count}</span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="forge-controls" onSubmit={forgeCards}>
          <select value={forgeAttribute} onChange={(e) => setForgeAttribute(e.target.value)}>{ATTRIBUTE_OPTIONS.map((attribute) => <option key={attribute} value={attribute}>{attribute}</option>)}</select>
          <select value={forgeTier} onChange={(e) => setForgeTier(e.target.value)}>{TIER_OPTIONS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}</select>
          <button type="submit">Merge 3 → 1</button>
        </form>
        {forgeMessage && <p className="feedback feedback-info">{forgeMessage}</p>}
      </section>
      )}

      {activeTab === 'stats' && (
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Grow the party</p>
          <h2>Hero/Buddy Stats</h2>
          <p>Invest Gold cards to raise attributes using the existing level threshold.</p>
        </div>
        {statsMessage && <p className="feedback feedback-info">{statsMessage}</p>}
        <div className="character-grid">
          {characters.map((character) => (
            <article className="character-card" key={character.id}>
              <figure className="character-portrait">
                <img src={character.role === 'HERO' ? heroImageUrl : buddyImageUrl} alt={`${character.name} portrait`} />
              </figure>
              <div className="character-stats">
                <h3>{character.name}</h3>
                <div className="stat-list">
                {character.stats.map((stat) => {
                  const pct = stat.neededGold > 0 ? Math.floor((stat.progressGold / stat.neededGold) * 100) : 0;
                  return (
                    <div className="stat-row" key={`${character.id}-${stat.attribute}`}>
                      <div>
                        <strong>{stat.attribute}</strong>
                        <span>Level {stat.level} · {stat.progressGold}/{stat.neededGold} Gold</span>
                      </div>
                      <div className="progress-track" aria-label={`${stat.attribute} progress`}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                      <button className="button-secondary" onClick={() => investGold(character.role, stat.attribute)}>Invest 1 Gold</button>
                    </div>
                  );
                })}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      {activeTab === 'adventure' && (
      <section className="panel adventure-panel">
        <div className="section-heading">
          <p className="eyebrow">Detective casebook</p>
          <h2>Adventure</h2>
          <p>Open unlocked chapters, attempt milestone choices, and trade cards for probability hints.</p>
        </div>
        <div className="chapter-list">
          {adventures.map((adventure) => (
            <article className="list-card" key={adventure.id}>
              <div>
                <span className={`status-pill ${adventure.status === 'LOCKED' ? 'status-muted' : 'status-active'}`}>{adventure.status}</span>
                <h3>Chapter {adventure.chapter}: {adventure.title}</h3>
                <p>Difficulty {adventure.difficulty}</p>
              </div>
              <button disabled={adventure.status === 'LOCKED'} onClick={() => openAdventure(adventure.id)}>Open</button>
            </article>
          ))}
        </div>
        {selectedAdventure && (
          <article className="case-file">
            <div className="case-header">
              <span className="status-pill status-active">Chapter {selectedAdventure.chapter}</span>
              <h3>{selectedAdventure.title}</h3>
            </div>
            <p>{selectedAdventure.branches.intro}</p>
            <div className="milestone-card">
              <p className="eyebrow">Current milestone {selectedAdventure.currentMilestone}</p>
              <h4>{selectedAdventure.currentMilestoneData?.title ?? 'Completed'}</h4>
              <p>{selectedAdventure.currentMilestoneData?.narrative ?? selectedAdventure.branches.finalReveal}</p>
            </div>
            <div className="choice-grid">
              {(selectedAdventure.currentMilestoneData?.choices ?? []).map((choice) => (
                <button disabled={selectedAdventure.chapterCompleted} key={choice.id} onClick={() => attemptChoice(choice.id)}>{choice.label}</button>
              ))}
            </div>
            <div className="hint-box">
              <h4>Hints</h4>
              <p>Each hint adds to your success chance on its milestone. Example: +5% means success chance increases by 5 percentage points. Hint bonuses stack additively, and you need zero fixed hints — buy as many as you want for better odds.</p>
              <div className="hint-list">
                {selectedAdventure.hints.map((hint) => (
                  <article className="hint-card" key={hint.id}>
                    <div>
                      <strong>{hint.hintType}</strong>
                      <span>M{hint.price.milestone ?? '?'} · {hint.price.count} {hint.price.attribute}/{hint.price.tier} · +{Math.round((hint.price.bonus ?? 0) * 100)}%</span>
                    </div>
                    <button className="button-secondary" onClick={() => buyHint(hint.id)}>Buy</button>
                  </article>
                ))}
              </div>
            </div>
          </article>
        )}
        {adventureMessage && <p className="feedback feedback-info">{adventureMessage}</p>}
      </section>
      )}
    </main>
  );
}
