import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseDetail from './CourseDetail';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext');
jest.mock('./Sidebar', () => () => null);
jest.mock('./Skeleton', () => ({ SkeletonPage: () => <div>Loading...</div> }));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAuth = (role: string | null, id = 'uid1') =>
  ({
    token: role ? 'test.token' : null,
    user: role ? { id, username: 'chase', role } : null,
    login: jest.fn(),
    logout: jest.fn(),
  } as any);

const mockCourse = {
  _id: 'course1',
  courseId: 'POC-101',
  title: 'Mindset 101',
  description: 'A great course',
  price: 199,
  videoEmbedLinks: [],
  modules: [],
};

const renderDetail = () =>
  render(
    <MemoryRouter initialEntries={['/courses/course1']}>
      <Routes>
        <Route path="/courses/:id" element={<CourseDetail />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  mockUseAuth.mockReturnValue(makeAuth('User'));
  // Fetch order: 1) GET /api/courses, 2) POST pageview, 3) GET progress, then any further calls
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([mockCourse]) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ message: 'Event logged' }) })
    .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ completedModules: [] }) }) as jest.Mock;
});

describe('CourseDetail — Enroll button', () => {
  it('renders the Enroll Now button for non-admin users', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByRole('button', { name: /enroll now/i })).toBeInTheDocument());
  });

  it('displays the course price next to the enroll button', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByText('$199')).toBeInTheDocument());
  });

  it('fires an enroll_click event when Enroll Now is clicked', async () => {
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /enroll now/i }));
    await userEvent.click(screen.getByRole('button', { name: /enroll now/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const clickCall = calls.find(
        (c: any[]) => c[0].includes('/api/analytics/click') && JSON.parse(c[1].body).eventType === 'enroll_click'
      );
      expect(clickCall).toBeDefined();
      expect(JSON.parse(clickCall[1].body)).toMatchObject({ courseId: 'course1', eventType: 'enroll_click' });
    });
  });

  it('shows a success message after clicking Enroll Now', async () => {
    renderDetail();
    await waitFor(() => screen.getByRole('button', { name: /enroll now/i }));
    await userEvent.click(screen.getByRole('button', { name: /enroll now/i }));
    await waitFor(() => expect(screen.getByText(/enrollment request received/i)).toBeInTheDocument());
  });

  it('does not render the Enroll button for admins', async () => {
    mockUseAuth.mockReturnValue(makeAuth('Admin'));
    renderDetail();
    await waitFor(() => expect(screen.getByText('Mindset 101')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /enroll now/i })).not.toBeInTheDocument();
  });

  it('fires a pageview event on mount', async () => {
    renderDetail();
    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const pageviewCall = calls.find(
        (c: any[]) =>
          c[0]?.includes('/api/analytics/click') &&
          c[1]?.body &&
          JSON.parse(c[1].body).eventType === 'pageview'
      );
      expect(pageviewCall).toBeDefined();
      expect(JSON.parse(pageviewCall[1].body)).toMatchObject({ courseId: 'course1', eventType: 'pageview' });
    });
  });
});

describe('CourseDetail — per-user module completion (U9)', () => {
  const mockCourseWithModules = {
    ...mockCourse,
    modules: [
      { title: 'Intro', contentUrl: '/file.pdf', completed: false },
      { title: 'Advanced', contentUrl: '/file2.pdf', completed: false },
    ],
  };

  it('fetches user progress with auth header after loading course', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([mockCourseWithModules]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ message: 'Event logged' }) })
      .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ completedModules: [] }) }) as jest.Mock;

    renderDetail();
    await waitFor(() => screen.getByText(/Mindset 101/));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const progressCall = calls.find((c: any[]) => String(c[0]).includes('/progress'));
      expect(progressCall).toBeDefined();
      expect(progressCall[1].headers.Authorization).toBe('Bearer test.token');
    });
  });

  it('marks the toggle button as Done when module is in completedModules', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([mockCourseWithModules]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ message: 'Event logged' }) })
      .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ completedModules: [0] }) }) as jest.Mock;

    renderDetail();
    await waitFor(() => {
      const doneBtns = screen.getAllByRole('button').filter((b) => b.textContent === 'Done');
      expect(doneBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('sends PATCH with auth header when toggle button is clicked', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([mockCourseWithModules]) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ message: 'Event logged' }) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ completedModules: [] }) })
      .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ completed: true, completedModules: [0] }) }) as jest.Mock;

    renderDetail();
    await waitFor(() => screen.getAllByText('Mark Complete'));

    const markBtns = screen.getAllByText('Mark Complete');
    await userEvent.click(markBtns[0]);

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const patchCall = calls.find((c: any[]) => c[1]?.method === 'PATCH' && String(c[0]).includes('/complete'));
      expect(patchCall).toBeDefined();
      expect(patchCall[1].headers.Authorization).toBe('Bearer test.token');
    });
  });
});

describe('CourseDetail — time on page tracking (A14)', () => {
  it('POSTs a time_on_page event with duration when component unmounts', async () => {
    const { unmount } = renderDetail();
    await waitFor(() => screen.getByText('Mindset 101'));

    unmount();

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const topCall = calls.find(
        (c: any[]) =>
          c[0]?.includes('/api/analytics/click') &&
          c[1]?.body &&
          JSON.parse(c[1].body).eventType === 'time_on_page'
      );
      expect(topCall).toBeDefined();
      const body = JSON.parse(topCall[1].body);
      expect(body.courseId).toBe('course1');
      expect(typeof body.duration).toBe('number');
    });
  });
});
