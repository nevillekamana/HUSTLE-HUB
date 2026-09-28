//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { MESSAGES } from '@/api/client';
import { useAuth } from '@/auth/useAuth';

//-----------------------------------------------------\\
//                     ROUTE GUARDS
//-----------------------------------------------------\\

//where a signed in person lands, every role may browse gigs
const HOME = '/gigs';

//these guards only shape what the interface offers, the api checks the token
//and the role on every request and is the real enforcement
//signed out goes to sign in and comes back afterwards, a signed in person
//without the right role goes home with a message instead of a blank page
const ProtectedRoute = ({ roles, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME} replace state={{ notice: MESSAGES.forbidden }} />;
  }

  return children || <Outlet />;
};

//only a path on this site is followed, never a full or protocol relative url,
//so a crafted link cannot bounce someone to another site after signing in
const safeReturnPath = (state) => {
  const from = state && state.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : HOME;
};

//sign in and register make no sense to someone already signed in, and the
//moment sign in succeeds this is what sends the person back where they were
const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    return <Navigate to={safeReturnPath(location.state)} replace />;
  }

  return children || <Outlet />;
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { HOME, ProtectedRoute, GuestRoute };
