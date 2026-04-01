import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import DailyChecklist from './DailyChecklist';
import { useAuth } from '../context/AuthContext';
import { SkeletonPage } from './Skeleton';

interface EnrolledCourse {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  progress: number;
  moduleCount: number;
}

interface Reaction {
  userId: string;
  type: string;
}

interface Post {
  _id: string;
  content: string;
  postedBy: string;
  reactions: Reaction[];
  acknowledgedBy: string[];
  createdAt: string;
}

const REACTION_TYPES = ['👍', '❤️', '👏'] as const;

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    document.title = 'Points of Control — Home';
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/users/profile?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setEnrolledCourses(data.enrolledCourses ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPosts(data.slice(0, 3)); })
      .catch(() => { /* non-critical, stay silent */ });
  }, []);

  const handleReact = async (postId: string, type: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/messages/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) return;
      const updated: Post = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
    } catch { /* silent */ }
  };

  const handleAcknowledge = async (postId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/messages/${postId}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const updated: Post = await res.json();
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
    } catch { /* silent */ }
  };

  const countReactions = (post: Post, type: string) =>
    post.reactions.filter((r) => r.type === type).length;

  const hasReacted = (post: Post, type: string) =>
    !!user && post.reactions.some((r) => r.userId === user.id && r.type === type);

  const hasAcknowledged = (post: Post) =>
    !!user && post.acknowledgedBy.includes(user.id);

  if (loading) return <SkeletonPage cards={3} />;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>{user ? `Welcome back, ${user.username}.` : 'Points Of Control'}</h1>
          <h2>Here's where you left off.</h2>
        </header>

        <div className="content-grid">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="section-heading-row">
              <h3 className="section-heading">My Courses</h3>
              {enrolledCourses.length > 0 && (
                <span className="section-count">{enrolledCourses.length}</span>
              )}
            </div>
            {!user ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔑</div>
                <h3>Sign in to see your courses</h3>
                <p>
                  <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link> to track your progress and access purchased courses.
                </p>
              </div>
            ) : error ? (
              <p style={{ color: '#ef4444' }}>Could not load courses.</p>
            ) : enrolledCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📂</div>
                <h3>No courses yet</h3>
                <p>
                  Browse <Link to="/courses" style={{ color: 'var(--accent)' }}>all courses</Link> to get started.
                </p>
              </div>
            ) : (
              <div className="courses-grid">
                {enrolledCourses.map((course) => (
                  <Link key={course._id} to={`/courses/${course._id}`} className="course-card course-card-link">
                    <div className="course-thumbnail">📐</div>
                    <div className="course-info">
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: course.progress + '%' }} />
                      </div>
                      <span className="progress-text">{course.progress}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── Recent Posts ─────────────────────────────────────────────── */}
            {posts.length > 0 && (
              <>
                <div className="section-heading-row" style={{ marginTop: '2rem' }}>
                  <h3 className="section-heading">Recent Posts</h3>
                  <Link to="/messages" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>See all</Link>
                </div>
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className={`module-block${user && !hasAcknowledged(post) ? ' post-unread' : ''}`}
                    style={{ marginBottom: '0.75rem' }}
                  >
                    <p style={{ marginBottom: '0.25rem' }}>{post.content}</p>
                    <small style={{ color: '#888' }}>
                      Posted by {post.postedBy} · {new Date(post.createdAt).toLocaleDateString()}
                    </small>
                    <div className="reaction-bar">
                      {REACTION_TYPES.map((type) => (
                        <button
                          key={type}
                          className={`reaction-btn${hasReacted(post, type) ? ' active' : ''}`}
                          onClick={() => handleReact(post._id, type)}
                          disabled={!user}
                          title={user ? `React with ${type}` : 'Sign in to react'}
                        >
                          {type}{countReactions(post, type) > 0 && <span> {countReactions(post, type)}</span>}
                        </button>
                      ))}
                      {user && user.role !== 'Admin' && (
                        hasAcknowledged(post) ? (
                          <span className="acknowledged-label">✓ Acknowledged</span>
                        ) : (
                          <button className="acknowledge-btn" onClick={() => handleAcknowledge(post._id)}>
                            Acknowledge
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="widget-column">
            <DailyChecklist />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
