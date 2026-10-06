//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthProvider from '@/auth/AuthContext';
import { GuestRoute, HOME, ProtectedRoute } from '@/auth/ProtectedRoute';
import AppShell from '@/components/AppShell';
import BrowseGigs from '@/pages/BrowseGigs';
import GigDetail from '@/pages/GigDetail';
import Login from '@/pages/Login';
import MyBookings from '@/pages/MyBookings';
import MyGigs from '@/pages/MyGigs';
import NotFound from '@/pages/NotFound';
import Placeholder from '@/pages/Placeholder';
import Register from '@/pages/Register';
import Transactions from '@/pages/Transactions';

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
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="gigs" element={<BrowseGigs />} />
            <Route path="gigs/:id" element={<GigDetail />} />
          </Route>

          <Route element={<ProtectedRoute roles={FREELANCER} />}>
            <Route path="my-gigs" element={<MyGigs />} />
            <Route path="income" element={<Placeholder lead="Your" sticker="income" pageTitle="Income" />} />
          </Route>

          <Route element={<ProtectedRoute roles={CLIENT_OR_FREELANCER} />}>
            <Route path="bookings" element={<MyBookings />} />
            <Route path="transactions" element={<Transactions />} />
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
