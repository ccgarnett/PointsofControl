import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

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
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data: CourseData[]) => {
        const c = data.find((x) => x._id === id);
        setCourse(c || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleToggleComplete = async (moduleIndex: number) => {
    if (!course) return;
    setToggling(moduleIndex);
    try {
      const res = await fetch(
        `/api/courses/${course._id}/modules/${moduleIndex}/complete`,
        { method: 'PATCH' }
      );
      if (!res.ok) throw new Error('Toggle failed');
      const data = await res.json();
      setCourse(data.course);
    } catch {
      alert('Could not update lesson status. Please try again.');
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="dashboard-layout">Loading...</div>;
  if (!course) return <div className="dashboard-layout">Course not found.</div>;

  const videos = course.videoEmbedLinks || [];
  const modules = course.modules || [];
  const completedCount = modules.filter((m) => m.completed).length;
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

        {modules.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
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
            {modules.map((mod, i) => (
              <div
                key={i}
                className="module-block"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  background: mod.completed ? '#f0fff4' : '#fafafa',
                  borderRadius: 8,
                  border: mod.completed ? '1px solid #68d391' : '1px solid #e2e8f0',
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', textDecoration: mod.completed ? 'line-through' : 'none' }}>
                    {i + 1}. {mod.title}
                  </h4>
                  {mod.contentUrl && (
                    isDocument(mod.contentUrl) ? (
                      <a
                        href={mod.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.8rem',
                          background: '#ebf8ff',
                          color: '#2b6cb0',
                          borderRadius: 4,
                          border: '1px solid #bee3f8',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontSize: '0.9rem',
                        }}
                      >
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
                <button
                  onClick={() => handleToggleComplete(i)}
                  disabled={toggling === i}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: mod.completed ? '#68d391' : '#e2e8f0',
                    color: mod.completed ? '#22543d' : '#4a5568',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getButtonLabel(i, mod.completed)}
                </button>
              </div>
            ))}
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