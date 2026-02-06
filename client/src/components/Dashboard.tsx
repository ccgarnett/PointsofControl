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

  useEffect(() => {
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
  }, []);

  if (loading) {
    return <div className="dashboard-layout">Loading...</div>;
  }
  if (error) {
    return <div className="dashboard-layout">Error: {error}</div>;
  }

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
              <Link key={course._id} to={`/courses/${course._id}`} className="course-card course-card-link">
                <div className="course-thumbnail">
                   {/* Placeholder for course image [cite: 170] */}
                   📐 
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="progress-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{course.progress}%</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Daily Checklist Widget */}
          <div className="widget-column">
            <DailyChecklist />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;