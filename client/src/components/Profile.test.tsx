import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);
jest.mock('./Skeleton', () => ({
  SkeletonPage: () => <div data-testid="skeleton-page" />,
  __esModule: true,
  default: () => <div className="skeleton" />,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockProfile = {
  _id: 'uid1',
  username: 'chase',
  email: 'chase@example.com',
  name: 'Chase',
  age: 25,
  pronouns: 'he/him',
  bio: 'Hello world',
  role: 'User',
  enrolledCourses: [],
};

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    token: 'test-token',
    user: { id: 'uid1', username: 'chase', role: 'User' },
    login: jest.fn(),
    logout: jest.fn(),
  } as any);
});

describe('Profile component', () => {
  it('shows loading skeleton while fetching', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;
    render(<MemoryRouter><Profile /></MemoryRouter>);
    expect(screen.getByTestId('skeleton-page')).toBeInTheDocument();
  });

  it('renders profile data after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProfile),
    }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('chase')).toBeInTheDocument();
    });
  });

  it('shows profile fields: email, pronouns, role', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProfile),
    }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/chase@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/he\/him/)).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  it('shows profile picture placeholder when no picture URL', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProfile),
    }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('👤')).toBeInTheDocument();
    });
  });

  it('shows profile picture img when URL exists', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ ...mockProfile, profilePictureUrl: 'https://example.com/pic.jpg' }),
    }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /profile/i })).toBeInTheDocument();
    });
  });

  it('shows edit form when Edit Profile is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProfile),
    }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
    await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('hides edit form when Cancel is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProfile),
    }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
    await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
  });

  it('saves profile changes on form submit', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockProfile) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ ...mockProfile, name: 'Chase Updated' }) }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => screen.getByRole('button', { name: /edit profile/i }));
    await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
    });
  });

  it('shows enrolled courses when profile has them', async () => {
    const profileWithCourses = {
      ...mockProfile,
      enrolledCourses: [
        { _id: 'c1', courseId: 'POC-101', title: 'Mindset 101', progress: 50, moduleCount: 2 },
      ],
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(profileWithCourses),
    }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Mindset 101')).toBeInTheDocument();
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  it('shows empty courses message when no enrolled courses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockProfile),
    }) as jest.Mock;

    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/not enrolled in any courses/i)).toBeInTheDocument();
    });
  });

  it('shows error state when profile fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;
    render(<MemoryRouter><Profile /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
