import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateCourse from './CreateCourse';

jest.mock('./Sidebar', () => () => null);

describe('CreateCourse component', () => {
  it('renders the Create Course heading', () => {
    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Create Course' })).toBeInTheDocument();
  });

  it('renders required form fields', () => {
    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/POC-101/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/course title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0\.00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
  });

  it('adds a second video link field when Add Video Link is clicked', async () => {
    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    const before = screen.getAllByPlaceholderText(/youtube/i).length;
    await userEvent.click(screen.getByRole('button', { name: /add video link/i }));
    expect(screen.getAllByPlaceholderText(/youtube/i).length).toBe(before + 1);
  });

  it('removes a video link when Remove is clicked', async () => {
    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /add video link/i }));
    const removeButtons = screen.getAllByRole('button', { name: /^remove$/i });
    const countBefore = screen.getAllByPlaceholderText(/youtube/i).length;
    await userEvent.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText(/youtube/i).length).toBe(countBefore - 1);
  });

  it('adds a module row when Add Module is clicked', async () => {
    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    const before = screen.getAllByPlaceholderText(/module title/i).length;
    await userEvent.click(screen.getByRole('button', { name: /add module/i }));
    expect(screen.getAllByPlaceholderText(/module title/i).length).toBe(before + 1);
  });

  it('removes a module row when its Remove is clicked', async () => {
    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    // Start: 1 module row. Add one more → 2 rows.
    await userEvent.click(screen.getByRole('button', { name: /add module/i }));
    expect(screen.getAllByPlaceholderText(/module title/i).length).toBe(2);
    // The module-row Remove buttons come after the video-link Remove buttons in the DOM.
    // Click the last Remove button (belongs to a module row).
    const removeButtons = screen.getAllByRole('button', { name: /^remove$/i });
    await userEvent.click(removeButtons[removeButtons.length - 1]);
    expect(screen.getAllByPlaceholderText(/module title/i).length).toBe(1);
  });

  it('shows success message after successful course creation', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ _id: 'c1', title: 'New Course' }),
    }) as jest.Mock;

    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/POC-101/i), 'POC-201');
    await userEvent.type(screen.getByPlaceholderText(/course title/i), 'My Course');
    await userEvent.type(screen.getByPlaceholderText(/0\.00/), '99.99');
    await userEvent.click(screen.getByRole('button', { name: /create course/i }));

    await waitFor(() => {
      expect(screen.getByText(/course created successfully/i)).toBeInTheDocument();
    });
  });

  it('resets form fields after successful creation', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ _id: 'c1' }),
    }) as jest.Mock;

    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/POC-101/i), 'POC-201');
    await userEvent.type(screen.getByPlaceholderText(/course title/i), 'My Course');
    await userEvent.type(screen.getByPlaceholderText(/0\.00/), '0');
    await userEvent.click(screen.getByRole('button', { name: /create course/i }));

    await waitFor(() => screen.getByText(/course created successfully/i));
    expect((screen.getByPlaceholderText(/POC-101/i) as HTMLInputElement).value).toBe('');
  });

  it('shows error message when course creation fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Duplicate course ID' }),
    }) as jest.Mock;

    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/POC-101/i), 'POC-101');
    await userEvent.type(screen.getByPlaceholderText(/course title/i), 'Existing Course');
    await userEvent.type(screen.getByPlaceholderText(/0\.00/), '0');
    await userEvent.click(screen.getByRole('button', { name: /create course/i }));

    await waitFor(() => {
      expect(screen.getByText(/duplicate course id/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while creating', async () => {
    let resolve: any;
    global.fetch = jest.fn().mockReturnValue(new Promise((r) => { resolve = r; })) as jest.Mock;

    render(<MemoryRouter><CreateCourse /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText(/POC-101/i), 'POC-999');
    await userEvent.type(screen.getByPlaceholderText(/course title/i), 'Test');
    await userEvent.type(screen.getByPlaceholderText(/0\.00/), '10');
    await userEvent.click(screen.getByRole('button', { name: /create course/i }));

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    resolve({ ok: true, json: () => Promise.resolve({ _id: 'c1' }) });
  });
});
