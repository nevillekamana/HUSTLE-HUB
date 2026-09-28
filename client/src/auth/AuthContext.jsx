//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { ApiError, MESSAGES, configureApiClient } from '@/api/client';
import * as api from '@/api/endpoints';
import { sessionStore } from '@/auth/sessionStore';
import { AuthContext } from '@/auth/useAuth';

//-----------------------------------------------------\\
//                 API CLIENT WIRING
//-----------------------------------------------------\\

//done once when the module loads, before anything renders, so the very first
//request a page makes already carries the token
//a 401 on any signed in request ends the session everywhere, the route guard
//then does the one redirect and remembers the page the person was on
configureApiClient({
  getToken: sessionStore.getToken,
  onUnauthorized: (message) => sessionStore.end(message)
});

//-----------------------------------------------------\\
//                     AUTH PROVIDER
//-----------------------------------------------------\\

const AuthProvider = ({ children }) => {
  const { session, notice } = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot);

  //refreshes the stored user once on load, so a role changed on the server is
  //picked up and a token that expired while the tab slept is caught early
  //reads the store directly because only the session found on load matters
  useEffect(() => {
    if (!sessionStore.getToken()) {
      return undefined;
    }

    let cancelled = false;

    const refreshProfile = async () => {
      try {
        const { user } = await api.getProfile();

        if (!cancelled && user) {
          sessionStore.refreshUser(user);
        }
      } catch {
        //a 401 is already handled by onUnauthorized, any other failure keeps
        //the stored user so a flaky network does not sign anyone out
      }
    };

    refreshProfile();

    return () => {
      cancelled = true;
    };
    //only on load, a sign in later already hands back a fresh user
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials);

    if (!data || typeof data.token !== 'string' || !data.user) {
      throw new ApiError(500, MESSAGES.generic);
    }

    sessionStore.start({ token: data.token, user: data.user });
    return data.user;
  }, []);

  //registering does not sign in on the api side, the register page decides
  //whether to follow it with a login
  const register = useCallback(async (fields) => {
    const data = await api.register(fields);
    return data.user;
  }, []);

  const logout = useCallback(() => sessionStore.end(), []);

  const value = useMemo(
    () => ({
      user: session ? session.user : null,
      isSignedIn: Boolean(session),
      notice,
      clearNotice: sessionStore.clearNotice,
      login,
      register,
      logout
    }),
    [session, notice, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default AuthProvider;
