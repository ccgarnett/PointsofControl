import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Courses from './Courses';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null, role = 'User') =>
  ({ token, user: token ? { id: '1', username: 'chase', role } : null, login: jest.fn(), logout: jest.fn() } as any);

const mockCourses = [
  { _id: '1', courseId: 'POC-101', title: 'Trading Fundamentals', description: 'Learn trading', modules: [] },
  { _id: '2', courseId: 'POC-102', title: 'Mindset Mastery', description: 'Build your mindset', modules: [] },
];

describe('Courses page', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(makeAuth(null));
  });

  it('renders all available courses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCourses),
    }) as jest.Mock;
    render(<MemoryRouter><Courses /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Trading Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('Mindset Mastery')).toBeInTheDocument();
    });
  });

  it('shows the course count', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCourses),
    }) as jest.Mock;
    render(<MemoryRouter><Courses /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows an empty state when no courses exist', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    }) as jest.Mock;
    render(<MemoryRouter><Courses /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no courses available yet/i)).toBeInTheDocument();
    });
  });

  it('hides the Delete button for non-admin users', async () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'User'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCourses),
    }) as jest.Mock;
    render(<MemoryRouter><Courses /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Trading Fundamentals')).toBeInTheDocument());
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows the Delete button for admin users', async () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'Admin'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCourses),
    }) as jest.Mock;
    render(<MemoryRouter><Courses /></MemoryRouter>);
    await waitFor(() => expect(screen.getAllByText('Delete').length).toBeGreaterThan(0));
  });

  it('shows inline confirm after clicking Delete', async () => {
    mockUseAuth.mockReturnValue(makeAuth('abc', 'Admin'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockCourses[0]]),
    }) as jest.Mock;
    render(<MemoryRouter><Courses /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Delete')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });
});
