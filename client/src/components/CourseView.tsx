import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';

interface Module {
  _id: string;
  title: string;
  contentUrl: string;
  completed: boolean;
}

interface Course {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  videoEmbedLinks: string[];
  modules: Module[];
}

const CourseView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/courses`)
      .then((res) => res.json())
      .then((data: Course[]) => {
        const found = data.find((c) => c._id === id) || null;
        setCourse(found);
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [id]);

  const toggleComplete = async (moduleIndex: number) => {
    if (!course) return;
    setToggling(moduleIndex);

    try {
      const res = await fetch(`/api/courses/${course._id}/modules/${moduleIndex}/complete`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state to reflect the toggle
        const updatedModules = course.modules.map((m, i) =>
          i === moduleIndex ? { ...m, completed: data.completed } : m
        );
        setCourse({ ...course, modules: updatedModules });
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="dashboard-layout">Loading...</div>;
  if (error || !course) return <div className="dashboard-layout">Course not found.</div>;

  const completedCount = course.modules.filter((m) => m.completed).length;
  const progress = course.modules.length > 0
    ? Math.round((completedCount / course.modules.length) * 100)
    : 0;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <Link to="/" className="back-link">← Back to Dashboard</Link>
          <h1>{course.title}</h1>
          {course.description && <p>{course.description}</p>}
        </header>

        {/* Overall Progress */}
        <div className="course-progress-section">
          <div className="progress-header">
            <span>Your Progress</span>
            <span>{completedCount} / {course.modules.length} lessons complete</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{progress}%</span>
        </div>

        {/* Video Embeds */}
        {course.videoEmbedLinks.length > 0 && (
          <section className="course-section">
            <h3>Videos</h3>
            <div className="video-grid">
              {course.videoEmbedLinks.map((url, i) => (
                <iframe
                  key={i}
                  src={url}
                  title={`Video ${i + 1}`}
                  frameBorder="0"
                  allowFullScreen
                  className="video-embed"
                />
              ))}
            </div>
          </section>
        )}

        {/* Modules / Lesson Tracking */}
        <section className="course-section">
          <h3>Lessons</h3>
          {course.modules.length === 0 ? (
            <p>No lessons added yet.</p>
          ) : (
            <ul className="modules-list">
              {course.modules.map((mod, i) => (
                <li key={i} className={`module-item ${mod.completed ? 'module-completed' : ''}`}>
                  <div className="module-info">
                    <span className="module-number">{i + 1}</span>
                    <div>
                      <p className="module-title">{mod.title}</p>
                      <a
                        href={mod.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="module-link"
                      >
                        View Content →
                      </a>
                    </div>
                  </div>
                  <button
                    className={`btn-complete ${mod.completed ? 'btn-complete-done' : ''}`}
                    onClick={() => toggleComplete(i)}
                    disabled={toggling === i}
                  >
                    {toggling === i ? '...' : mod.completed ? '✓ Done' : 'Mark Complete'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default CourseView;
