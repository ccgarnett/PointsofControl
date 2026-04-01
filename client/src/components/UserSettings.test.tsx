import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserSettings from './UserSettings';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockLogout = jest.fn();

beforeEach(() => {
  mockLogout.mockClear();
  mockUseAuth.mockReturnValue({
    token: 'test-token',
    user: { id: 'uid1', username: 'chase', role: 'User' },
    login: jest.fn(),
    logout: mockLogout,
  } as any);
});

const renderUserSettings = () =>
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('UserSettings component', () => {
  it('renders the Account Settings heading', () => {
    renderUserSettings();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('renders Save, Update Account, and Delete Account buttons', () => {
    renderUserSettings();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });

  it('shows inline mismatch warning when passwords differ', async () => {
    renderUserSettings();
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'Password1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Different1');
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows error status on submit when passwords do not match', async () => {
    renderUserSettings();
    await userEvent.type(screen.getByLabelText(/^new password$/i), 'Password1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Different1');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match\./i)).toBeInTheDocument();
    });
  });

  it('shows success status on successful save', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    }) as jest.Mock;

    renderUserSettings();
    await userEvent.type(screen.getByLabelText(/^name$/i), 'Chase');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
    });
  });

  it('shows error status when save request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Server error' }),
    }) as jest.Mock;

    renderUserSettings();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  it('shows success status after Update Account succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    }) as jest.Mock;

    renderUserSettings();
    await userEvent.click(screen.getByRole('button', { name: /update account/i }));

    await waitFor(() => {
      expect(screen.getByText(/update completed/i)).toBeInTheDocument();
    });
  });

  it('calls logout and navigates to /login on account deletion', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    }) as jest.Mock;
    window.confirm = jest.fn().mockReturnValue(true);

    renderUserSettings();
    await userEvent.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('does not delete account when confirmation is cancelled', async () => {
    window.confirm = jest.fn().mockReturnValue(false);
    global.fetch = jest.fn() as jest.Mock;

    renderUserSettings();
    await userEvent.click(screen.getByRole('button', { name: /delete account/i }));

    expect(mockLogout).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows error status when deletion request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Failed to delete account.' }),
    }) as jest.Mock;
    window.confirm = jest.fn().mockReturnValue(true);

    renderUserSettings();
    await userEvent.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to delete account/i)).toBeInTheDocument();
    });
  });
});
