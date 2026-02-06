import React, { useState } from 'react';
import Sidebar from './Sidebar';

interface ModuleInput {
  title: string;
  contentUrl: string;
}

const CreateCourse: React.FC = () => {
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [videoEmbedLinks, setVideoEmbedLinks] = useState<string[]>(['']);
  const [modules, setModules] = useState<ModuleInput[]>([{ title: '', contentUrl: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addVideoLink = () => setVideoEmbedLinks([...videoEmbedLinks, '']);
  const removeVideoLink = (i: number) => setVideoEmbedLinks(videoEmbedLinks.filter((_, idx) => idx !== i));
  const updateVideoLink = (i: number, v: string) => {
    const next = [...videoEmbedLinks];
    next[i] = v;
    setVideoEmbedLinks(next);
  };

  const addModule = () => setModules([...modules, { title: '', contentUrl: '' }]);
  const removeModule = (i: number) => setModules(modules.filter((_, idx) => idx !== i));
  const updateModule = (i: number, field: 'title' | 'contentUrl', v: string) => {
    const next = [...modules];
    next[i] = { ...next[i], [field]: v };
    setModules(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title,
          description,
          price: parseFloat(price),
          videoEmbedLinks: videoEmbedLinks.filter((u) => u.trim()),
          modules: modules
            .filter((m) => m.title.trim() && m.contentUrl.trim())
            .map((m) => ({ ...m, completed: false })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create course');
      setMessage({ type: 'success', text: 'Course created successfully!' });
      setCourseId('');
      setTitle('');
      setDescription('');
      setPrice('');
      setVideoEmbedLinks(['']);
      setModules([{ title: '', contentUrl: '' }]);
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Create Course</h2>
        </header>

        <form className="create-course-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course ID *</label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="e.g. POC-101"
              required
            />
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course description"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Price *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Video Embed URLs</label>
            <p className="form-hint">Add video embed links (e.g. YouTube embed URLs)</p>
            {videoEmbedLinks.map((url, i) => (
              <div key={i} className="input-row">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateVideoLink(i, e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                />
                <button type="button" onClick={() => removeVideoLink(i)} className="btn-remove">
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addVideoLink} className="btn-add">
              + Add Video Link
            </button>
          </div>

          <div className="form-group">
            <label>Modules (with embedded videos)</label>
            <p className="form-hint">Each module can have a video embed URL as contentUrl</p>
            {modules.map((mod, i) => (
              <div key={i} className="module-row">
                <input
                  type="text"
                  value={mod.title}
                  onChange={(e) => updateModule(i, 'title', e.target.value)}
                  placeholder="Module title"
                />
                <input
                  type="url"
                  value={mod.contentUrl}
                  onChange={(e) => updateModule(i, 'contentUrl', e.target.value)}
                  placeholder="Video embed URL"
                />
                <button type="button" onClick={() => removeModule(i)} className="btn-remove">
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addModule} className="btn-add">
              + Add Module
            </button>
          </div>

          {message && (
            <div className={`form-message ${message.type}`}>{message.text}</div>
          )}

          <button type="submit" disabled={submitting} className="btn-submit">
            {submitting ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreateCourse;
