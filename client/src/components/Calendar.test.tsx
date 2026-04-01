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
