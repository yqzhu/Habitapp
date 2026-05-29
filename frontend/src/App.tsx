import { FormEvent, useEffect, useState } from 'react';

const heroImageUrl = new URL('../../cards/Hero_updated.png', import.meta.url).href;
const buddyImageUrl = new URL('../../cards/Buddy_updated.png', import.meta.url).href;
type GlobbedCardImages = ImportMeta & {
  glob: (pattern: string, options: { eager: true; query: string; import: string }) => Record<string, string>;
};

const cardImageModules = (import.meta as GlobbedCardImages).glob('../../cards/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

type TaskTemplate = { id: number; title: string; cadenceRule: string; attribute: string; baseTier: string; isActive: boolean };
type TodayTask = { id: number; status: 'ACTIVE' | 'DONE'; scheduledDate: string; template: TaskTemplate | null; isDone?: boolean };
type InventoryGroup = { attribute: string; tiers: { tier: string; count: number }[] };
type CharacterStat = { attribute: string; level: number; progressGold: number; neededGold: number };
type Character = { id: number; role: 'HERO' | 'BUDDY'; name: string; stats: CharacterStat[] };
type AdventureListItem = { id: number; chapter: number; title: string; difficulty: number; status: string };
type AdventureDetail = { id: number; chapter: number; title: string; status: string; currentMilestone: number; chapterCompleted?: boolean; branches: { intro: string; finalReveal?: string }; currentMilestoneData: { index: number; title: string; narrative: string; choices: { id: string; label: string }[] } | null; hints: { id: number; hintType: string; text: string; price: { attribute: string; tier: string; count: number; milestone?: number; bonus?: number } }[] };
type AppTab = 'templates' | 'today' | 'cards' | 'stats' | 'adventure';
type AdventureOutcome =
  | { kind: 'attempt'; outcome?: string; milestone?: number; narrative?: string; explanation?: string; reveal?: string; chapterCompleted?: boolean }
  | { kind: 'hint'; hintType?: string; text?: string; totalMilestoneBonus?: number };

const API_BASE = 'http://localhost:3001';
const ATTRIBUTE_OPTIONS = ['Physique', 'Charisma', 'Wisdom', 'Sociability', 'Wealth', 'Survival'];
const TIER_OPTIONS = ['Paper', 'Rock', 'Bronze', 'Silver', 'Gold'];
const formatLocalDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayIso = formatLocalDate(new Date());
const tierClassName = (tier: string) => `tier-${tier.toLowerCase()}`;
const getCardImageUrl = (attribute: string, tier: string) => {
  const normalizedTier = tier.toLowerCase();
  return cardImageModules[`../../cards/${attribute}_${normalizedTier}.png`] ?? '';
};
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
  const [forgeMessage, setForgeMessage] = useState('');
  const [newTemplate, setNewTemplate] = useState({ title: '', cadenceRule: 'daily', attribute: 'Physique', baseTier: 'Paper' });
  const [newOneOff, setNewOneOff] = useState({ title: '', attribute: 'Wisdom', baseTier: 'Paper' });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [statsMessage, setStatsMessage] = useState('');
  const [adventures, setAdventures] = useState<AdventureListItem[]>([]);
  const [selectedAdventure, setSelectedAdventure] = useState<AdventureDetail | null>(null);
  const [adventureMessage, setAdventureMessage] = useState('');
  const [lastOutcome, setLastOutcome] = useState<AdventureOutcome | null>(null);
  const [isHintDrawerOpen, setIsHintDrawerOpen] = useState(true);
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

  const forgeCards = async (attribute: string, tier: string, count: number) => {
    if (tier === 'Gold' || count < 3) return;
    setForgeMessage('');
    const res = await fetch(`${API_BASE}/api/cards/forge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attribute, tier }),
    });
    const data = await res.json();
    if (!res.ok) return setForgeMessage(data.error ?? 'Merge failed');
    setForgeMessage(`Merged 3 ${attribute} ${tier} cards into 1 ${data.producedTier} card.`);
    await loadData();
  };

  const openAdventure = async (id: number, clearMessage = true) => {
    const res = await fetch(`${API_BASE}/api/adventures/${id}`);
    const data = await res.json();
    if (!res.ok) return setAdventureMessage(data.error ?? 'Could not load chapter');
    setSelectedAdventure(data);
    if (clearMessage) {
      setAdventureMessage('');
      setLastOutcome(null);
    }
  };

  const attemptChoice = async (choiceId: string) => {
    if (!selectedAdventure) return;
    const res = await fetch(`${API_BASE}/api/adventures/${selectedAdventure.id}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceId }),
    });
    const data = await res.json();
    if (res.ok) {
      setAdventureMessage('');
      setLastOutcome({
        kind: 'attempt',
        outcome: data.outcome,
        milestone: data.milestone,
        narrative: data.narrative,
        explanation: data.explanation,
        reveal: data.reveal,
        chapterCompleted: data.chapterCompleted,
      });
    } else {
      setAdventureMessage(data.error ?? 'Attempt failed');
    }
    await loadData();
    await openAdventure(selectedAdventure.id, false);
  };

  const buyHint = async (hintId: number) => {
    if (!selectedAdventure) return;
    const res = await fetch(`${API_BASE}/api/adventures/${selectedAdventure.id}/hints/${hintId}/purchase`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setAdventureMessage('');
      setLastOutcome({
        kind: 'hint',
        hintType: data.hint.hintType,
        text: data.hint.text,
        totalMilestoneBonus: data.totalMilestoneBonus,
      });
    } else {
      setAdventureMessage(data.error ?? 'Hint purchase failed');
    }
    await loadData();
  };

  const ownedCards = inventory.flatMap((group) =>
    group.tiers
      .filter((tierInfo) => tierInfo.count > 0)
      .map((tierInfo) => ({
        attribute: group.attribute,
        tier: tierInfo.tier,
        count: tierInfo.count,
        imageUrl: getCardImageUrl(group.attribute, tierInfo.tier),
      })),
  );

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
          <p>Merge rule: double-click any non-Gold count of 3+ in the table to turn 3 same attribute+tier cards into 1 card of the next tier.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Attribute</th>{TIER_OPTIONS.map((tier) => <th key={tier}>{tier}</th>)}</tr></thead>
            <tbody>
              {inventory.map((row) => (
                <tr key={row.attribute}>
                  <td>{row.attribute}</td>
                  {row.tiers.map((tierInfo) => {
                    const canMerge = tierInfo.tier !== 'Gold' && tierInfo.count >= 3;
                    return (
                      <td key={`${row.attribute}-${tierInfo.tier}`}>
                        <span
                          aria-label={`${row.attribute} ${tierInfo.tier} count ${tierInfo.count}${canMerge ? ', double-click to merge' : ''}`}
                          className={`card-count ${tierClassName(tierInfo.tier)} ${canMerge ? 'is-mergeable' : ''}`}
                          onDoubleClick={() => forgeCards(row.attribute, tierInfo.tier, tierInfo.count)}
                        >
                          {tierInfo.count}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                      <div className="stat-summary">
                        <div className="stat-title-row">
                          <strong>{stat.attribute}</strong>
                          <span className="stat-level-badge"><span>Level</span><b>{stat.level}</b></span>
                        </div>
                        <span className="stat-progress-text">{stat.progressGold}/{stat.neededGold} Gold</span>
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
        <div className="adventure-layout">
          <aside className="chapter-selector" aria-label="Chapter selector">
            <div className="adventure-section-heading">
              <p className="eyebrow">Chapter selector</p>
              <h3>Case chapters</h3>
            </div>
            <div className="chapter-list">
              {adventures.map((adventure) => {
                const isLocked = adventure.status === 'LOCKED';
                const isSelected = selectedAdventure?.id === adventure.id;
                return (
                  <article className={`chapter-card ${isLocked ? 'is-locked' : ''} ${isSelected ? 'is-selected' : ''}`} key={adventure.id}>
                    <div className="chapter-card__body">
                      <div className="chapter-card__meta">
                        <span className={`status-pill ${isLocked ? 'status-muted' : 'status-active'}`}>{isLocked ? 'Locked' : adventure.status}</span>
                        <span className="difficulty-badge">Difficulty {adventure.difficulty}</span>
                      </div>
                      <h4>Chapter {adventure.chapter}: {adventure.title}</h4>
                      {isLocked && <p className="lock-helper">Progress further to unlock this chapter.</p>}
                    </div>
                    <button className={isLocked ? 'button-secondary' : ''} disabled={isLocked} onClick={() => openAdventure(adventure.id)}>
                      {isLocked ? 'Locked' : isSelected ? 'Open now' : 'Open'}
                    </button>
                  </article>
                );
              })}
            </div>
          </aside>

          <div className="adventure-case-column">
            {!selectedAdventure && (
              <article className="case-empty-state">
                <p className="eyebrow">No active case</p>
                <h3>Select an unlocked chapter to open its case file.</h3>
                <p>Locked chapters will become available as you progress through the adventure.</p>
              </article>
            )}

            {selectedAdventure && (
              <article className="case-file">
                <section className="case-overview">
                  <div className="case-header">
                    <span className="status-pill status-active">Chapter {selectedAdventure.chapter}</span>
                    {selectedAdventure.chapterCompleted && <span className="status-pill status-active">Case closed</span>}
                    <h3>{selectedAdventure.title}</h3>
                  </div>
                  <p>{selectedAdventure.branches.intro}</p>
                </section>

                <section className={`milestone-card ${selectedAdventure.chapterCompleted ? 'is-complete' : ''}`}>
                  <div className="milestone-progress-header">
                    <div>
                      <p className="eyebrow">{selectedAdventure.chapterCompleted ? 'Completed chapter' : `Current milestone ${selectedAdventure.currentMilestone}`}</p>
                      <h4>{selectedAdventure.currentMilestoneData?.title ?? 'Case closed'}</h4>
                    </div>
                    <div className="milestone-stepper" aria-label={`Current milestone ${selectedAdventure.currentMilestone}`}>
                      {[1, 2, 3, 4, 5].map((step) => (
                        <span
                          className={`milestone-dot ${step < selectedAdventure.currentMilestone || selectedAdventure.chapterCompleted ? 'is-complete' : ''} ${step === selectedAdventure.currentMilestone && !selectedAdventure.chapterCompleted ? 'is-current' : ''}`}
                          key={step}
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedAdventure.currentMilestoneData?.narrative && <p>{selectedAdventure.currentMilestoneData.narrative}</p>}
                  {selectedAdventure.chapterCompleted && selectedAdventure.branches.finalReveal && (
                    <div className="case-closed-note">
                      <strong>Final reveal</strong>
                      <p>{selectedAdventure.branches.finalReveal}</p>
                    </div>
                  )}
                </section>

                <section className="choice-panel">
                  <div className="adventure-section-heading">
                    <p className="eyebrow">Choose your lead</p>
                    <h4>Milestone choices</h4>
                  </div>
                  <div className="choice-grid adventure-choice-grid">
                    {(selectedAdventure.currentMilestoneData?.choices ?? []).map((choice) => (
                      <button className="choice-card" disabled={selectedAdventure.chapterCompleted} key={choice.id} onClick={() => attemptChoice(choice.id)}>
                        <span>{choice.label}</span>
                      </button>
                    ))}
                    {selectedAdventure.chapterCompleted && (
                      <div className="case-closed-choice">This chapter is complete. The case file is closed.</div>
                    )}
                  </div>
                </section>

                <section className={`hint-drawer ${isHintDrawerOpen ? 'is-open' : ''}`}>
                  <button className="hint-drawer__summary" type="button" onClick={() => setIsHintDrawerOpen((open) => !open)} aria-expanded={isHintDrawerOpen}>
                    <span>
                      <span className="eyebrow">Optional support</span>
                      <strong>Hint drawer</strong>
                    </span>
                    <span className="hint-drawer__count">{selectedAdventure.hints.length} available</span>
                  </button>
                  {isHintDrawerOpen && (
                    <div className="hint-drawer__body">
                      <p>Each hint adds to your success chance on its milestone. Example: +5% means success chance increases by 5 percentage points. Hint bonuses stack additively, and you need zero fixed hints — buy as many as you want for better odds.</p>
                      <div className="hint-list">
                        {selectedAdventure.hints.map((hint) => (
                          <article className="hint-card" key={hint.id}>
                            <div className="hint-card__copy">
                              <strong>{hint.hintType}</strong>
                              <span>Trade cards to reveal this hint.</span>
                            </div>
                            <div className="hint-card__meta">
                              <span className="hint-badge">M{hint.price.milestone ?? '?'}</span>
                              <span className="hint-badge">{hint.price.count} {hint.price.attribute}/{hint.price.tier}</span>
                              <span className="hint-badge hint-badge--bonus">+{Math.round((hint.price.bonus ?? 0) * 100)}%</span>
                              <button className="button-secondary" onClick={() => buyHint(hint.id)}>Buy</button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </article>
            )}

            {(lastOutcome || adventureMessage) && (
              <article className={`outcome-card ${adventureMessage ? 'is-error' : ''}`}>
                <p className="eyebrow">Latest result</p>
                {adventureMessage && (
                  <>
                    <h3>Adventure notice</h3>
                    <p>{adventureMessage}</p>
                  </>
                )}
                {lastOutcome?.kind === 'attempt' && (
                  <>
                    <div className="outcome-card__header">
                      <h3>{lastOutcome.outcome ? `${lastOutcome.outcome.toUpperCase()} outcome` : 'Choice outcome'}</h3>
                      {lastOutcome.milestone && <span className="status-pill status-muted">Milestone {lastOutcome.milestone}</span>}
                    </div>
                    {lastOutcome.narrative && <p>{lastOutcome.narrative}</p>}
                    {lastOutcome.explanation && <p className="outcome-explanation">{lastOutcome.explanation}</p>}
                    {lastOutcome.chapterCompleted && lastOutcome.reveal && (
                      <div className="final-reveal">
                        <strong>Final reveal</strong>
                        <p>{lastOutcome.reveal}</p>
                      </div>
                    )}
                  </>
                )}
                {lastOutcome?.kind === 'hint' && (
                  <>
                    <div className="outcome-card__header">
                      <h3>{lastOutcome.hintType ? `${lastOutcome.hintType.toUpperCase()} hint purchased` : 'Hint purchased'}</h3>
                      <span className="status-pill status-muted">Bonus +{Math.round((lastOutcome.totalMilestoneBonus ?? 0) * 100)}%</span>
                    </div>
                    {lastOutcome.text && <p>{lastOutcome.text}</p>}
                  </>
                )}
              </article>
            )}
          </div>
        </div>
      </section>
      )}

      <aside className="floating-card-pool" aria-label="Owned card pool">
        <div className="floating-card-pool__header">
          <span className="eyebrow">Card Pool</span>
          <span>{ownedCards.length ? `${ownedCards.length} owned stacks` : 'No cards yet'}</span>
        </div>
        <div className="floating-card-pool__row">
          {ownedCards.map((card) => (
            <article
              aria-label={`${card.attribute} ${card.tier} card, count ${card.count}`}
              className="floating-card"
              key={`${card.attribute}-${card.tier}`}
              tabIndex={0}
            >
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={`${card.attribute} ${card.tier} card`} />
              ) : (
                <div className="floating-card__missing-art" aria-hidden="true">{card.attribute.slice(0, 1)}{card.tier.slice(0, 1)}</div>
              )}
              <span className="floating-card__count">x{card.count}</span>
            </article>
          ))}
        </div>
      </aside>
    </main>
  );
}
