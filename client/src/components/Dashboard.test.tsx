import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null, username = 'chase', role = 'Admin') =>
  ({ token, user: token ? { id: 'uid1', username, role } : null, login: jest.fn(), logout: jest.fn() } as any);

describe('Dashboard', () => {
  it('shows a login prompt when user is not authenticated', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/sign in to see your courses/i)).toBeInTheDocument();
  });

  it('shows a personalized greeting when user is logged in', async () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'chase'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ enrolledCourses: [] }),
    }) as jest.Mock;
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/welcome back, chase/i)).toBeInTheDocument();
    });
  });

  it('renders enrolled course titles when the profile loads', async () => {
    mockUseAuth.mockReturnValue(makeAuth('abc'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        enrolledCourses: [
          { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101', progress: 50, moduleCount: 2 },
          { _id: 'c2', courseId: 'POC-102', title: 'Trading Basics', progress: 0, moduleCount: 4 },
        ],
      }),
    }) as jest.Mock;
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Mindset 101')).toBeInTheDocument();
      expect(screen.getByText('Trading Basics')).toBeInTheDocument();
    });
  });

  it('shows the enrolled course count badge', async () => {
    mockUseAuth.mockReturnValue(makeAuth('abc'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        enrolledCourses: [
          { _id: 'c1', courseId: 'POC-101', title: 'Course A', progress: 0, moduleCount: 1 },
          { _id: 'c2', courseId: 'POC-102', title: 'Course B', progress: 0, moduleCount: 1 },
        ],
      }),
    }) as jest.Mock;
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows an empty state when user has no enrolled courses', async () => {
    mockUseAuth.mockReturnValue(makeAuth('abc'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ enrolledCourses: [] }),
    }) as jest.Mock;
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no courses yet/i)).toBeInTheDocument();
    });
  });
});
