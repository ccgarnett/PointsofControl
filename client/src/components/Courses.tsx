import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { SkeletonPage } from './Skeleton';

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

const Courses: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Points of Control — Courses';
  }, []);

  const fetchCourses = () => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data: Omit<Course, 'progress'>[]) => {
        const mapped: Course[] = data.map((c) => {
          const modules = c.modules || [];
          const completed = modules.filter((m) => m.completed).length;
          const progress = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0;
          return { ...c, progress };
        });
        setCourses(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchCourses();
    } catch {
      alert('Could not delete course. Please try again.');
    }
  };

  if (loading) return <SkeletonPage cards={4} />;
  if (error) return <div className="dashboard-layout">Error: {error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Courses</h1>
          <h2>Browse everything available to you.</h2>
        </header>

        {courses.length > 0 && (
          <div className="section-heading-row" style={{ marginBottom: '1rem' }}>
            <h3 className="section-heading">All Courses</h3>
            <span className="section-count">{courses.length}</span>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3>No courses available yet</h3>
            <p>Check back soon — new courses will appear here.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course._id} style={{ position: 'relative' }}>
                <Link to={`/courses/${course._id}`} className="course-card course-card-link">
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
                {isAdmin && (
                  confirmDeleteId === course._id ? (
                    <div className="course-card-confirm">
                      <span>Delete?</span>
                      <button className="btn-confirm-yes" onClick={(e) => { e.preventDefault(); handleDelete(e, course._id); setConfirmDeleteId(null); }}>Yes</button>
                      <button className="btn-confirm-no" onClick={(e) => { e.preventDefault(); setConfirmDeleteId(null); }}>No</button>
                    </div>
                  ) : (
                    <button className="btn-delete-course" onClick={(e) => { e.preventDefault(); setConfirmDeleteId(course._id); }}>
                      Delete
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
