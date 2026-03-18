import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Register from './Register';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockLogin = jest.fn();

beforeEach(() => {
  mockLogin.mockClear();
  mockUseAuth.mockReturnValue({ token: null, user: null, login: mockLogin, logout: jest.fn() });
});

describe('Register component', () => {
  it('renders username, email, password, confirm-password fields and submit button', () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('shows a Sign In link back to /login', () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows an error when passwords do not match', async () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/^username$/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls register then login and navigates to /dashboard on success', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ _id: '1', username: 'newuser' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ token: 'tok', user: { id: '1', username: 'newuser', role: 'User' } }),
      }) as jest.Mock;

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/^username$/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('tok', { id: '1', username: 'newuser', role: 'User' });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('shows an error when the username is already taken', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Username already exists' }),
    }) as jest.Mock;

    render(<MemoryRouter><Register /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/^username$/i), 'chase');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });
  });

  it('disables the submit button while the request is in flight', async () => {
    let resolve: any;
    global.fetch = jest.fn().mockReturnValue(new Promise((r) => { resolve = r; })) as jest.Mock;

    render(<MemoryRouter><Register /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/^username$/i), 'newuser');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    resolve({ ok: true, json: () => Promise.resolve({ _id: '1', username: 'newuser' }) });
  });
});
