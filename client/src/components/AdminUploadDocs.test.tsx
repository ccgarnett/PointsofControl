import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminUploadDocs from './AdminUploadDocs';

jest.mock('./Sidebar', () => () => null);

const mockCourses = [
  { _id: 'c1', title: 'Mindset 101', courseId: 'POC-101' },
  { _id: 'c2', title: 'Trading Basics', courseId: 'POC-102' },
];

describe('AdminUploadDocs component', () => {
  it('renders the Upload Documents heading', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCourses),
    }) as jest.Mock;
    render(<MemoryRouter><AdminUploadDocs /></MemoryRouter>);
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
  });

  it('renders the Upload Document button', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCourses),
    }) as jest.Mock;
    render(<MemoryRouter><AdminUploadDocs /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
  });

  it('loads and renders course options in the select', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCourses),
    }) as jest.Mock;
    render(<MemoryRouter><AdminUploadDocs /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Mindset 101 (POC-101)')).toBeInTheDocument();
      expect(screen.getByText('Trading Basics (POC-102)')).toBeInTheDocument();
    });
  });

  it('shows error when no course or file is selected before submit', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCourses),
    }) as jest.Mock;
    render(<MemoryRouter><AdminUploadDocs /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mindset 101 (POC-101)'));
    await userEvent.click(screen.getByRole('button', { name: /upload document/i }));
    expect(screen.getByText(/please select a course and a file/i)).toBeInTheDocument();
  });

  it('shows error when courses cannot be loaded', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;
    render(<MemoryRouter><AdminUploadDocs /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/could not load courses/i)).toBeInTheDocument();
    });
  });

  it('shows success message after upload', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockCourses) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ message: 'ok' }) }) as jest.Mock;

    render(<MemoryRouter><AdminUploadDocs /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mindset 101 (POC-101)'));

    // Select a course
    await userEvent.selectOptions(screen.getByRole('combobox'), 'c1');

    // Upload a file
    const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    await userEvent.click(screen.getByRole('button', { name: /upload document/i }));

    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error message when upload fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockCourses) })
      .mockResolvedValueOnce({ ok: false, json: jest.fn().mockResolvedValue({ message: 'File too large' }) }) as jest.Mock;

    render(<MemoryRouter><AdminUploadDocs /></MemoryRouter>);
    await waitFor(() => screen.getByText('Mindset 101 (POC-101)'));

    await userEvent.selectOptions(screen.getByRole('combobox'), 'c1');
    const file = new File(['hello'], 'big.pdf', { type: 'application/pdf' });
    const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    await userEvent.click(screen.getByRole('button', { name: /upload document/i }));

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    });
  });
});
