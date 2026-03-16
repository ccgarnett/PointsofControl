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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
