import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type Task = {
  _id: string;
  user_id: string;
  dateKey: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

const localDateConversion = (localDate: Date) => {
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function apiFetch<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message =
      typeof body === 'object' && body && 'message' in (body as any) ? String((body as any).message) : String(body);
    throw new Error(message || `Request failed (${res.status})`);
  }
  return body as T;
}


const DailyChecklist: React.FC = () => {
  const { token } = useAuth();

  const dateKey = useMemo(() => localDateConversion(new Date()), []);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [inputDesc, setInputDesc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const readTasks = async () => {
    if (!token) return;
    const data = await apiFetch<Task[]>(`/api/checklist?date=${encodeURIComponent(dateKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTasks(data);
  };

  const loadTasks = async () => {
    if (!token) return;
    setError(null);
    await readTasks();
  };

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        await loadTasks();
      } catch (e: any) {
        setError(e?.message || 'Failed to load tasks');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dateKey]);

  const createTask = async () => {
    if (!token) return;
    const description = inputDesc.trim();
    if (!description) return;
    setIsBusy(true);
    setError(null);
    try {
      const created = await apiFetch<Task>(`/api/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description, dateKey }),
      });
      setTasks((prev) => [...prev, created]);
      setInputDesc('');
    } catch (e: any) {
      setError(e?.message || 'Failed to create task');
    } finally {
      setIsBusy(false);
    }
  };

  const deleteTask = async (task_id: string) => {
    if (!token) return;
    setIsBusy(true);
    setError(null);
    try {
      await apiFetch<{ message: string }>(`/api/checklist/${encodeURIComponent(task_id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((t) => t._id !== task_id));
    } catch (e: any) {
      setError(e?.message || 'Failed to delete task');
    } finally {
      setIsBusy(false);
    }
  };

  const updateTask = async (task_id: string, update: Partial<Pick<Task, 'description' | 'completed'>>) => {
    if (!token) return;
    setIsBusy(true);
    setError(null);
    try {
      const updated = await apiFetch<Task>(`/api/checklist/${encodeURIComponent(task_id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(update),
      });
      setTasks((prev) => prev.map((t) => (t._id === task_id ? updated : t)));
    } catch (e: any) {
      setError(e?.message || 'Failed to update task');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="checklist-section">
      <h2>Checklist</h2>
      <div className="checklist-inner">
        <div className="input-row">
          <button type="button" onClick={() => void createTask()} disabled={!token || isBusy}>
            +
          </button>
          <input
            id="task-item"
            placeholder="add"
            value={inputDesc}
            onChange={(e) => setInputDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void createTask();
            }}
            disabled={!token || isBusy}
          />
        </div>

        {error ? <p role="alert">{error}</p> : null}
        {!token ? <p>Please log in to view your checklist.</p> : null}

        <ul id="checklist-content">
          {tasks.map((t) => (
            <li key={t._id}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => void updateTask(t._id, { completed: !t.completed })}
                  disabled={isBusy}
                />
                <span>{t.description}</span>
              </label>
              <button type="button" onClick={() => void deleteTask(t._id)} disabled={isBusy}>
                x
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default DailyChecklist;
