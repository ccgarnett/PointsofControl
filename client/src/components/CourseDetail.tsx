import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import VideoEmbed from './VideoEmbed';

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

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="dashboard-layout">Loading...</div>;
  if (!course) return <div className="dashboard-layout">Course not found.</div>;

  const videos = course.videoEmbedLinks || [];
  const modules = course.modules || [];

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <header className="top-header">
          <button type="button" className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>{course.title}</h1>
          <h2>{course.courseId}</h2>
        </header>

        {course.description && (
          <p className="course-description">{course.description}</p>
        )}

        {videos.length > 0 && (
          <section className="course-videos-section">
            <h3>Videos</h3>
            {videos.map((url, i) => (
              <VideoEmbed key={i} url={url} title={`Video ${i + 1}`} />
            ))}
          </section>
        )}

        {modules.length > 0 && (
          <section className="course-modules-section">
            <h3>Modules</h3>
            {modules.map((mod, i) => (
              <div key={i} className="module-block">
                <h4>{mod.title}</h4>
                <VideoEmbed url={mod.contentUrl} title={mod.title} />
              </div>
            ))}
          </section>
        )}

        {videos.length === 0 && modules.length === 0 && (
          <p>No videos in this course yet.</p>
        )}
      </main>
    </div>
  );
};

export default CourseDetail;
