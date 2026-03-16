import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from './AdminRoute';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null, role = 'User') =>
  ({ token, user: token ? { id: '1', username: 'chase', role } : null, login: jest.fn(), logout: jest.fn() } as any);

describe('AdminRoute', () => {
  it('renders children when user is Admin', () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'Admin'));
    render(
      <MemoryRouter>
        <AdminRoute><div>Admin Content</div></AdminRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to /dashboard when user is logged in but not Admin', async () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'User'));
    render(
      <MemoryRouter initialEntries={['/admin/analytics']}>
        <Routes>
          <Route path="/admin/analytics" element={<AdminRoute><div>Admin Content</div></AdminRoute>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('redirects to /login when there is no token', async () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(
      <MemoryRouter initialEntries={['/admin/analytics']}>
        <Routes>
          <Route path="/admin/analytics" element={<AdminRoute><div>Admin Content</div></AdminRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
