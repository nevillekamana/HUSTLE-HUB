//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { HOME } from '@/auth/ProtectedRoute';
import { useAuth } from '@/auth/useAuth';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

//-----------------------------------------------------\\
//                    LINKS PER ROLE
//-----------------------------------------------------\\

//only the pages a role may open are offered, the route guards and the api
//still refuse the rest if someone types the address in
const NAV_LINKS = {
  client: [
    ['/gigs', 'Browse gigs'],
    ['/bookings', 'My bookings'],
    ['/transactions', 'Transactions']
  ],
  freelancer: [
    ['/gigs', 'Browse gigs'],
    ['/my-gigs', 'My gigs'],
    ['/bookings', 'My bookings'],
    ['/transactions', 'Transactions'],
    ['/income', 'Income']
  ],
  admin: [
    ['/gigs', 'Browse gigs'],
    ['/admin', 'Admin']
  ]
};

const ROLE_LABELS = { client: 'Client', freelancer: 'Freelancer', admin: 'Admin' };

//first and last initial, so a long name still fits the round badge
const initials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (parts[0][0] + last).toUpperCase();
};

//-----------------------------------------------------\\
//                     SHARED STYLES
//-----------------------------------------------------\\

//white outline pills that read on the teal band and fill white on hover
const LIGHT_BUTTON =
  'inline-flex min-h-9.5 items-center rounded-full border-2 border-white px-4 font-bold whitespace-nowrap text-white transition-colors hover:bg-white hover:text-primary';

//-----------------------------------------------------\\
//                        NAV BAR
//-----------------------------------------------------\\

//the teal band across the top, the logo leads home, the links follow the
//role, and the right hand side is either the account or the ways in
//on a phone the links drop to their own row and scroll sideways, the padding
//and matching negative margin on that row leave room for the focus ring,
//which the scrolling box would otherwise clip
const NavBar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const links = user ? NAV_LINKS[user.role] || [] : [];

  //on a narrow screen the current page's link can sit past the edge of the
  //scrolling row, so the row slides it into view, the page itself never moves
  useEffect(() => {
    const nav = navRef.current;
    const current = nav && nav.querySelector('[aria-current="page"]');

    if (!current) {
      return;
    }

    const row = nav.getBoundingClientRect();
    const link = current.getBoundingClientRect();

    if (link.left < row.left || link.right > row.right) {
      nav.scrollLeft += link.left - row.left - 6;
    }
  }, [pathname, user]);

  return (
    <header className="bg-primary text-white [&_:focus-visible]:outline-white">
      <div className="mx-auto flex min-h-17 max-w-300 flex-wrap items-center gap-x-5 gap-y-2 px-6 py-2.5 max-sm:px-4">
        <Link to={user ? HOME : '/login'} className="rounded-lg">
          <Logo onDark />
        </Link>

        {links.length > 0 && (
          <nav
            ref={navRef}
            aria-label="Main"
            className="-m-1.5 flex gap-1 overflow-x-auto p-1.5 [scrollbar-width:none] max-md:order-3 max-md:w-[calc(100%+0.75rem)]"
          >
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 font-semibold whitespace-nowrap',
                    isActive ? 'bg-aqua text-ink' : 'text-white hover:bg-white/15'
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span
                aria-hidden="true"
                className="grid size-8 flex-none place-items-center rounded-full bg-aqua text-[11px] font-bold text-ink"
              >
                {initials(user.fullName)}
              </span>
              <span className="flex flex-col leading-tight max-md:hidden">
                <span className="font-semibold">{user.fullName}</span>
                <span className="text-[11px] font-bold tracking-[0.08em] text-aqua uppercase">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </span>
              <button type="button" onClick={logout} className={LIGHT_BUTTON}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md font-semibold text-white hover:text-aqua">
                Sign in
              </Link>
              <Link to="/register" className={LIGHT_BUTTON}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default NavBar;
