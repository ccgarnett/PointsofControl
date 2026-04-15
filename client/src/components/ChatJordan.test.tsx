import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ChatJordan from './ChatJordan';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (token: string | null, username = 'testuser') =>
  ({
    token,
    user: token ? { id: 'uid1', username, role: 'User' } : null,
    login: jest.fn(),
    logout: jest.fn(),
  } as any);

const mockMessages = [
  {
    _id: 'm1',
    fromAdmin: false,
    senderUsername: 'testuser',
    content: 'Hello Jordan',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'm2',
    fromAdmin: true,
    senderUsername: 'Jordan',
    content: 'Hello! How can I help?',
    createdAt: new Date().toISOString(),
  },
];

beforeEach(() => {
  mockUseAuth.mockReturnValue(makeAuth('test.token'));
  // jsdom does not implement scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('ChatJordan', () => {
  it('renders the Chat heading', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    expect(screen.getByText('Chat with Jordan')).toBeInTheDocument();
  });

  it('shows loading indicator initially (pending fetch)', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no messages', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });
  });

  it('renders message content for user and admin messages', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(mockMessages) }) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Hello Jordan')).toBeInTheDocument();
      expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument();
    });
  });

  it("applies 'mine' class to user's own messages and 'theirs' to admin messages", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(mockMessages) }) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => screen.getByText('Hello Jordan'));

    const userBubbleRow = screen.getByText('Hello Jordan').closest('.chat-bubble-row');
    const adminBubbleRow = screen.getByText('Hello! How can I help?').closest('.chat-bubble-row');
    expect(userBubbleRow).toHaveClass('mine');
    expect(adminBubbleRow).toHaveClass('theirs');
  });

  it('renders sender name and timestamp in bubble meta', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(mockMessages) }) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => {
      // senderUsername appears in the bubble meta divs
      const metas = document.querySelectorAll('.chat-bubble-meta');
      const metaTexts = Array.from(metas).map((m) => m.textContent);
      expect(metaTexts.some((t) => t?.includes('testuser'))).toBe(true);
      expect(metaTexts.some((t) => t?.includes('Jordan'))).toBe(true);
    });
  });

  it('renders a text input and Send button', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('Send button is disabled when input is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('sends a message and appends it to the thread', async () => {
    const newMsg = { _id: 'm3', fromAdmin: false, senderUsername: 'testuser', content: 'New message', createdAt: new Date().toISOString() };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(newMsg) }) as jest.Mock;

    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));

    await userEvent.type(screen.getByPlaceholderText(/type a message/i), 'New message');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('New message')).toBeInTheDocument();
    });
  });

  it('sends POST request with correct body and auth header', async () => {
    const newMsg = { _id: 'm3', fromAdmin: false, senderUsername: 'testuser', content: 'Hi there', createdAt: new Date().toISOString() };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(newMsg) }) as jest.Mock;

    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));

    await userEvent.type(screen.getByPlaceholderText(/type a message/i), 'Hi there');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const postCall = calls.find((c: any[]) => c[1]?.method === 'POST');
      expect(postCall).toBeDefined();
      expect(postCall[1].headers.Authorization).toBe('Bearer test.token');
      expect(JSON.parse(postCall[1].body)).toEqual({ content: 'Hi there' });
    });
  });

  it('clears the input after a successful send', async () => {
    const newMsg = { _id: 'm3', fromAdmin: false, senderUsername: 'testuser', content: 'Hi', createdAt: new Date().toISOString() };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(newMsg) }) as jest.Mock;

    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));

    const input = screen.getByPlaceholderText(/type a message/i) as HTMLInputElement;
    await userEvent.type(input, 'Hi');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(input.value).toBe(''));
  });

  it('shows error message when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument();
    });
  });

  it('shows error message when API returns non-array', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ error: 'bad' }) }) as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument();
    });
  });

  it('shows error when sending a message fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: false }) as jest.Mock;

    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    await waitFor(() => screen.getByPlaceholderText(/type a message/i));

    await userEvent.type(screen.getByPlaceholderText(/type a message/i), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });
  });

  it('does not fetch when token is absent', () => {
    mockUseAuth.mockReturnValue(makeAuth(null));
    global.fetch = jest.fn() as jest.Mock;
    render(<MemoryRouter><ChatJordan /></MemoryRouter>);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
