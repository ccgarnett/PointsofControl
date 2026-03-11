import React, {useState} from 'react';
import Sidebar from './Sidebar';

type Status = {type: 'success' | 'error' | 'info'; text: string} | null;

const UserSettings: React.FC = () => {
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState<'update' | 'delete' | null>(null);

    const getUserId = () => localStorage.getItem('userId');

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
                method: 'PUT',
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
            <div className={`form-message ${status.type === 'info' ? 'info' : status.type}`}
            style={{marginBottom: '1rem'}}>
                {status.text}
            </div>
        )}

        <section className='profile-section'>
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