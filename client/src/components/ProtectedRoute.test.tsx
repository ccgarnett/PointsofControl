import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null, role = 'User') =>
  ({ token, user: token ? { id: '1', username: 'chase', role } : null, login: jest.fn(), logout: jest.fn() } as any);

describe('ProtectedRoute', () => {
  it('renders children when a token is present', () => {
    mockUseAuth.mockReturnValue(makeAuth('abc'));
    render(
      <MemoryRouter>
        <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not render children when there is no token', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(
      <MemoryRouter initialEntries={['/account-settings']}>
        <Routes>
          <Route path="/account-settings" element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when there is no token', async () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(
      <MemoryRouter initialEntries={['/account-settings']}>
        <Routes>
          <Route path="/account-settings" element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
