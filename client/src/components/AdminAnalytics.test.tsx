import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminAnalytics from './AdminAnalytics';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);
jest.mock('./Skeleton', () => ({ SkeletonPage: () => <div>Loading...</div> }));
jest.mock('chart.js', () => {
  class Chart { static register() {} constructor() {} destroy() {} }
  return { Chart, BarController: {}, BarElement: {}, CategoryScale: {}, LinearScale: {}, Legend: {}, Tooltip: {} };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null) =>
  ({ token, user: token ? { id: '1', username: 'chase', role: 'Admin' } : null, login: jest.fn(), logout: jest.fn() } as any);

const mockCompletionData = [
  { _id: 'c1', courseId: 'POC-101', title: 'Mindset', totalModules: 4, completedModules: 2, completionRate: 50 },
];

const mockPurchaseData = [
  { _id: 'c1', courseId: 'POC-101', title: 'Mindset', price: 100, purchaseCount: 3, totalRevenue: 300 },
  { _id: 'c2', courseId: 'POC-102', title: 'Trading', price: 200, purchaseCount: 1, totalRevenue: 200 },
];

const mockClickData = [
  { _id: 'c1', courseId: 'POC-101', title: 'Mindset', pageviews: 10, enrollClicks: 3, conversionRate: 30 },
];

// Helper: sets up all four sequential fetches AdminAnalytics makes
// Order: completion, purchases, interactions (courses), clicks
const setupFetch = (
  completion = mockCompletionData,
  purchases = mockPurchaseData,
  clicks = mockClickData,
  interactions: any[] = [],
) => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(completion) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(purchases) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(interactions) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(clicks) }) as jest.Mock;
};

beforeEach(() => {
  mockUseAuth.mockReturnValue(makeAuth('test.token'));
  setupFetch();
});

describe('AdminAnalytics — Purchase section', () => {
  it('renders the Purchase Analytics heading', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Purchase Analytics')).toBeInTheDocument();
    });
  });

  it('shows summary cards with totals', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Total Enrollments')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      // Scope to the summary row to avoid collision with table cells
      const summaryRow = screen.getByText('Total Enrollments').closest('.analytics-summary-card')!.parentElement!;
      expect(within(summaryRow).getByText('4')).toBeInTheDocument(); // 3 + 1
      expect(within(summaryRow).getByText('$500')).toBeInTheDocument(); // 300 + 200
    });
  });

  it('renders a row for each course in the purchase table', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      // "Mindset" appears in: completion table, purchase table, and click table (3 total)
      expect(screen.getAllByText('Mindset')).toHaveLength(3);
      expect(screen.getAllByText('Trading')).toHaveLength(1);
    });
  });

  it('sends the Authorization header when fetching purchase data', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => screen.getByText('Purchase Analytics'));
    const calls = (global.fetch as jest.Mock).mock.calls;
    const purchaseCall = calls.find((c: any[]) => c[0].includes('purchases'));
    expect(purchaseCall[1].headers.Authorization).toBe('Bearer test.token');
  });

  it('shows an empty state when there are no purchases', async () => {
    setupFetch(mockCompletionData, [], mockClickData);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no purchases yet/i)).toBeInTheDocument();
    });
  });

  it('shows an error message when the purchase fetch fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockCompletionData) })
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockClickData) }) as jest.Mock;

    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load purchase analytics/i)).toBeInTheDocument();
    });
  });
});

describe('AdminAnalytics — Enroll Click section', () => {
  it('renders the Enroll Click Analytics heading', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Enroll Click Analytics')).toBeInTheDocument();
    });
  });

  it('renders a row with pageviews, enroll clicks, and conversion rate', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Page Views')).toBeInTheDocument();
      expect(screen.getByText('Enroll Clicks')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
      // Scope to the click table to avoid collision with purchase count (also '3')
      const clickHeading = screen.getByText('Page Views').closest('table')!;
      expect(within(clickHeading).getByText('10')).toBeInTheDocument();
      expect(within(clickHeading).getByText('3')).toBeInTheDocument();
    });
  });

  it('shows an empty state when there are no click events', async () => {
    setupFetch(mockCompletionData, mockPurchaseData, []);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no click data yet/i)).toBeInTheDocument();
    });
  });

  it('sends the Authorization header when fetching click data', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => screen.getByText('Enroll Click Analytics'));
    const calls = (global.fetch as jest.Mock).mock.calls;
    const clickCall = calls.find((c: any[]) => c[0].includes('clicks'));
    expect(clickCall[1].headers.Authorization).toBe('Bearer test.token');
  });

  it('shows an error message when the click fetch fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockCompletionData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockPurchaseData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockRejectedValueOnce(new Error('network error')) as jest.Mock;

    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load click analytics/i)).toBeInTheDocument();
    });
  });
});
