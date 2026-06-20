import { useState, useMemo } from "react";

const HABITS_INIT = [
  { id: 1, name: "Exercise", schedule: "daily", color: "#f97316" },
  { id: 2, name: "Read", schedule: "daily", color: "#8b5cf6" },
  { id: 3, name: "Meditate", schedule: "weekdays", color: "#06b6d4" },
  { id: 4, name: "Journal", schedule: "daily", color: "#10b981" },
];

function generateLogs(habitId) {
  const logs = {};
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    logs[key] = Math.random() > (i < 14 ? 0.15 : 0.35);
  }
  return logs;
}

const INIT_LOGS = {};
HABITS_INIT.forEach(h => { INIT_LOGS[h.id] = generateLogs(h.id); });

function getDateKey(d) { return d.toISOString().slice(0, 10); }

function calcStreaks(logs, schedule) {
  const today = new Date();
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (schedule === "weekdays" && (dow === 0 || dow === 6)) continue;
    days.push(getDateKey(d));
  }
  let current = 0, longest = 0, streak = 0;
  for (const k of days) {
    if (logs[k]) { streak++; longest = Math.max(longest, streak); }
    else { streak = 0; }
  }
  current = streak;
  return { current, longest };
}

function HeatmapGrid({ logs, color }) {
  const today = new Date();
  const cells = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    cells.push({ key: getDateKey(d), done: !!logs[getDateKey(d)], day: d.getDay() });
  }

  const weeks = [];
  let week = [];
  const firstDay = new Date(today);
  firstDay.setDate(firstDay.getDate() - 89);
  let pad = firstDay.getDay();
  for (let i = 0; i < pad; i++) week.push(null);
  for (const c of cells) {
    week.push(c);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

  return (
    <div style={{ display: "flex", gap: 3 }}>
      {weeks.map((w, wi) => (
        <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {w.map((c, ci) => (
            <div
              key={ci}
              title={c ? `${c.key}: ${c.done ? "done" : "missed"}` : ""}
              style={{
                width: 11, height: 11, borderRadius: 2,
                background: !c ? "transparent" : c.done ? color : "var(--miss)",
                opacity: !c ? 0 : 1,
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [habits, setHabits] = useState(HABITS_INIT);
  const [logs, setLogs] = useState(INIT_LOGS);
  const [activeId, setActiveId] = useState(1);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSched, setNewSched] = useState("daily");

  const todayKey = getDateKey(new Date());
  const activeHabit = habits.find(h => h.id === activeId);
  const activeLogs = logs[activeId] || {};
  const { current, longest } = useMemo(() => calcStreaks(activeLogs, activeHabit?.schedule || "daily"), [activeLogs, activeHabit]);

  const filtered = habits.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

  function toggleToday() {
    setLogs(prev => ({
      ...prev,
      [activeId]: { ...prev[activeId], [todayKey]: !prev[activeId]?.[todayKey] }
    }));
  }

  function addHabit() {
    if (!newName.trim()) return;
    const colors = ["#f97316","#8b5cf6","#06b6d4","#10b981","#ef4444","#f59e0b"];
    const id = Date.now();
    const color = colors[habits.length % colors.length];
    setHabits(prev => [...prev, { id, name: newName.trim(), schedule: newSched, color }]);
    setLogs(prev => ({ ...prev, [id]: generateLogs(id) }));
    setNewName(""); setShowAdd(false); setActiveId(id);
  }

  const completedToday = habits.filter(h => logs[h.id]?.[todayKey]).length;
  const totalStreak = habits.reduce((sum, h) => sum + calcStreaks(logs[h.id] || {}, h.schedule).current, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Inter', system-ui, sans-serif", color: "var(--text)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        :root {
          --bg: #0f1117;
          --surface: #1a1d27;
          --surface2: #22263a;
          --border: #2a2d3e;
          --text: #e2e8f0;
          --muted: #64748b;
          --miss: #1e2130;
          --accent: #f97316;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, color: "#f97316" }}>🔥</span>
          <span style={{ fontWeight: 600, fontSize: 17, color: "var(--text)", letterSpacing: "-0.3px" }}>TrackWise</span>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 10, color: "var(--muted)", fontSize: 14, pointerEvents: "none" }}>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search habits..."
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px 6px 30px", color: "var(--text)", fontSize: 13, width: 200, outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#f97316", lineHeight: 1 }}>{current} 🔥</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>current streak</div>
          </div>
          <div style={{ width: 1, height: 28, background: "var(--border)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#8b5cf6", lineHeight: 1 }}>{longest}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>best streak</div>
          </div>
        </div>
      </header>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "24px 16px", gap: 20 }}>

        {/* SIDEBAR */}
        <aside style={{ width: 220, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase" }}>Habits</span>
            <button onClick={() => setShowAdd(s => !s)} style={{ width: 22, height: 22, borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</button>
          </div>

          {showAdd && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Habit name" onKeyDown={e => e.key === "Enter" && addHabit()}
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", color: "var(--text)", fontSize: 12, outline: "none", marginBottom: 8 }} />
              <select value={newSched} onChange={e => setNewSched(e.target.value)}
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontSize: 12, outline: "none", marginBottom: 8 }}>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
              </select>
              <button onClick={addHabit} style={{ width: "100%", background: "#f97316", border: "none", borderRadius: 6, padding: "6px 0", color: "#fff", fontWeight: 500, fontSize: 12, cursor: "pointer" }}>Add habit</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map(h => {
              const { current: cs } = calcStreaks(logs[h.id] || {}, h.schedule);
              const done = logs[h.id]?.[todayKey];
              return (
                <div key={h.id} onClick={() => setActiveId(h.id)}
                  style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: activeId === h.id ? "var(--surface2)" : "transparent", border: `1px solid ${activeId === h.id ? "var(--border)" : "transparent"}`, display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{cs} day streak</div>
                  </div>
                  {done && <span style={{ fontSize: 12 }}>✓</span>}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, padding: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}>TODAY</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>{completedToday}/{habits.length}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>habits completed</div>
            <div style={{ marginTop: 10, height: 4, background: "var(--border)", borderRadius: 2 }}>
              <div style={{ height: "100%", borderRadius: 2, background: "#f97316", width: `${(completedToday / habits.length) * 100}%`, transition: "width 0.3s" }} />
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {activeHabit && (
            <>
              {/* Habit header */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: activeHabit.color }} />
                  <div>
                    <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>{activeHabit.name}</h1>
                    <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>{activeHabit.schedule}</span>
                  </div>
                </div>
                <button onClick={toggleToday}
                  style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${activeLogs[todayKey] ? activeHabit.color : "var(--border)"}`, background: activeLogs[todayKey] ? activeHabit.color + "22" : "transparent", color: activeLogs[todayKey] ? activeHabit.color : "var(--muted)", fontWeight: 500, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                  {activeLogs[todayKey] ? "✓ Done today" : "Mark done"}
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Current streak", value: `${current} 🔥`, color: "#f97316" },
                  { label: "Best streak", value: longest, color: "#8b5cf6" },
                  { label: "This month", value: `${Object.entries(activeLogs).filter(([k, v]) => v && k.startsWith(new Date().toISOString().slice(0,7))).length}d`, color: activeHabit.color },
                  { label: "All time", value: `${Object.values(activeLogs).filter(Boolean).length}d`, color: "#64748b" },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Heatmap */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Activity — last 90 days</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)" }}>
                    <span>Less</span>
                    {[0.15, 0.35, 0.6, 0.8, 1].map((o, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i === 0 ? "var(--miss)" : activeHabit.color, opacity: o }} />
                    ))}
                    <span>More</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", paddingTop: 4 }}>
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                      <div key={d} style={{ fontSize: 9, color: "var(--muted)", height: 14, lineHeight: "14px" }}>{d}</div>
                    ))}
                  </div>
                  <HeatmapGrid logs={activeLogs} color={activeHabit.color} />
                </div>
              </div>

              {/* Recent log */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>Recent days</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(); d.setDate(d.getDate() - i);
                    const k = getDateKey(d);
                    const dow = d.getDay();
                    const skipped = activeHabit.schedule === "weekdays" && (dow === 0 || dow === 6);
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 6 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: skipped ? "var(--border)" : activeLogs[k] ? activeHabit.color : "var(--miss)", border: `1px solid ${skipped ? "var(--border)" : activeLogs[k] ? activeHabit.color : "#374151"}` }} />
                          <span style={{ fontSize: 13, color: i === 0 ? "var(--text)" : "var(--muted)", fontWeight: i === 0 ? 500 : 400 }}>
                            {i === 0 ? "Today" : i === 1 ? "Yesterday" : d.toLocaleDateString("en-US", { weekday: "long" })}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: skipped ? "var(--muted)" : activeLogs[k] ? activeHabit.color : "#ef4444" }}>
                          {skipped ? "—" : activeLogs[k] ? "Completed" : "Missed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
