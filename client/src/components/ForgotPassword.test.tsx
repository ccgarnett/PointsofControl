import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

describe('ForgotPassword component', () => {
  it('renders the heading and email input', () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('renders a Back to Sign In link', () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('shows success message after successful submit', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: 'sent' }),
    }) as jest.Mock;

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    await userEvent.type(screen.getByRole('textbox'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/reset link/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument();
  });

  it('shows error message when the request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Email not found' }),
    }) as jest.Mock;

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    await userEvent.type(screen.getByRole('textbox'), 'missing@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });

  it('disables the button while the request is in flight', async () => {
    let resolve: any;
    global.fetch = jest.fn().mockReturnValue(new Promise((r) => { resolve = r; })) as jest.Mock;

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    await userEvent.type(screen.getByRole('textbox'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    resolve({ ok: true, json: () => Promise.resolve({ message: 'sent' }) });
  });

  it('shows generic error when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure')) as jest.Mock;

    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    await userEvent.type(screen.getByRole('textbox'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/network failure/i)).toBeInTheDocument();
    });
  });
});
