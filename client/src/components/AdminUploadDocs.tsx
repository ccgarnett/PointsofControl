import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

interface Course {
  _id: string;
  title: string;
  courseId: string;
}

const AdminUploadDocs: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => setStatus({ type: 'error', text: 'Could not load courses' }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !file) {
      setStatus({ type: 'error', text: 'Please select a course and a file' });
      return;
    }

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('moduleTitle', moduleTitle || file.name);

    try {
      const res = await fetch(`/api/courses/${selectedCourse}/docs`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setStatus({ type: 'success', text: `"${file.name}" uploaded successfully!` });
      setModuleTitle('');
      setFile(null);
      setSelectedCourse('');
      (document.getElementById('doc-file-input') as HTMLInputElement).value = '';
    } catch (err) {
      setStatus({ type: 'error', text: (err as Error).message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Upload Documents</h2>
        </header>

        {status && (
          <div className={`form-message ${status.type}`} style={{ marginBottom: '1rem' }}>
            {status.text}
          </div>
        )}

        <form className="create-course-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Course *</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">— Choose a course —</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.courseId})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Module Title (optional)</label>
            <input
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="e.g. Week 1 Reading"
            />
          </div>

          <div className="form-group">
            <label>Document File * (PDF, DOC, DOCX, TXT)</label>
            <input
              id="doc-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <button type="submit" disabled={uploading} className="btn-submit">
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AdminUploadDocs;
