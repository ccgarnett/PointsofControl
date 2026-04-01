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

  useEffect(() => {
    document.title = 'Points of Control — Calendar';
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch(`/api/calendar/tasks?week=${toLocalDateStr(monday)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          setError('Failed to load tasks');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load calendar');
        setLoading(false);
      });
  }, [monday, token]);

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
                  </div>
                  <div className="calendar-task-list">
                    {dayTasks.length === 0 ? (
                      <p className="calendar-empty">No tasks</p>
                    ) : (
                      dayTasks.map((t) => (
                        <div
                          key={t._id}
                          className={`calendar-task${t.completed ? ' calendar-task--done' : ''}`}
                          title={t.description}
                        >
                          <span className="calendar-task-check">{t.completed ? '✓' : '○'}</span>
                          <span className="calendar-task-title">{t.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Calendar;
