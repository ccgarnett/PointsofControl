import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);
jest.mock('./DailyChecklist', () => () => null);
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null, username = 'chase', role = 'User', id = 'uid1') =>
  ({ token, user: token ? { id, username, role } : null, login: jest.fn(), logout: jest.fn() } as any);

const mockPosts = [
  {
    _id: 'p1',
    content: 'Welcome to POC!',
    postedBy: 'chase',
    reactions: [],
    acknowledgedBy: [],
    createdAt: new Date().toISOString(),
  },
];

// Default: profile returns empty enrollments, messages returns empty array
const mockFetch = (profileData: Record<string, any> = { enrolledCourses: [] }, postsData: any[] = []) => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(profileData) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(postsData) }) as jest.Mock;
};

beforeEach(() => {
  mockUseAuth.mockReturnValue(makeAuth('abc'));
  // Default for tests that don't call mockFetch themselves
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue([]),
  }) as jest.Mock;
});

describe('Dashboard — courses', () => {
  it('shows a login prompt when user is not authenticated', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/sign in to see your courses/i)).toBeInTheDocument();
  });

  it('shows a personalized greeting when user is logged in', async () => {
    mockFetch();
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/welcome back, chase/i)).toBeInTheDocument();
    });
  });

  it('renders enrolled course titles when the profile loads', async () => {
    mockFetch({
      enrolledCourses: [
        { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101', progress: 50, moduleCount: 2 },
        { _id: 'c2', courseId: 'POC-102', title: 'Trading Basics', progress: 0, moduleCount: 4 },
      ],
    });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Mindset 101')).toBeInTheDocument();
      expect(screen.getByText('Trading Basics')).toBeInTheDocument();
    });
  });

  it('shows the enrolled course count badge', async () => {
    mockFetch({
      enrolledCourses: [
        { _id: 'c1', courseId: 'POC-101', title: 'Course A', progress: 0, moduleCount: 1 },
        { _id: 'c2', courseId: 'POC-102', title: 'Course B', progress: 0, moduleCount: 1 },
      ],
    });
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows an empty state when user has no enrolled courses', async () => {
    mockFetch();
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no courses yet/i)).toBeInTheDocument();
    });
  });
});

describe('Dashboard — Recent Posts', () => {
  it('renders post content when messages are returned', async () => {
    mockFetch({}, mockPosts);
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Welcome to POC!')).toBeInTheDocument();
      expect(screen.getByText('Recent Posts')).toBeInTheDocument();
    });
  });

  it('shows reaction buttons for each post', async () => {
    mockFetch({}, mockPosts);
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Welcome to POC!')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /👍/u })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /❤️/u })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /👏/u })).toBeInTheDocument();
  });

  it('shows Acknowledge button for unacknowledged post', async () => {
    mockFetch({}, mockPosts);
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Welcome to POC!')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
  });

  it('marks post as post-unread when user has not acknowledged it', async () => {
    mockFetch({}, mockPosts);
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Welcome to POC!')).toBeInTheDocument());
    const card = screen.getByText('Welcome to POC!').closest('.module-block');
    expect(card).toHaveClass('post-unread');
  });

  it('shows ✓ Acknowledged when user has already acknowledged', async () => {
    mockFetch({}, [{ ...mockPosts[0], acknowledgedBy: ['uid1'] }]);
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/✓ Acknowledged/)).toBeInTheDocument());
  });

  it('sends react request when reaction button clicked', async () => {
    const updatedPost = { ...mockPosts[0], reactions: [{ userId: 'uid1', type: '👍' }] };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ enrolledCourses: [] }) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockPosts) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(updatedPost) }) as jest.Mock;

    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Welcome to POC!')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /👍/u }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const reactCall = calls.find((c: any[]) => c[0].includes('/react'));
      expect(reactCall).toBeDefined();
    });
  });

  it('does not render Recent Posts section when there are no messages', async () => {
    mockFetch({}, []);
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/no courses yet/i)).toBeInTheDocument());
    expect(screen.queryByText('Recent Posts')).not.toBeInTheDocument();
  });
});
