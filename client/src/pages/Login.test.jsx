//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { AuthContext } from '@/auth/useAuth';
import Login from '@/pages/Login';

//-----------------------------------------------------\\
//                    LOGIN PAGE TESTS
//-----------------------------------------------------\\

//the page is rendered inside a router and a stand in auth context, so the
//tests exercise the real form and validation without any network

const renderLogin = (login = vi.fn()) => {
  render(
    <AuthContext.Provider value={{ user: null, signedOut: false, login }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );

  return login;
};

describe('Login page rendering', () => {
  it('shows the heading, both fields, the button and a link to register', () => {
    renderLogin();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/welcome/i);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/register');
  });
});

describe('Login page interaction', () => {
  it('shows field errors and does not call the api when the form is empty', async () => {
    const login = renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(login).not.toHaveBeenCalled();
  });

  it('submits the trimmed email and the password as typed', async () => {
    const login = renderLogin(vi.fn().mockResolvedValue(undefined));

    await userEvent.type(screen.getByLabelText('Email'), '  me@example.co.za  ');
    await userEvent.type(screen.getByLabelText('Password'), 'Passw0rd OK');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith({ email: 'me@example.co.za', password: 'Passw0rd OK' });
  });

  it('shows the api message and clears the password after a failed sign in', async () => {
    renderLogin(vi.fn().mockRejectedValue(new ApiError(401, 'invalid email or password')));

    await userEvent.type(screen.getByLabelText('Email'), 'me@example.co.za');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass1');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('invalid email or password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('never renders a raw error, only the safe generic sentence', async () => {
    renderLogin(vi.fn().mockRejectedValue(new Error('MongoServerError: E11000 at /srv/api/models/user.js')));

    await userEvent.type(screen.getByLabelText('Email'), 'me@example.co.za');
    await userEvent.type(screen.getByLabelText('Password'), 'Passw0rd1');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByRole('alert');
    expect(screen.queryByText(/MongoServerError|E11000|\/srv\/api/)).not.toBeInTheDocument();
  });
});
