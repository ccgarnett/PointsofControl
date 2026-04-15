import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { SkeletonPage } from './Skeleton';
import { useAuth } from '../context/AuthContext';

interface Module {
  title: string;
  contentUrl: string;
  completed: boolean;
}

interface CourseData {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  videoEmbedLinks?: string[];
  modules?: Module[];
  price: number;
}

const isDocument = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  return ['pdf', 'doc', 'docx', 'txt'].includes(ext || '');
};

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [enrollClicked, setEnrollClicked] = useState(false);
  const enteredAt = useRef<number>(Date.now());
  const [completedModules, setCompletedModules] = useState<number[]>([]);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data: CourseData[]) => {
        const c = data.find((x) => x._id === id);
        setCourse(c || null);
        setLoading(false);

        if (c) {
          fetch('/api/analytics/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: c._id, userId: null, eventType: 'pageview' }),
          }).catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!course) return;
    await fetch('/api/analytics/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course._id, userId: user?.id ?? null, eventType: 'enroll_click' }),
    }).catch(() => {});
    setEnrollClicked(true);
  };

  useEffect(() => {
    document.title = course ? `Points of Control — ${course.title}` : 'Points of Control';
  }, [course]);

  // Fetch per-user progress when course and token are available
  useEffect(() => {
    if (!course || !token) return;
    fetch(`/api/courses/${course._id}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.completedModules)) {
          setCompletedModules(data.completedModules);
        }
      })
      .catch(() => {});
  }, [course, token]);

  // Track time on page — POST duration when component unmounts
  useEffect(() => {
    if (!course) return;
    const courseId = course._id;
    const entered = enteredAt.current;

    const postDuration = () => {
      const duration = Math.round((Date.now() - entered) / 1000); // seconds
      fetch('/api/analytics/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, userId: user?.id ?? null, eventType: 'time_on_page', duration }),
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', postDuration);
    return () => {
      window.removeEventListener('beforeunload', postDuration);
      postDuration();
    };
  }, [course]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleComplete = async (moduleIndex: number) => {
    if (!course || !token) return;
    setToggling(moduleIndex);
    try {
      const res = await fetch(
        `/api/courses/${course._id}/modules/${moduleIndex}/complete`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error('Toggle failed');
      const data = await res.json();
      if (Array.isArray(data.completedModules)) {
        setCompletedModules(data.completedModules);
      }
    } catch {
      alert('Could not update lesson status. Please try again.');
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <SkeletonPage cards={2} />;
  if (!course) return <div className="dashboard-layout">Course not found.</div>;

  const videos = course.videoEmbedLinks || [];
  const modules = course.modules || [];
  const completedCount = completedModules.length;
  const progress = modules.length > 0
    ? Math.round((completedCount / modules.length) * 100)
    : 0;

  const getButtonLabel = (idx: number, completed: boolean): string => {
    if (toggling === idx) return '...';
    return completed ? 'Done' : 'Mark Complete';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <header className="top-header">
          <button type="button" className="btn-back" onClick={() => navigate(-1)}>
            Back
          </button>
          <h1>{course.title}</h1>
          <h2>{course.courseId}</h2>
        </header>

        {course.description && (
          <p className="course-description">{course.description}</p>
        )}

        {/* ── Enroll CTA ───────────────────────────────────────────────────── */}
        {user?.role !== 'Admin' && (
          <div className="enroll-cta">
            <span className="enroll-price">${course.price.toLocaleString()}</span>
            {enrollClicked ? (
              <span className="enroll-success">✓ Enrollment request received!</span>
            ) : (
              <button className="btn-enroll" onClick={handleEnroll}>
                Enroll Now
              </button>
            )}
          </div>
        )}

        {modules.length > 0 && (
          <div className="course-progress-bar-wrap">
            <p style={{ marginBottom: '0.25rem' }}>
              {completedCount} / {modules.length} lessons complete
            </p>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: progress + '%' }} />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}

        {videos.length > 0 && (
          <section className="course-videos-section">
            <h3>Videos</h3>
            {videos.map((url, i) => (
              <div key={i} className="video-embed-wrapper">
                <iframe
                  src={url}
                  title={'Video ' + (i + 1)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </section>
        )}

        {modules.length > 0 && (
          <section className="course-modules-section">
            <h3>Modules</h3>
            {modules.map((mod, i) => {
              const isDone = completedModules.includes(i);
              return (
                <div key={i} className={`module-block${isDone ? ' completed' : ''}`}>
                  <div className="module-block-body">
                    <h4 className={`module-block-title${isDone ? ' done' : ''}`}>
                      {i + 1}. {mod.title}
                    </h4>
                    {mod.contentUrl && (
                      isDocument(mod.contentUrl) ? (
                        <a href={mod.contentUrl} target="_blank" rel="noreferrer" className="module-doc-link">
                          📄 View Document
                        </a>
                      ) : (
                        <div className="video-embed-wrapper">
                          <iframe
                            src={mod.contentUrl}
                            title={mod.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )
                    )}
                  </div>
                  {token && (
                    <button onClick={() => handleToggleComplete(i)} disabled={toggling === i} className={`module-toggle-btn${isDone ? ' done' : ''}`}>
                      {getButtonLabel(i, isDone)}
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {videos.length === 0 && modules.length === 0 && (
          <p>No content in this course yet.</p>
        )}
      </main>
    </div>
  );
};

export default CourseDetail;
