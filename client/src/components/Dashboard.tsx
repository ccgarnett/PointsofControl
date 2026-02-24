import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import DailyChecklist from './DailyChecklist';

interface ApiModule {
  title: string;
  contentUrl: string;
  completed: boolean;
}

interface Course {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  modules?: ApiModule[];
  progress: number;
}

const Dashboard: React.FC = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = () => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data: Omit<Course, 'progress'>[]) => {
        const courses: Course[] = data.map((c) => {
          const modules = c.modules || [];
          const completed = modules.filter((m) => m.completed).length;
          const progress = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0;
          return { ...c, progress };
        });
        setEnrolledCourses(courses);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchCourses();
    } catch {
      alert('Could not delete course. Please try again.');
    }
  };

  if (loading) return <div className="dashboard-layout">Loading...</div>;
  if (error) return <div className="dashboard-layout">Error: {error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Your Courses</h2>
        </header>

        <div className="content-grid">
          <div className="courses-grid">
            {enrolledCourses.length === 0 ? (
              <p>No courses yet.</p>
            ) : enrolledCourses.map((course) => (
              <div key={course._id} style={{ position: 'relative' }}>
                <Link to={`/courses/${course._id}`} className="course-card course-card-link">
                  <div className="course-thumbnail">📐</div>
                  <div className="course-info">
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <div className="progress-container">
                      <div
                        className="progress-bar"
                        style={{ width: course.progress + '%' }}
                      />
                    </div>
                    <span className="progress-text">{course.progress}%</span>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(e, course._id)}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
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