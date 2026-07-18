import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import Login from '../Login';
import * as authAPI from '../../api/authAPI';
import { MemoryRouter } from 'react-router-dom';

describe('Login page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('shows client-side field errors for invalid email and short password', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/john@company.com/i);
    const passwordInput = screen.getByPlaceholderText(/\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022/);
    const submit = screen.getByRole('button', { name: /Sign in as/i });

    fireEvent.change(emailInput, { target: { value: 'bad-email' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
      expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 8 characters.');
    });
  });

  test('shows server error when login fails', async () => {
    vi.spyOn(authAPI, 'login').mockRejectedValue({ response: { data: { message: 'Invalid email or password.' } } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/john@company.com/i);
    const passwordInput = screen.getByPlaceholderText(/\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022/);
    const submit = screen.getByRole('button', { name: /Sign in as/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'longenoughpassword' } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
    });
  });

  test('stores tokens on successful login', async () => {
    vi.spyOn(authAPI, 'login').mockResolvedValue({ data: { access_token: 'a', refresh_token: 'r' } });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/john@company.com/i);
    const passwordInput = screen.getByPlaceholderText(/\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022/);
    const submit = screen.getByRole('button', { name: /Sign in as/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'longenoughpassword' } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('a');
      expect(localStorage.getItem('refresh_token')).toBe('r');
    });
  });
});
