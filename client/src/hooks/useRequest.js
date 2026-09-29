//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useCallback, useEffect, useState } from 'react';
import { messageFor } from '@/api/client';

//-----------------------------------------------------\\
//                      USE REQUEST
//-----------------------------------------------------\\

//runs one api call for a page and reports it as loading, error or ready
//load must come from useCallback, a new load (new filters, a new id) starts
//a fresh request and the page shows its loading state again straight away
//an answer that arrives after the page has moved on is thrown away, so a slow
//early request can never overwrite a newer one
//the error is only ever the safe sentence, the status is kept so a page can
//tell a missing record (404) apart from an outage
const useRequest = (load) => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ load: null, attempt: -1, data: null, error: null, status: 0 });

  useEffect(() => {
    let current = true;

    load().then(
      (data) => {
        if (current) {
          setResult({ load, attempt, data, error: null, status: 200 });
        }
      },
      (error) => {
        if (current) {
          setResult({ load, attempt, data: null, error: messageFor(error), status: (error && error.status) || 0 });
        }
      }
    );

    return () => {
      current = false;
    };
  }, [load, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  //a result belongs to the request that made it, anything older reads as
  //still loading rather than showing the previous page's data for a moment
  const settled = result.load === load && result.attempt === attempt;

  if (!settled) {
    return { state: 'loading', data: null, error: null, status: 0, retry };
  }

  return {
    state: result.error ? 'error' : 'ready',
    data: result.data,
    error: result.error,
    status: result.status,
    retry
  };
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default useRequest;
