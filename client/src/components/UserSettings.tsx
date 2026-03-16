import React, { useState } from 'react';
import Sidebar from './Sidebar';

type Status = { type: 'success' | 'error' | 'info'; text: string } | null;

// Tutorial-style password match helper (kept simple on purpose).
const usePasswordMatch = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isMatch, setIsMatch] = useState(true);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setIsMatch(value === confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setIsMatch(value === password);
  };

  return {
    password,
    confirmPassword,
    isMatch,
    handlePasswordChange,
    handleConfirmPasswordChange,
  };
};



const UserSettings: React.FC = () => {
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState<'update' | 'delete' | null>(null);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    

    const {
      password,
      confirmPassword,
      isMatch,
      handlePasswordChange,
      handleConfirmPasswordChange,
    } = usePasswordMatch();

    const getUserId = () => localStorage.getItem('userId');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if(!isMatch){
        setStatus({type: 'error', text: 'Passwords do not match.'});
        return;
      }

      const userId = getUserId();
      if(!userId){
        setStatus({
          type: 'info',
          text: 'No account found.',
        });
        return;
      }

      setSaving(true);
      setStatus(null);

      try{
        const body = {
          name: name.trim() || undefined,
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          password: password || undefined,
        };

        const res = await fetch (`/api/users/profile?userId=${userId}`,{
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if(!res.ok){
          throw new Error(data.message || 'Failed to save settings.');
        }

        setStatus ({type: 'success', text: 'Settings saved successfully.'});
      }
      catch (err){
        setStatus({
          type: 'error',
          text: (err as Error).message || 'Could not save settings.',
        });
      }
      finally{
        setSaving(false);
      }
    };


    const handleUpdateAccount = async () => {
        const userId = getUserId();
        if(!userId){
            setStatus({type: 'info', text: 'No account found.'});
            return;
        }

        setBusy('update');
        setStatus(null);

        try{
            const res = await fetch(`/api/users/profile?userId=${userId}`,{
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({}),
            });
            if(!res.ok){
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Account update failed.');
            }
            setStatus({type: 'success', text: 'Update completed.'});
        }
        catch(err){
            setStatus({
                type: 'error',
                text: (err as Error).message || 'Could not update account.',
            });
        }
        finally{
            setBusy(null);
        }
    };

    const deleteAccount = async () => {
        const userId = getUserId();
        if(!userId){
            setStatus({type: 'info', text: 'No account found.'});
            return;
        }

        if (!window.confirm('Are you sure you want to delete this account?')) return;
        
        setBusy('delete');
        setStatus(null);
        try {
            const res = await fetch(`/api/users/${userId}`, {method: 'DELETE'});
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to delete account.');
            }

            setStatus ({
                type: 'success',
                text: 'Accoutn deletion completed.'
            });
        }
        catch (err){
            setStatus({
                type: 'error',
                text: (err as Error).message || 'Could not delete account.',
            });
        }
        finally {}
        setBusy(null);
    };


  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Account Settings</h2>
        </header>
        {status && (
          <div
            className={`form-message ${
              status.type === 'info' ? 'info' : status.type}`}
            style={{ marginBottom: '1rem' }}
          >
            {status.text}
          </div>
        )}

        <section className="profile-section">
          <h3>User Settings</h3>

          <form onSubmit={handleSubmit} style={{ maxWidth: 480, marginBottom: '2rem' }}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="New password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm password"
              />
            </div>

            {!isMatch && (
              <p style={{ color: 'red', fontSize: '0.9rem' }}>
                Passwords do not match
              </p>
            )}

            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>

          <h3>Account Actions</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-submit"
              onClick={handleUpdateAccount}
              disabled={busy === 'update' || busy === 'delete'}
            >
              {busy === 'update' ? 'Updating…' : 'Update Account'}
            </button>
            <button
              type="button"
              className="btn-remove"
              onClick={deleteAccount}
              disabled={busy === 'delete' || busy === 'update'}
            >
              {busy === 'delete' ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UserSettings;