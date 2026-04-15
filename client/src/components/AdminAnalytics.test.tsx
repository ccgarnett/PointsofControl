import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminAnalytics from './AdminAnalytics';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);
jest.mock('./Skeleton', () => ({ SkeletonPage: () => <div>Loading...</div> }));
jest.mock('chart.js', () => {
  class Chart { static register() {} constructor() {} destroy() {} }
  return { Chart, BarController: {}, BarElement: {}, CategoryScale: {}, LinearScale: {}, Legend: {}, Tooltip: {}, Title: {} };
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

// Helper: sets up all five sequential fetches AdminAnalytics makes
// Order: completion, purchases, interactions (courses), clicks, time-on-page
const setupFetch = (
  completion = mockCompletionData,
  purchases = mockPurchaseData,
  clicks = mockClickData,
  interactions: any[] = [],
  timeOnPage: any[] = [],
) => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(completion) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(purchases) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(interactions) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(clicks) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(timeOnPage) }) as jest.Mock;
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
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockClickData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;

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
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;

    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load click analytics/i)).toBeInTheDocument();
    });
  });
});

describe('AdminAnalytics — Course Interactions chart section (A8)', () => {
  const mockInteractions = [
    { courseId: 'POC-101', courseTitle: 'Mindset', pageViews: 20, enrollClicks: 5, purchases: 3, totalInteractions: 28 },
    { courseId: 'POC-102', courseTitle: 'Trading', pageViews: 10, enrollClicks: 2, purchases: 1, totalInteractions: 13 },
  ];

  it('renders the Course Interactions heading', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Course Interactions')).toBeInTheDocument();
    });
  });

  it('shows an empty state when there is no interaction data', async () => {
    setupFetch(mockCompletionData, mockPurchaseData, mockClickData, []);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no interaction data yet/i)).toBeInTheDocument();
    });
  });

  it('renders the interactions table with rank, course, page views, enroll clicks, purchases, total columns', async () => {
    setupFetch(mockCompletionData, mockPurchaseData, mockClickData, mockInteractions);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Rank')).toBeInTheDocument();
      // "Total" appears in both the completion table and the interactions table
      expect(screen.getAllByText('Total').length).toBeGreaterThanOrEqual(2);
      // "Purchases" appears only in the interactions table header
      expect(screen.getByText('Purchases')).toBeInTheDocument();
    });
  });

  it('renders a row for each course in the interactions table', async () => {
    setupFetch(mockCompletionData, mockPurchaseData, mockClickData, mockInteractions);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      // "Mindset" appears in completion, purchase, click, and interaction tables (4 total)
      expect(screen.getAllByText('Mindset').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Trading').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders period filter buttons (Today, This Week, This Month, This Year, All Time)', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Year' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
    });
  });

  it('re-fetches interaction data with correct period param when a filter is clicked', async () => {
    // Use a persistent mock so the re-fetch triggered by clicking "This Week" also resolves
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    }) as jest.Mock;

    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => screen.getByRole('button', { name: 'This Week' }));

    await userEvent.click(screen.getByRole('button', { name: 'This Week' }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const weekCall = calls.find((c: any[]) => String(c[0]).includes('period=week'));
      expect(weekCall).toBeDefined();
    });
  });

  it('renders canvas elements for purchase and interaction charts', async () => {
    setupFetch(mockCompletionData, mockPurchaseData, mockClickData, mockInteractions);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => screen.getByText('Course Interactions'));
    const canvases = document.querySelectorAll('canvas');
    // Three charts: module completion, purchase, interaction
    expect(canvases.length).toBe(3);
  });

  it('shows error when interaction fetch fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockCompletionData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockPurchaseData) })
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockClickData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;

    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load interaction analytics/i)).toBeInTheDocument();
    });
  });
});

describe('AdminAnalytics — CSV Export (A15)', () => {
  it('renders the Export CSV button', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    });
  });

  it('calls the export endpoint with auth header when Export CSV is clicked', async () => {
    // Override fetch so the blob call also resolves cleanly
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockCompletionData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockPurchaseData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockClickData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, blob: jest.fn().mockResolvedValue(new Blob(['csv'])) }) as jest.Mock;

    // jsdom does not implement createObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:fake');
    global.URL.revokeObjectURL = jest.fn();

    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => screen.getByRole('button', { name: /export csv/i }));
    await userEvent.click(screen.getByRole('button', { name: /export csv/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const csvCall = calls.find((c: any[]) => String(c[0]).includes('export/csv'));
      expect(csvCall).toBeDefined();
      expect(csvCall[1].headers.Authorization).toBe('Bearer test.token');
    });
  });
});

describe('AdminAnalytics — Time on Page section (A14)', () => {
  const mockTimeOnPage = [
    { _id: 'c1', courseId: 'POC-101', title: 'Mindset', avgDuration: 45, sessionCount: 2 },
    { _id: 'c2', courseId: 'POC-102', title: 'Trading', avgDuration: 0, sessionCount: 0 },
  ];

  it('renders the Time on Page heading', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Time on Page')).toBeInTheDocument();
    });
  });

  it('renders Avg Time and Sessions columns', async () => {
    setupFetch(mockCompletionData, mockPurchaseData, mockClickData, [], mockTimeOnPage);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Avg Time (sec)')).toBeInTheDocument();
      expect(screen.getByText('Sessions')).toBeInTheDocument();
    });
  });

  it('displays avgDuration with "s" suffix for courses with sessions', async () => {
    setupFetch(mockCompletionData, mockPurchaseData, mockClickData, [], mockTimeOnPage);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('45s')).toBeInTheDocument();
    });
  });

  it('displays "—" for courses with no sessions', async () => {
    setupFetch(mockCompletionData, mockPurchaseData, mockClickData, [], mockTimeOnPage);
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('sends Authorization header when fetching time-on-page data', async () => {
    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => screen.getByText('Time on Page'));
    const calls = (global.fetch as jest.Mock).mock.calls;
    const topCall = calls.find((c: any[]) => String(c[0]).includes('time-on-page'));
    expect(topCall).toBeDefined();
    expect(topCall[1].headers.Authorization).toBe('Bearer test.token');
  });

  it('shows error when time-on-page fetch fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockCompletionData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockPurchaseData) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockClickData) })
      .mockRejectedValueOnce(new Error('network error')) as jest.Mock;

    render(<MemoryRouter><AdminAnalytics /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load time-on-page analytics/i)).toBeInTheDocument();
    });
  });
});
