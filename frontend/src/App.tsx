export function App() {
  const phases = [
    '1) Scaffolding complete',
    '2) DB schema and migrations (next)',
    '3) Task Templates + Today Board',
    '4) Cards + Forge',
    '5) Hero/Buddy stats',
    '6) Adventure system',
    '7) Polish + README for non-technical users',
  ];

  return (
    <main className="container">
      <h1>Hero Habit Forge</h1>
      <p>Local-first MVP is being built in small phases.</p>
      <ul>
        {phases.map((phase) => (
          <li key={phase}>{phase}</li>
        ))}
      </ul>
    </main>
  );
}
