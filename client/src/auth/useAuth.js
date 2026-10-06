//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { createContext, useContext } from 'react';

//-----------------------------------------------------\\
//                 AUTH CONTEXT AND HOOK
//-----------------------------------------------------\\

//kept apart from the provider so that file exports only a component, which
//is what lets fast refresh keep state while the provider is edited
const AuthContext = createContext(null);

//fails loudly when used outside the provider rather than handing back a null
//that would read as a signed out user
const useAuth = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return auth;
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { AuthContext, useAuth };
