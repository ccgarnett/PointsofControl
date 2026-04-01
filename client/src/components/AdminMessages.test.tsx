import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminMessages from './AdminMessages';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (role: string | null, id = 'uid1') =>
  ({
    token: role ? 'test.token' : null,
    user: role ? { id, username: 'chase', role } : null,
    login: jest.fn(),
    logout: jest.fn(),
  } as any);

const mockMessages = [
  {
    _id: 'm1',
    content: 'Hello team!',
    postedBy: 'chase',
    reactions: [],
    acknowledgedBy: [],
    createdAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  mockUseAuth.mockReturnValue(makeAuth('User'));
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(mockMessages),
  }) as jest.Mock;
});

describe('AdminMessages — reactions & acknowledge', () => {
  it('renders reaction buttons under each message', async () => {
    render(<MemoryRouter><AdminMessages /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Hello team!')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /👍/u })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /❤️/u })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /👏/u })).toBeInTheDocument();
  });

  it('shows Acknowledge button for non-admin logged-in user on unacknowledged post', async () => {
    render(<MemoryRouter><AdminMessages /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Hello team!')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
  });

  it('shows ✓ Acknowledged when user has already acknowledged', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([{ ...mockMessages[0], acknowledgedBy: ['uid1'] }]),
    }) as jest.Mock;

    render(<MemoryRouter><AdminMessages /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/✓ Acknowledged/)).toBeInTheDocument());
  });

  it('sends a react request with correct type and auth header when reaction button clicked', async () => {
    const updatedMsg = { ...mockMessages[0], reactions: [{ userId: 'uid1', type: '👍' }] };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockMessages) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(updatedMsg) }) as jest.Mock;

    render(<MemoryRouter><AdminMessages /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Hello team!')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /👍/u }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const reactCall = calls.find((c: any[]) => c[0].includes('/react'));
      expect(reactCall).toBeDefined();
      expect(reactCall[1].headers.Authorization).toBe('Bearer test.token');
      expect(JSON.parse(reactCall[1].body)).toEqual({ type: '👍' });
    });
  });

  it('sends an acknowledge request with auth header when Acknowledge clicked', async () => {
    const updatedMsg = { ...mockMessages[0], acknowledgedBy: ['uid1'] };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockMessages) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(updatedMsg) }) as jest.Mock;

    render(<MemoryRouter><AdminMessages /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /acknowledge/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const ackCall = calls.find((c: any[]) => c[0].includes('/acknowledge'));
      expect(ackCall).toBeDefined();
      expect(ackCall[1].headers.Authorization).toBe('Bearer test.token');
    });
  });

  it('adds post-unread class to unacknowledged posts for logged-in users', async () => {
    render(<MemoryRouter><AdminMessages /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Hello team!')).toBeInTheDocument());
    const card = screen.getByText('Hello team!').closest('.module-block');
    expect(card).toHaveClass('post-unread');
  });

  it('does not show Acknowledge button for admins', async () => {
    mockUseAuth.mockReturnValue(makeAuth('Admin'));
    render(<MemoryRouter><AdminMessages /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Hello team!')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /acknowledge/i })).not.toBeInTheDocument();
  });

  it('reaction buttons are disabled when user is not logged in', async () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(<MemoryRouter><AdminMessages /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Hello team!')).toBeInTheDocument());
    const reactionBtns = screen.getAllByRole('button', { name: /👍|❤️|👏/u });
    reactionBtns.forEach((btn) => expect(btn).toBeDisabled());
  });
});
