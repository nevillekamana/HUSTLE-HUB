//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import NavBar from '@/components/NavBar';
import { BrandPrint, PrintDefs } from '@/components/Prints';
import { Alert, AlertDescription } from '@/components/ui/alert';

//-----------------------------------------------------\\
//                     FLASH NOTICE
//-----------------------------------------------------\\

const TONES = {
  info: { variant: 'default', role: 'status', Icon: Info },
  success: { variant: 'success', role: 'status', Icon: CircleCheck },
  error: { variant: 'destructive', role: 'alert', Icon: CircleAlert }
};

//says why the person landed here, a redirect passes its notice along in the
//route state, and the sign in page also shows why the last session ended
//only plain strings are ever shown, never an error object
const Flash = () => {
  const location = useLocation();
  const { notice } = useAuth();
  const state = location.state || {};

  let message = typeof state.notice === 'string' ? state.notice : null;
  let tone = TONES[state.tone] ? state.tone : 'info';

  if (!message && location.pathname === '/login' && notice) {
    message = notice;
    tone = 'info';
  }

  if (!message) {
    return null;
  }

  const { variant, role, Icon } = TONES[tone];

  return (
    <Alert variant={variant} role={role} className="mb-5">
      <Icon aria-hidden="true" className="size-5" />
      <AlertDescription className="text-[15px]">{message}</AlertDescription>
    </Alert>
  );
};

//-----------------------------------------------------\\
//                       APP SHELL
//-----------------------------------------------------\\

//the frame around every page, the header, the print strip and the page itself
//after each move to a new page the view goes back to the top and focus moves
//to the page heading, which is what a screen reader user needs to hear first
//a page without its heading yet, one still loading, focuses the main area
const AppShell = () => {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const shownPath = useRef(pathname);

  useEffect(() => {
    if (shownPath.current === pathname) {
      return;
    }

    shownPath.current = pathname;
    window.scrollTo(0, 0);

    const main = mainRef.current;

    if (main) {
      (main.querySelector('h1') || main).focus({ preventScroll: true });
    }
  }, [pathname]);

  //a plain hash link would count as a navigation in the router, so the skip
  //link moves focus itself
  const skipToContent = (event) => {
    event.preventDefault();

    const main = mainRef.current;

    if (main) {
      (main.querySelector('h1') || main).focus();
    }
  };

  return (
    <>
      <a
        href="#main"
        onClick={skipToContent}
        className="absolute -top-12 left-4 z-50 rounded-[10px] bg-ink px-3.5 py-2 font-semibold text-white focus:top-3"
      >
        Skip to content
      </a>
      <PrintDefs />
      <NavBar />
      <BrandPrint />
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-300 px-6 pt-8 pb-20 max-sm:px-4 max-sm:pt-6"
      >
        <Flash />
        <Outlet />
      </main>
    </>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default AppShell;
