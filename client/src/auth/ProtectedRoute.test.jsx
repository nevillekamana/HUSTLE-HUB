//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '@/auth/useAuth';
import { ProtectedRoute } from '@/auth/ProtectedRoute';

//-----------------------------------------------------\\
//                 ROUTE GUARD TESTS
//-----------------------------------------------------\\

//the guards only shape the interface, the api is the real enforcement, but
//a client who is signed out or in the wrong role should never see the page

const renderAt = (user) =>
  render(
    <AuthContext.Provider value={{ user, signedOut: false }}>
      <MemoryRouter initialEntries={['/my-gigs']}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/gigs" element={<p>browse page</p>} />
          <Route
            path="/my-gigs"
            element={
              <ProtectedRoute roles={['freelancer']}>
                <p>freelancer page</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('ProtectedRoute', () => {
  it('sends a signed out visitor to the login page', () => {
    renderAt(null);
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('freelancer page')).not.toBeInTheDocument();
  });

  it('sends a client away from a freelancer only page', () => {
    renderAt({ id: '1', role: 'client' });
    expect(screen.getByText('browse page')).toBeInTheDocument();
    expect(screen.queryByText('freelancer page')).not.toBeInTheDocument();
  });

  it('shows the page to a freelancer', () => {
    renderAt({ id: '2', role: 'freelancer' });
    expect(screen.getByText('freelancer page')).toBeInTheDocument();
  });
});
