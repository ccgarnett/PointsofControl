import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

interface CalendarTask {
  _id: string;
  title: string;
  description?: string;
  date: string;
  completed: boolean;
}

type ModalMode = 'add' | 'edit';

interface ModalState {
  mode: ModalMode;
  dateKey: string;         // for 'add'
  task?: CalendarTask;     // for 'edit'
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const left = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const right = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${left} – ${right}`;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Calendar: React.FC = () => {
  const { token } = useAuth();
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<ModalState | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Points of Control — Calendar';
  }, []);

  const fetchTasks = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`/api/calendar/tasks?week=${toLocalDateStr(monday)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
        else setError('Failed to load tasks');
        setLoading(false);
      })
      .catch(() => { setError('Failed to load calendar'); setLoading(false); });
  };

  useEffect(() => { fetchTasks(); }, [monday, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPrev = () =>
    setMonday((m) => { const d = new Date(m); d.setDate(m.getDate() - 7); return d; });

  const goToNext = () =>
    setMonday((m) => { const d = new Date(m); d.setDate(m.getDate() + 7); return d; });

  const goToToday = () => setMonday(getMonday(new Date()));

  // Group tasks by local date string
  const tasksByDay: Record<string, CalendarTask[]> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    tasksByDay[toLocalDateStr(d)] = [];
  }
  tasks.forEach((t) => {
    const key = toLocalDateStr(new Date(t.date));
    if (tasksByDay[key]) tasksByDay[key].push(t);
  });

  const todayStr = toLocalDateStr(new Date());

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openAdd = (dateKey: string) => {
    setModal({ mode: 'add', dateKey });
    setFormTitle('');
    setFormDesc('');
    setFormError(null);
  };

  const openEdit = (task: CalendarTask) => {
    setModal({ mode: 'edit', dateKey: toLocalDateStr(new Date(task.date)), task });
    setFormTitle(task.title);
    setFormDesc(task.description ?? '');
    setFormError(null);
  };

  const closeModal = () => { setModal(null); setFormSaving(false); setFormError(null); };

  const handleSave = async () => {
    if (!formTitle.trim()) { setFormError('Title is required'); return; }
    if (!modal || !token) return;
    setFormSaving(true);
    setFormError(null);
    try {
      if (modal.mode === 'add') {
        const res = await fetch('/api/calendar/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: formTitle.trim(), description: formDesc.trim() || undefined, date: modal.dateKey }),
        });
        if (!res.ok) throw new Error();
        const created: CalendarTask = await res.json();
        setTasks((prev) => [...prev, created]);
      } else if (modal.mode === 'edit' && modal.task) {
        const res = await fetch(`/api/calendar/tasks/${modal.task._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: formTitle.trim(), description: formDesc.trim() || undefined }),
        });
        if (!res.ok) throw new Error();
        const updated: CalendarTask = await res.json();
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      }
      closeModal();
    } catch {
      setFormError('Failed to save task');
      setFormSaving(false);
    }
  };

  const handleToggle = async (task: CalendarTask) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/calendar/tasks/${task._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) return;
      const updated: CalendarTask = await res.json();
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/calendar/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setConfirmDeleteId(null);
    } catch { /* silent */ }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Calendar</h2>
        </header>

        <div className="calendar-nav">
          <button className="cal-nav-btn" onClick={goToPrev}>← Prev</button>
          <span className="cal-week-label">{formatWeekRange(monday)}</span>
          <button className="cal-nav-btn" onClick={goToNext}>Next →</button>
          <button className="cal-today-btn" onClick={goToToday}>Today</button>
        </div>

        {loading ? (
          <p className="muted">Loading calendar…</p>
        ) : error ? (
          <p style={{ color: '#ef4444' }}>{error}</p>
        ) : (
          <div className="calendar-grid">
            {DAY_NAMES.map((dayName, i) => {
              const day = new Date(monday);
              day.setDate(monday.getDate() + i);
              const key = toLocalDateStr(day);
              const dayTasks = tasksByDay[key] || [];
              const isToday = key === todayStr;

              return (
                <div key={key} className={`calendar-day${isToday ? ' calendar-day--today' : ''}`}>
                  <div className="calendar-day-header">
                    <span className="calendar-day-name">{dayName}</span>
                    <span className={`calendar-day-date${isToday ? ' calendar-day-date--today' : ''}`}>
                      {day.getDate()}
                    </span>
                    <button
                      className="cal-add-btn"
                      onClick={() => openAdd(key)}
                      title="Add task"
                    >+</button>
                  </div>
                  <div className="calendar-task-list">
                    {dayTasks.length === 0 ? (
                      <p className="calendar-empty">No tasks</p>
                    ) : (
                      dayTasks.map((t) => (
                        <div
                          key={t._id}
                          className={`calendar-task${t.completed ? ' calendar-task--done' : ''}`}
                        >
                          <button
                            className="calendar-task-check-btn"
                            onClick={() => handleToggle(t)}
                            title={t.completed ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {t.completed ? '✓' : '○'}
                          </button>
                          <span className="calendar-task-title" title={t.description}>{t.title}</span>
                          <div className="calendar-task-actions">
                            <button className="cal-task-edit-btn" onClick={() => openEdit(t)} title="Edit">✎</button>
                            {confirmDeleteId === t._id ? (
                              <>
                                <button className="btn-confirm-yes" onClick={() => handleDelete(t._id)}>✓</button>
                                <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>✕</button>
                              </>
                            ) : (
                              <button className="cal-task-del-btn" onClick={() => setConfirmDeleteId(t._id)} title="Delete">✕</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Modal ─────────────────────────────────────────────────────────── */}
        {modal && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">
                {modal.mode === 'add' ? `Add Task — ${modal.dateKey}` : 'Edit Task'}
              </h3>
              {formError && <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>{formError}</p>}
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Task title"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Add details…"
                  rows={2}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn-submit" onClick={handleSave} disabled={formSaving}>
                  {formSaving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn-remove" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Calendar;
