import { render, screen, waitFor } from '@testing-library/react';
import DailyChecklist from './DailyChecklist';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null) =>
  ({
    token,
    user: token ? { id: 'u1', username: 'chase', role: 'User' } : null,
    login: jest.fn(),
    logout: jest.fn(),
  } as any);

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue([]),
  }) as jest.Mock;
});

describe('DailyChecklist component', () => {
  it('renders without crashing', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(<DailyChecklist />);
    expect(screen.getByRole('heading', { name: /checklist/i })).toBeInTheDocument();
  });

  it('shows login prompt when not authenticated', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    render(<DailyChecklist />);
    expect(screen.getByText(/please log in to view your checklist/i)).toBeInTheDocument();
  });

  it('loads tasks when logged in', async () => {
    mockUseAuth.mockReturnValue(makeAuth('tok'));
    render(<DailyChecklist />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(call[0]).toMatch(/\/api\/checklist\?date=/);
    expect(call[1].headers.Authorization).toBe('Bearer tok');
  });
});
