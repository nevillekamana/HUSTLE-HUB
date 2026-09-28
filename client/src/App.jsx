//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthProvider from '@/auth/AuthContext';
import { GuestRoute, HOME, ProtectedRoute } from '@/auth/ProtectedRoute';
import AppShell from '@/components/AppShell';
import NotFound from '@/pages/NotFound';
import Placeholder from '@/pages/Placeholder';

//-----------------------------------------------------\\
//                    ROLES PER ROUTE
//-----------------------------------------------------\\

//who may open each group of pages, straight from the plan's page table
const FREELANCER = ['freelancer'];
const CLIENT_OR_FREELANCER = ['client', 'freelancer'];
const ADMIN = ['admin'];

//-----------------------------------------------------\\
//                     APP COMPONENT
//-----------------------------------------------------\\

//every page sits inside the shell, sign in and register are for guests only,
//browsing is open to every signed in role and the rest follow the role lists
//unknown addresses fall through to not found, signed in or not
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={HOME} replace />} />

          <Route element={<GuestRoute />}>
            <Route path="login" element={<Placeholder lead="Welcome" sticker="back" pageTitle="Sign in" />} />
            <Route
              path="register"
              element={<Placeholder lead="Create your" sticker="account" pageTitle="Create account" />}
            />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="gigs" element={<Placeholder lead="Browse" sticker="gigs" pageTitle="Browse gigs" />} />
            <Route path="gigs/:id" element={<Placeholder lead="Gig" sticker="detail" pageTitle="Gig detail" />} />
          </Route>

          <Route element={<ProtectedRoute roles={FREELANCER} />}>
            <Route path="my-gigs" element={<Placeholder lead="My" sticker="gigs" pageTitle="My gigs" />} />
            <Route path="income" element={<Placeholder lead="Your" sticker="income" pageTitle="Income" />} />
          </Route>

          <Route element={<ProtectedRoute roles={CLIENT_OR_FREELANCER} />}>
            <Route path="bookings" element={<Placeholder lead="My" sticker="bookings" pageTitle="My bookings" />} />
            <Route
              path="transactions"
              element={<Placeholder lead="Your" sticker="transactions" pageTitle="Transactions" />}
            />
          </Route>

          <Route element={<ProtectedRoute roles={ADMIN} />}>
            <Route path="admin" element={<Placeholder lead="Admin" sticker="overview" pageTitle="Admin" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default App;
