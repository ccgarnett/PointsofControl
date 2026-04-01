import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockLogin = jest.fn();

beforeEach(() => {
  mockLogin.mockClear();
  mockUseAuth.mockReturnValue({ token: null, user: null, login: mockLogin, logout: jest.fn() });
});

describe('Login component', () => {
  it('renders username-or-email label, password field, and submit button', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows a Register link', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('calls login() and navigates to /dashboard on successful submit', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: 'tok', user: { id: '1', username: 'chase', role: 'Admin' } }),
    }) as jest.Mock;

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
    await userEvent.type(screen.getByRole('textbox'), 'chase');
    await userEvent.type(screen.getByDisplayValue(''), 'Chase@POC1');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('tok', { id: '1', username: 'chase', role: 'Admin' });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('shows an error message when credentials are invalid', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Invalid credentials' }),
    }) as jest.Mock;

    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByRole('textbox'), 'chase');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('disables the submit button while loading', async () => {
    let resolve: any;
    global.fetch = jest.fn().mockReturnValue(new Promise((r) => { resolve = r; })) as jest.Mock;

    render(<MemoryRouter><Login /></MemoryRouter>);
    await userEvent.type(screen.getByRole('textbox'), 'chase');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    resolve({ ok: true, json: () => Promise.resolve({ token: 't', user: { id: '1', username: 'chase', role: 'Admin' } }) });
  });
});
