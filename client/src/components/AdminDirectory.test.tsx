import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminDirectory from './AdminDirectory';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUsers = [
  { _id: 'uid1', username: 'chase', email: 'chase@poc.com', role: 'Admin' },
  { _id: 'uid2', username: 'nyrique', email: 'nyrique@poc.com', role: 'Admin' },
  { _id: 'uid3', username: 'testuser', email: 'test@poc.com', role: 'User' },
];

describe('AdminDirectory', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      token: 'abc',
      user: { id: 'uid1', username: 'chase', role: 'Admin' },
      login: jest.fn(),
      logout: jest.fn(),
    } as any);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUsers),
    }) as jest.Mock;
  });

  it('renders all usernames in the table', async () => {
    render(<MemoryRouter><AdminDirectory /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('chase')).toBeInTheDocument();
      expect(screen.getByText('nyrique')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  it('shows an empty state when no users exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    });
    render(<MemoryRouter><AdminDirectory /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  it('does not show action buttons for the current user\'s own row', async () => {
    render(<MemoryRouter><AdminDirectory /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('chase')).toBeInTheDocument());
    // 3 users but current user (chase/uid1) has no actions — so 2 role toggle buttons
    const roleButtons = screen.getAllByRole('button', { name: /make admin|make user/i });
    expect(roleButtons.length).toBe(2);
  });

  it('calls PUT /api/users/:id with the toggled role when Make Admin is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockUsers) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockUsers) });

    render(<MemoryRouter><AdminDirectory /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('testuser')).toBeInTheDocument());

    const makeAdminBtn = screen.getByRole('button', { name: /make admin/i });
    await userEvent.click(makeAdminBtn);

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const putCall = calls.find((c: any[]) => c[1]?.method === 'PUT');
      expect(putCall).toBeDefined();
      expect(JSON.parse(putCall[1].body)).toMatchObject({ role: 'Admin' });
    });
  });

  it('shows inline confirm when Remove is clicked', async () => {
    render(<MemoryRouter><AdminDirectory /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('testuser')).toBeInTheDocument());
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[0]);
    expect(screen.getByText(/remove\?/i)).toBeInTheDocument();
  });

  it('calls DELETE /api/users/:id when confirmed', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockUsers) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({}) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockUsers) });

    render(<MemoryRouter><AdminDirectory /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('testuser')).toBeInTheDocument());

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await userEvent.click(removeButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: /^yes$/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const deleteCall = calls.find((c: any[]) => c[1]?.method === 'DELETE');
      expect(deleteCall).toBeDefined();
    });
  });
});
