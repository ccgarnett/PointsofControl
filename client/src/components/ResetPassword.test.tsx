import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPassword from './ResetPassword';

const renderWithToken = () =>
  render(
    <MemoryRouter initialEntries={['/reset-password/abc123']}>
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

const getPasswordInputs = () => {
  const inputs = document.querySelectorAll('input[type="password"]');
  return { pwInput: inputs[0] as HTMLElement, confirmInput: inputs[1] as HTMLElement };
};

describe('ResetPassword component', () => {
  it('renders the Reset Password heading', () => {
    renderWithToken();
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('renders a Back to Sign In link', () => {
    renderWithToken();
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('renders both password inputs and submit button', () => {
    renderWithToken();
    const inputs = document.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBe(2);
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows validation error for password shorter than 8 characters', async () => {
    renderWithToken();
    const { pwInput, confirmInput } = getPasswordInputs();
    await userEvent.type(pwInput, 'Short1');
    await userEvent.type(confirmInput, 'Short1');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when password has no uppercase letter', async () => {
    renderWithToken();
    const { pwInput, confirmInput } = getPasswordInputs();
    await userEvent.type(pwInput, 'lowercase1');
    await userEvent.type(confirmInput, 'lowercase1');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText(/uppercase/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when password has no number', async () => {
    renderWithToken();
    const { pwInput, confirmInput } = getPasswordInputs();
    await userEvent.type(pwInput, 'NoNumbers!');
    await userEvent.type(confirmInput, 'NoNumbers!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least one number/i)).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    renderWithToken();
    const { pwInput, confirmInput } = getPasswordInputs();
    await userEvent.type(pwInput, 'ValidPass1');
    await userEvent.type(confirmInput, 'Different1');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('navigates to /login on successful password reset', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ message: 'Password reset' }),
    }) as jest.Mock;

    renderWithToken();
    const { pwInput, confirmInput } = getPasswordInputs();
    await userEvent.type(pwInput, 'ValidPass1');
    await userEvent.type(confirmInput, 'ValidPass1');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('shows server error when reset fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Invalid or expired token' }),
    }) as jest.Mock;

    renderWithToken();
    const { pwInput, confirmInput } = getPasswordInputs();
    await userEvent.type(pwInput, 'ValidPass1');
    await userEvent.type(confirmInput, 'ValidPass1');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
    });
  });

  it('disables button while request is in flight', async () => {
    let resolve: any;
    global.fetch = jest.fn().mockReturnValue(new Promise((r) => { resolve = r; })) as jest.Mock;

    renderWithToken();
    const { pwInput, confirmInput } = getPasswordInputs();
    await userEvent.type(pwInput, 'ValidPass1');
    await userEvent.type(confirmInput, 'ValidPass1');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
    resolve({ ok: true, json: () => Promise.resolve({}) });
  });
});
