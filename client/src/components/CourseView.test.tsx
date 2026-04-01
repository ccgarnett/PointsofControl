import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CourseView from './CourseView';

jest.mock('./Sidebar', () => () => null);

const mockCourse = {
  _id: 'c1',
  courseId: 'POC-101',
  title: 'Mindset 101',
  description: 'Course description here',
  videoEmbedLinks: [],
  modules: [
    { _id: 'm1', title: 'Module 1', contentUrl: 'https://example.com/1', completed: false },
    { _id: 'm2', title: 'Module 2', contentUrl: 'https://example.com/2', completed: true },
  ],
};

const renderCourseView = (id = 'c1') =>
  render(
    <MemoryRouter initialEntries={[`/courses/${id}`]}>
      <Routes>
        <Route path="/courses/:id" element={<CourseView />} />
      </Routes>
    </MemoryRouter>
  );

describe('CourseView component', () => {
  it('shows loading text initially', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;
    renderCourseView();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows course not found when ID does not match any course', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockCourse]),
    }) as jest.Mock;
    renderCourseView('nonexistent');
    await waitFor(() => {
      expect(screen.getByText(/course not found/i)).toBeInTheDocument();
    });
  });

  it('renders course title and description', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockCourse]),
    }) as jest.Mock;
    renderCourseView();
    await waitFor(() => {
      expect(screen.getByText('Mindset 101')).toBeInTheDocument();
      expect(screen.getByText('Course description here')).toBeInTheDocument();
    });
  });

  it('renders all module titles', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockCourse]),
    }) as jest.Mock;
    renderCourseView();
    await waitFor(() => {
      expect(screen.getByText('Module 1')).toBeInTheDocument();
      expect(screen.getByText('Module 2')).toBeInTheDocument();
    });
  });

  it('shows correct progress percentage (1 of 2 complete = 50%)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockCourse]),
    }) as jest.Mock;
    renderCourseView();
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText(/1 \/ 2 lessons/i)).toBeInTheDocument();
    });
  });

  it('shows Mark Complete for incomplete modules and ✓ Done for completed ones', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockCourse]),
    }) as jest.Mock;
    renderCourseView();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /✓ done/i })).toBeInTheDocument();
    });
  });

  it('calls the complete API when Mark Complete is clicked', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([mockCourse]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ completed: true }) }) as jest.Mock;

    renderCourseView();
    await waitFor(() => screen.getByRole('button', { name: /mark complete/i }));
    await userEvent.click(screen.getByRole('button', { name: /mark complete/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const toggleCall = calls.find((c: any[]) => String(c[0]).includes('/complete'));
      expect(toggleCall).toBeDefined();
    });
  });

  it('renders video iframes when videoEmbedLinks are present', async () => {
    const courseWithVideos = { ...mockCourse, videoEmbedLinks: ['https://www.youtube.com/embed/abc'] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([courseWithVideos]),
    }) as jest.Mock;
    renderCourseView();
    await waitFor(() => {
      expect(screen.getByTitle('Video 1')).toBeInTheDocument();
    });
  });

  it('shows "No lessons added yet" when course has no modules', async () => {
    const emptyCourse = { ...mockCourse, modules: [] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([emptyCourse]),
    }) as jest.Mock;
    renderCourseView();
    await waitFor(() => {
      expect(screen.getByText(/no lessons added yet/i)).toBeInTheDocument();
    });
  });

  it('shows course not found when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;
    renderCourseView();
    await waitFor(() => {
      expect(screen.getByText(/course not found/i)).toBeInTheDocument();
    });
  });
});
