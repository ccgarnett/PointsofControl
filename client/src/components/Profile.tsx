import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

interface CourseProgress {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  progress: number;
  moduleCount: number;
}

interface ProfileData {
  _id: string;
  username: string;
  email?: string;
  name?: string;
  age?: number;
  pronouns?: string;
  bio?: string;
  profilePictureUrl?: string;
  role: string;
  enrolledCourses: CourseProgress[];
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', pronouns: '', bio: '' });

  const loadProfile = () => {
    fetch('/api/users/profile')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || '',
          age: data.age !== undefined && data.age !== null ? String(data.age) : '',
          pronouns: data.pronouns || '',
          bio: data.bio || '',
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || undefined,
          age: form.age ? parseInt(form.age, 10) : undefined,
          pronouns: form.pronouns || undefined,
          bio: form.bio || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      setProfile((p) => (p ? { ...p, ...data } : null));
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('picture', file);
    try {
      const res = await fetch('/api/users/profile/picture', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setProfile((p) => (p ? { ...p, profilePictureUrl: data.profilePictureUrl } : null));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="dashboard-layout">Loading profile...</div>;
  if (error && !profile) return <div className="dashboard-layout">Error: {error}</div>;
  if (!profile) return null;

  const pictureUrl = profile.profilePictureUrl
    ? (profile.profilePictureUrl.startsWith('http') ? profile.profilePictureUrl : profile.profilePictureUrl)
    : null;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Your Account</h2>
        </header>

        <div className="profile-section">
          <h3>Profile Settings</h3>
          <div className="profile-settings-card profile-settings-with-picture">
            <div className="profile-picture-section">
              <div className="profile-picture-wrapper">
                {pictureUrl ? (
                  <img
                    src={pictureUrl}
                    alt="Profile"
                    className="profile-picture"
                  />
                ) : (
                  <div className="profile-picture-placeholder">👤</div>
                )}
                <label className="profile-picture-upload-btn">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handlePictureUpload}
                    disabled={uploading}
                  />
                  {uploading ? 'Uploading...' : 'Upload photo'}
                </label>
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="profile-edit-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="Age"
                  />
                </div>
                <div className="form-group">
                  <label>Pronouns</label>
                  <input
                    type="text"
                    value={form.pronouns}
                    onChange={(e) => setForm({ ...form, pronouns: e.target.value })}
                    placeholder="e.g. she/her, he/him, they/them"
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
                <div className="profile-form-actions">
                  <button type="submit" disabled={saving} className="btn-submit">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email || '—'}</p>
                <p><strong>Name:</strong> {profile.name || '—'}</p>
                <p><strong>Age:</strong> {profile.age ?? '—'}</p>
                <p><strong>Pronouns:</strong> {profile.pronouns || '—'}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                {profile.bio && (
                  <p className="profile-bio"><strong>Bio:</strong><br />{profile.bio}</p>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn-edit-profile"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3>Course Progress</h3>
          {profile.enrolledCourses.length === 0 ? (
            <p>You are not enrolled in any courses yet.</p>
          ) : (
            <div className="courses-grid">
              {profile.enrolledCourses.map((course) => (
                <Link key={course._id} to={`/courses/${course._id}`} className="course-card course-card-link">
                  <div className="course-info">
                    <h3>{course.title}</h3>
                    <p>{course.courseId}</p>
                    <div className="progress-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{course.progress}% complete</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
