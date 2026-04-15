import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

interface Conversation {
  userId: string;
  username: string;
  latestMessage: string;
  latestAt: string;
  latestFromAdmin: boolean;
}

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

const AdminChat: React.FC = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    document.title = 'Points of Control — Admin Chat';
  }, []);

  const fetchConversations = () => {
    if (!token) return;
    fetch('/api/admin/chat', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setConversations(data); })
      .catch(() => {});
  };

  useEffect(() => { fetchConversations(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const openConversation = (userId: string) => {
    setSelectedUserId(userId);
    setReply('');
    if (!token) return;
    fetch(`/api/admin/chat/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMessages(data); })
      .catch(() => {});
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedUserId || !token) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/chat/${selectedUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: reply.trim() }),
      });
      if (!res.ok) throw new Error();
      const msg: DirectMessage = await res.json();
      setMessages((prev) => [...prev, msg]);
      setReply('');
      setStatus({ type: 'success', text: 'Reply sent' });
      fetchConversations();
    } catch {
      setStatus({ type: 'error', text: 'Failed to send reply' });
    }
    setSending(false);
  };

  const selectedConvo = conversations.find((c) => c.userId === selectedUserId);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>User Conversations</h2>
        </header>

        {status && (
          <div className={`form-message ${status.type}`} style={{ marginBottom: '1rem' }}>
            {status.text}
          </div>
        )}

        <div className="admin-chat-layout">
          {/* Conversation list */}
          <div className="admin-chat-sidebar">
            <div className="section-heading-row">
              <h3 className="section-heading">Conversations</h3>
              <span className="section-count">{conversations.length}</span>
            </div>
            {conversations.length === 0 ? (
              <p className="muted">No conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.userId}
                  className={`admin-chat-convo-item${selectedUserId === c.userId ? ' active' : ''}`}
                  onClick={() => openConversation(c.userId)}
                >
                  <div className="admin-chat-convo-name">{c.username}</div>
                  <div className="admin-chat-convo-preview">
                    {c.latestFromAdmin ? 'You: ' : ''}{c.latestMessage.slice(0, 50)}{c.latestMessage.length > 50 ? '…' : ''}
                  </div>
                  <div className="admin-chat-convo-time">{formatTime(c.latestAt)}</div>
                </button>
              ))
            )}
          </div>

          {/* Message thread */}
          <div className="admin-chat-thread">
            {!selectedUserId ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a user from the list to view their messages.</p>
              </div>
            ) : (
              <>
                <div className="admin-chat-thread-header">
                  Conversation with <strong>{selectedConvo?.username ?? selectedUserId}</strong>
                </div>
                <div className="chat-window admin-chat-window">
                  {messages.map((msg) => {
                    const isMine = msg.fromAdmin;
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
                  })}
                </div>
                <form className="chat-input-row" onSubmit={handleReply}>
                  <input
                    className="chat-input"
                    type="text"
                    placeholder={`Reply to ${selectedConvo?.username ?? 'user'}…`}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    disabled={sending}
                  />
                  <button className="btn-submit chat-send-btn" type="submit" disabled={sending || !reply.trim()}>
                    {sending ? '…' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminChat;
