import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminChat from './AdminChat';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (role = 'Admin') =>
  ({
    token: 'admin.token',
    user: { id: 'admin1', username: 'Jordan', role },
    login: jest.fn(),
    logout: jest.fn(),
  } as any);

const mockConversations = [
  {
    userId: 'user1',
    username: 'alice',
    latestMessage: 'Hi Jordan',
    latestAt: new Date().toISOString(),
    latestFromAdmin: false,
  },
  {
    userId: 'user2',
    username: 'bob',
    latestMessage: 'Need help',
    latestAt: new Date().toISOString(),
    latestFromAdmin: false,
  },
];

const mockThread = [
  { _id: 'm1', fromAdmin: false, senderUsername: 'alice', content: 'Hi Jordan', createdAt: new Date().toISOString() },
  { _id: 'm2', fromAdmin: true, senderUsername: 'Jordan', content: 'Hello Alice!', createdAt: new Date().toISOString() },
];

beforeEach(() => {
  mockUseAuth.mockReturnValue(makeAuth());
});

describe('AdminChat', () => {
  it('renders the User Conversations heading', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    expect(screen.getByText('User Conversations')).toBeInTheDocument();
  });

  it('shows empty state in the thread panel before any conversation is selected', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
    });
  });

  it('renders a list of users with conversations', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) }) as jest.Mock;
    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
    });
  });

  it('shows conversation count in sidebar', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) }) as jest.Mock;
    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows latest message preview under each conversation', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) }) as jest.Mock;
    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Hi Jordan')).toBeInTheDocument();
      expect(screen.getByText('Need help')).toBeInTheDocument();
    });
  });

  it('shows "No conversations yet" when list is empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
    });
  });

  it('loads and displays message thread when a conversation is clicked', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockThread) }) as jest.Mock;

    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => screen.getByText('alice'));

    await userEvent.click(screen.getByText('alice').closest('button')!);

    // "Hello Alice!" only appears in the thread (not the sidebar preview)
    await waitFor(() => {
      expect(screen.getAllByText('Hello Alice!').length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows thread header with selected user's name", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockThread) }) as jest.Mock;

    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => screen.getByText('alice'));

    await userEvent.click(screen.getByText('alice').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText(/conversation with/i)).toBeInTheDocument();
    });
  });

  it("applies 'theirs' class to user messages and 'mine' to admin replies in thread", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockThread) }) as jest.Mock;

    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => screen.getByText('alice'));
    await userEvent.click(screen.getByText('alice').closest('button')!);

    // "Hello Alice!" only appears in the thread bubble
    await waitFor(() => screen.getAllByText('Hello Alice!'));

    // Scope bubble class checks via the thread panel
    const thread = document.querySelector('.admin-chat-thread')!;
    const bubbleRows = thread.querySelectorAll('.chat-bubble-row');
    expect(bubbleRows[0]).toHaveClass('theirs'); // user message
    expect(bubbleRows[1]).toHaveClass('mine');   // admin reply
  });

  it('sends a reply with the correct body and auth header', async () => {
    const replied = { _id: 'm3', fromAdmin: true, senderUsername: 'Jordan', content: 'Got it!', createdAt: new Date().toISOString() };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockThread) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(replied) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) }) as jest.Mock;

    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => screen.getByText('alice'));
    await userEvent.click(screen.getByText('alice').closest('button')!);
    await waitFor(() => screen.getByPlaceholderText(/reply to alice/i));

    await userEvent.type(screen.getByPlaceholderText(/reply to alice/i), 'Got it!');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const postCall = calls.find((c: any[]) => c[1]?.method === 'POST');
      expect(postCall).toBeDefined();
      expect(postCall[1].headers.Authorization).toBe('Bearer admin.token');
      expect(JSON.parse(postCall[1].body)).toEqual({ content: 'Got it!' });
    });
  });

  it('appends admin reply to the thread after send', async () => {
    const replied = { _id: 'm3', fromAdmin: true, senderUsername: 'Jordan', content: 'Got it!', createdAt: new Date().toISOString() };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockThread) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(replied) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) }) as jest.Mock;

    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => screen.getByText('alice'));
    await userEvent.click(screen.getByText('alice').closest('button')!);
    await waitFor(() => screen.getByPlaceholderText(/reply to alice/i));

    await userEvent.type(screen.getByPlaceholderText(/reply to alice/i), 'Got it!');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Got it!')).toBeInTheDocument();
    });
  });

  it('clears reply input after successful send', async () => {
    const replied = { _id: 'm3', fromAdmin: true, senderUsername: 'Jordan', content: 'Done', createdAt: new Date().toISOString() };
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(replied) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockConversations) }) as jest.Mock;

    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => screen.getByText('alice'));
    await userEvent.click(screen.getByText('alice').closest('button')!);
    await waitFor(() => screen.getByPlaceholderText(/reply to alice/i));

    const input = screen.getByPlaceholderText(/reply to alice/i) as HTMLInputElement;
    await userEvent.type(input, 'Done');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(input.value).toBe(''));
  });

  it('fetches conversations on mount with the auth header', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue([]) }) as jest.Mock;
    render(<MemoryRouter><AdminChat /></MemoryRouter>);
    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const convoCall = calls.find((c: any[]) => c[0].includes('/api/admin/chat'));
      expect(convoCall).toBeDefined();
      expect(convoCall[1].headers.Authorization).toBe('Bearer admin.token');
    });
  });
});
