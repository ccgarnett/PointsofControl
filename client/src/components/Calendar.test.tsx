import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Calendar from './Calendar';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    token: 'test-token',
    user: { id: '1', username: 'chase', role: 'User' },
    login: jest.fn(),
    logout: jest.fn(),
  } as any);
});

describe('Calendar component', () => {
  it('renders the Calendar heading', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    expect(screen.getByText(/loading calendar/i)).toBeInTheDocument();
  });

  it('renders week navigation buttons', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    expect(screen.getByText(/prev/i)).toBeInTheDocument();
    expect(screen.getByText(/next/i)).toBeInTheDocument();
    expect(screen.getByText(/today/i)).toBeInTheDocument();
  });

  it('renders 7 day columns after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });
  });

  it('shows "No tasks" for all 7 days when no tasks returned', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => {
      const noTasks = screen.getAllByText('No tasks');
      expect(noTasks.length).toBe(7);
    });
  });

  it('renders a task in the grid when the API returns one for the current week', async () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const d = String(monday.getDate()).padStart(2, '0');
    const taskDateStr = `${y}-${m}-${d}T12:00:00`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([
        { _id: 't1', title: 'Test Task', description: 'desc', date: taskDateStr, completed: false },
      ]),
    }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  it('renders completed task with check mark', async () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const d = String(monday.getDate()).padStart(2, '0');
    const taskDateStr = `${y}-${m}-${d}T12:00:00`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([
        { _id: 't1', title: 'Done Task', date: taskDateStr, completed: true },
      ]),
    }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  it('shows error message when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load calendar/i)).toBeInTheDocument();
    });
  });

  it('shows error message when API returns non-array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ error: 'bad' }),
    }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
    });
  });

  it('navigates to previous week when Prev is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));

    const initialLabel = screen.getByText(/–/).textContent;
    await userEvent.click(screen.getByText(/prev/i));

    await waitFor(() => {
      expect(screen.getByText(/–/).textContent).not.toBe(initialLabel);
    });
  });

  it('navigates to next week when Next is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));

    const initialLabel = screen.getByText(/–/).textContent;
    await userEvent.click(screen.getByText(/next/i));

    await waitFor(() => {
      expect(screen.getByText(/–/).textContent).not.toBe(initialLabel);
    });
  });

  it('returns to current week when Today is clicked after navigating away', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));

    const originalLabel = screen.getByText(/–/).textContent;
    await userEvent.click(screen.getByText(/prev/i));
    await waitFor(() => expect(screen.getByText(/–/).textContent).not.toBe(originalLabel));

    await userEvent.click(screen.getByText(/today/i));
    await waitFor(() => {
      expect(screen.getByText(/–/).textContent).toBe(originalLabel);
    });
  });

  it('does not fetch when token is absent', () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    } as any);
    global.fetch = jest.fn() as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ── Task management (U10b) ────────────────────────────────────────────────

function makeMondayTask() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return {
    dateStr: `${y}-${m}-${d}T12:00:00`,
    task: { _id: 't1', title: 'My Task', date: `${y}-${m}-${d}T12:00:00`, completed: false },
  };
}

describe('Calendar — task management (U10b)', () => {
  it('renders a "+" add button in each day column header', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));
    const addBtns = screen.getAllByTitle('Add task');
    expect(addBtns).toHaveLength(7);
  });

  it('opens the add task modal when "+" is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));
    await userEvent.click(screen.getAllByTitle('Add task')[0]);
    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows validation error when saving with empty title', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));
    await userEvent.click(screen.getAllByTitle('Add task')[0]);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));
    await userEvent.click(screen.getAllByTitle('Add task')[0]);
    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByPlaceholderText('Task title')).not.toBeInTheDocument();
  });

  it('closes the modal when backdrop is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));
    await userEvent.click(screen.getAllByTitle('Add task')[0]);
    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    const backdrop = document.querySelector('.modal-backdrop') as HTMLElement;
    expect(backdrop).toBeInTheDocument();
    await userEvent.click(backdrop);
    expect(screen.queryByPlaceholderText('Task title')).not.toBeInTheDocument();
  });

  it('creates a new task via POST and appends it to the grid', async () => {
    const { task } = makeMondayTask();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(task) }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));

    await userEvent.click(screen.getAllByTitle('Add task')[0]);
    await userEvent.type(screen.getByPlaceholderText('Task title'), 'My Task');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('My Task')).toBeInTheDocument();
    });
  });

  it('sends POST with title, date, and auth header when saving a new task', async () => {
    const { task } = makeMondayTask();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(task) }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mon'));

    await userEvent.click(screen.getAllByTitle('Add task')[0]);
    await userEvent.type(screen.getByPlaceholderText('Task title'), 'My Task');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const postCall = calls.find((c: any[]) => c[1]?.method === 'POST');
      expect(postCall).toBeDefined();
      expect(postCall[0]).toContain('/api/calendar/tasks');
      expect(postCall[1].headers.Authorization).toBe('Bearer test-token');
      expect(JSON.parse(postCall[1].body).title).toBe('My Task');
    });
  });

  it('renders edit (✎) and delete (✕) buttons on existing tasks', async () => {
    const { task } = makeMondayTask();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([task]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('My Task'));
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });

  it('opens edit modal pre-filled with task title when edit button clicked', async () => {
    const { task } = makeMondayTask();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([task]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('My Task'));

    await userEvent.click(screen.getByTitle('Edit'));
    const input = screen.getByPlaceholderText('Task title') as HTMLInputElement;
    expect(input.value).toBe('My Task');
    expect(screen.getByText(/edit task/i)).toBeInTheDocument();
  });

  it('sends PATCH with updated title when edit modal is saved', async () => {
    const { task } = makeMondayTask();
    const updated = { ...task, title: 'Updated Task' };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([task]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(updated) }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('My Task'));

    await userEvent.click(screen.getByTitle('Edit'));
    const input = screen.getByPlaceholderText('Task title') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated Task');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const patchCall = calls.find((c: any[]) => c[1]?.method === 'PATCH');
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall[1].body).title).toBe('Updated Task');
    });
  });

  it('shows inline confirm when delete button is clicked', async () => {
    const { task } = makeMondayTask();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([task]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('My Task'));

    await userEvent.click(screen.getByTitle('Delete'));
    // Confirm buttons should appear
    const confirmYes = screen.getByRole('button', { name: '✓' });
    const confirmNo = screen.getByRole('button', { name: '✕' });
    expect(confirmYes).toBeInTheDocument();
    expect(confirmNo).toBeInTheDocument();
  });

  it('cancels delete when "✕" confirm button clicked', async () => {
    const { task } = makeMondayTask();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([task]) }) as jest.Mock;
    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('My Task'));

    await userEvent.click(screen.getByTitle('Delete'));
    await userEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.getByText('My Task')).toBeInTheDocument();
  });

  it('deletes task after delete confirm "✓" is clicked', async () => {
    const { task } = makeMondayTask();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([task]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ message: 'task deleted' }) }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('My Task'));

    await userEvent.click(screen.getByTitle('Delete'));
    await userEvent.click(screen.getByRole('button', { name: '✓' }));

    await waitFor(() => {
      expect(screen.queryByText('My Task')).not.toBeInTheDocument();
    });
  });

  it('sends DELETE request with auth header when task is deleted', async () => {
    const { task } = makeMondayTask();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([task]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ message: 'task deleted' }) }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('My Task'));

    await userEvent.click(screen.getByTitle('Delete'));
    await userEvent.click(screen.getByRole('button', { name: '✓' }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const delCall = calls.find((c: any[]) => c[1]?.method === 'DELETE');
      expect(delCall).toBeDefined();
      expect(delCall[0]).toContain(`/api/calendar/tasks/${task._id}`);
      expect(delCall[1].headers.Authorization).toBe('Bearer test-token');
    });
  });

  it('toggles task completion when check button is clicked', async () => {
    const { task } = makeMondayTask();
    const completedTask = { ...task, completed: true };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([task]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(completedTask) }) as jest.Mock;

    render(<MemoryRouter><Calendar /></MemoryRouter>);
    await waitFor(() => screen.getByText('My Task'));

    const checkBtn = screen.getByTitle('Mark complete');
    await userEvent.click(checkBtn);

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const patchCall = calls.find((c: any[]) => c[1]?.method === 'PATCH');
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall[1].body)).toEqual({ completed: true });
    });
  });
});
