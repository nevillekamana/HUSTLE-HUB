//-----------------------------------------------------\\
//                   STORAGE AND SHAPE
//-----------------------------------------------------\\

//sessionStorage survives a refresh and is emptied when the tab closes, the
//trade off the plan chose over an httponly cookie (section 3), the strict
//content security policy is what stops an injected script from reading it
//the token lives here and in memory only, never in a url or a log
const SESSION_KEY = 'hustlehub.session';

//anything malformed is treated as no session rather than trusted
const readStored = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    const valid = stored && typeof stored.token === 'string' && stored.token !== '' && stored.user && typeof stored.user.role === 'string';
    return valid ? { token: stored.token, user: stored.user } : null;
  } catch {
    return null;
  }
};

const persist = (session) => {
  try {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    //blocked storage only costs the refresh, the session still lives in memory
  }
};

//-----------------------------------------------------\\
//                     SESSION STORE
//-----------------------------------------------------\\

//lives outside react so the api client can read the token without a hook,
//react subscribes to it through useSyncExternalStore
//the snapshot object is replaced on every change and never mutated, which is
//how react knows to re-render
//notice says why the last session ended, shown on the sign in page
//signedOut marks a deliberate sign out, the route guard then forgets the page
//the person was on so whoever signs in next on this browser starts at home
let snapshot = { session: readStored(), notice: null, signedOut: false };
const listeners = new Set();

const update = (changes) => {
  snapshot = { ...snapshot, ...changes };
  persist(snapshot.session);
  listeners.forEach((listener) => listener());
};

const sessionStore = {
  getSnapshot: () => snapshot,

  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getToken: () => (snapshot.session ? snapshot.session.token : null),

  start: (session) => update({ session, notice: null, signedOut: false }),

  //keeps the token and swaps in a fresher copy of the user
  refreshUser: (user) => {
    if (snapshot.session) {
      update({ session: { token: snapshot.session.token, user } });
    }
  },

  //the session was ended for the person, an expired token for example, so
  //the page they were on is kept for when they sign back in
  end: (notice = null) => update({ session: null, notice, signedOut: false }),

  signOut: (notice = null) => update({ session: null, notice, signedOut: true }),

  clearNotice: () => update({ notice: null })
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { sessionStore };
