import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

interface Message {
  _id: string;
  content: string;
  postedBy: string;
  createdAt: string;
}

const AdminMessages: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [messages, setMessages] = useState<Message[]>([]);
  const [newContent, setNewContent] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Points of Control — Messages';
  }, []);

  const fetchMessages = () => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then(setMessages)
      .catch(() => setStatus({ type: 'error', text: 'Failed to load messages' }));
  };

  useEffect(() => { fetchMessages(); }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, postedBy: user?.username ?? 'Admin' }),
      });
      if (!res.ok) throw new Error('Failed to post');
      setNewContent('');
      setStatus({ type: 'success', text: 'Message posted!' });
      fetchMessages();
    } catch {
      setStatus({ type: 'error', text: 'Could not post message' });
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setEditId(null);
      setEditContent('');
      setStatus({ type: 'success', text: 'Message updated!' });
      fetchMessages();
    } catch {
      setStatus({ type: 'error', text: 'Could not update message' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setStatus({ type: 'success', text: 'Message deleted' });
      fetchMessages();
    } catch {
      setStatus({ type: 'error', text: 'Could not delete message' });
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Dashboard Messages</h2>
        </header>

        {status && (
          <div className={`form-message ${status.type}`} style={{ marginBottom: '1rem' }}>
            {status.text}
          </div>
        )}

        {isAdmin && (
          <form onSubmit={handlePost} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label>New Message</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write a message to your clients..."
                rows={3}
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="btn-submit">Post Message</button>
          </form>
        )}

        <div>
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">✈️</div>
              <h3>No messages yet</h3>
              <p>Messages posted here will appear on the dashboard.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg._id} className="module-block" style={{ marginBottom: '1rem' }}>
              {editId === msg._id ? (
                <>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn-submit" onClick={() => handleUpdate(msg._id)}>Save</button>
                    <button className="btn-remove" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: '0.25rem' }}>{msg.content}</p>
                  <small style={{ color: '#888' }}>
                    Posted by {msg.postedBy} · {new Date(msg.createdAt).toLocaleDateString()}
                  </small>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn-add" onClick={() => { setEditId(msg._id); setEditContent(msg.content); }}>
                        Edit
                      </button>
                      {confirmDeleteId === msg._id ? (
                        <div className="inline-confirm">
                          <span>Delete?</span>
                          <button className="btn-confirm-yes" onClick={() => { handleDelete(msg._id); setConfirmDeleteId(null); }}>Yes</button>
                          <button className="btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                        </div>
                      ) : (
                        <button className="btn-remove" onClick={() => setConfirmDeleteId(msg._id)}>Delete</button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminMessages;
