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
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue([mockCourse]) })
    .mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ message: 'Event logged' }) }) as jest.Mock;
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
