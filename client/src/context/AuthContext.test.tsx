import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="username">{user?.username ?? 'none'}</span>
      <span data-testid="role">{user?.role ?? 'none'}</span>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => login('test-token', { id: '1', username: 'chase', role: 'Admin' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with null user and token when localStorage is empty', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('username').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');
  });

  it('login() updates state with user and token', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    await userEvent.click(screen.getByText('Login'));
    expect(screen.getByTestId('username').textContent).toBe('chase');
    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(screen.getByTestId('role').textContent).toBe('Admin');
  });

  it('login() persists token and user to localStorage', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    await userEvent.click(screen.getByText('Login'));
    expect(localStorage.getItem('auth_token')).toBe('test-token');
    expect(JSON.parse(localStorage.getItem('auth_user')!).username).toBe('chase');
    expect(localStorage.getItem('userId')).toBe('1');
  });

  it('logout() clears state', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    await userEvent.click(screen.getByText('Login'));
    await userEvent.click(screen.getByText('Logout'));
    expect(screen.getByTestId('username').textContent).toBe('none');
    expect(screen.getByTestId('token').textContent).toBe('none');
  });

  it('logout() clears localStorage', async () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    await userEvent.click(screen.getByText('Login'));
    await userEvent.click(screen.getByText('Logout'));
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
  });

  it('initializes from localStorage on mount', () => {
    localStorage.setItem('auth_token', 'stored-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: '2', username: 'nyrique', role: 'Admin' }));
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('username').textContent).toBe('nyrique');
    expect(screen.getByTestId('token').textContent).toBe('stored-token');
  });
});
