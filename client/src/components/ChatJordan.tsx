import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

interface DirectMessage {
  _id: string;
  fromAdmin: boolean;
  senderUsername: string;
  content: string;
  createdAt: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ChatJordan: React.FC = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Points of Control — Chat';
  }, []);

  const fetchMessages = () => {
    if (!token) return;
    fetch('/api/chat/messages', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
        else setError('Failed to load messages');
        setLoading(false);
      })
      .catch(() => { setError('Failed to load messages'); setLoading(false); });
  };

  useEffect(() => { fetchMessages(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !token) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (!res.ok) throw new Error();
      const msg: DirectMessage = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch {
      setError('Failed to send message');
    }
    setSending(false);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Chat with Jordan</h2>
        </header>

        {error && (
          <div className="form-message error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}

        <div className="chat-window">
          {loading ? (
            <p className="muted" style={{ padding: '1rem' }}>Loading…</p>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>No messages yet</h3>
              <p>Send a message to start a conversation with Jordan.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = !msg.fromAdmin;
              return (
                <div key={msg._id} className={`chat-bubble-row${isMine ? ' mine' : ' theirs'}`}>
                  <div className={`chat-bubble${isMine ? ' chat-bubble--mine' : ' chat-bubble--theirs'}`}>
                    <div className="chat-bubble-content">{msg.content}</div>
                    <div className="chat-bubble-meta">
                      {msg.senderUsername} · {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            className="chat-input"
            type="text"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending || !user}
          />
          <button className="btn-submit chat-send-btn" type="submit" disabled={sending || !input.trim()}>
            {sending ? '…' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ChatJordan;
