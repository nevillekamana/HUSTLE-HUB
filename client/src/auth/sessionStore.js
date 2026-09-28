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
//notice says why the last session ended, shown once on the sign in page
let snapshot = { session: readStored(), notice: null };
const listeners = new Set();

const update = (session, notice) => {
  snapshot = { session, notice };
  persist(session);
  listeners.forEach((listener) => listener());
};

const sessionStore = {
  getSnapshot: () => snapshot,

  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getToken: () => (snapshot.session ? snapshot.session.token : null),

  start: (session) => update(session, null),

  //keeps the token and swaps in a fresher copy of the user
  refreshUser: (user) => {
    if (snapshot.session) {
      update({ token: snapshot.session.token, user }, snapshot.notice);
    }
  },

  end: (notice = null) => update(null, notice),

  clearNotice: () => update(snapshot.session, null)
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { sessionStore };
