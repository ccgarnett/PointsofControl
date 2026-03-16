import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null, role = 'User') =>
  ({ token, user: token ? { id: '1', username: 'chase', role } : null, login: jest.fn(), logout: jest.fn() } as any);

describe('Sidebar', () => {
  it('shows admin-only links when user is Admin', () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'Admin'));
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Create Course')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Upload Docs')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('hides admin-only links when user is a regular User', () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'User'));
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.queryByText('Create Course')).not.toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload Docs')).not.toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });

  it('hides admin-only links when not logged in', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.queryByText('Create Course')).not.toBeInTheDocument();
  });

  it('shows Login button when not authenticated', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows Logout button when authenticated', () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'Admin'));
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('calls logout and navigates to /login when Logout is clicked', async () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({ token: 'abc', user: { id: '1', username: 'chase', role: 'Admin' }, login: jest.fn(), logout: mockLogout } as any);
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Sidebar />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    await userEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('always shows common nav links regardless of role', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});
