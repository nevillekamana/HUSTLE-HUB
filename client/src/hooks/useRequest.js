//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useCallback, useEffect, useState } from 'react';
import { messageFor } from '@/api/client';

//-----------------------------------------------------\\
//                      SLOW WAIT
//-----------------------------------------------------\\

//how long a request may take before the page shows its loading ghosts, an
//answer quicker than this appears without any loading screen at all
const SLOW_MS = 300;

//-----------------------------------------------------\\
//                      USE REQUEST
//-----------------------------------------------------\\

//runs one api call for a page and reports it as loading, error or ready
//load must come from useCallback, a new load (new filters, a new id) starts
//a fresh request and the page is loading again straight away
//slow turns true only once the request has been out for SLOW_MS, so a page
//draws its ghosts for a real wait and never flashes them for a quick one
//an answer that arrives after the page has moved on is thrown away, so a slow
//early request can never overwrite a newer one
//the error is only ever the safe sentence, the status is kept so a page can
//tell a missing record (404) apart from an outage
const useRequest = (load) => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ load: null, attempt: -1, data: null, error: null, status: 0 });
  const [slowFor, setSlowFor] = useState({ load: null, attempt: -1 });

  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      if (current) {
        setSlowFor({ load, attempt });
      }
    }, SLOW_MS);

    load().then(
      (data) => {
        clearTimeout(timer);
        if (current) {
          setResult({ load, attempt, data, error: null, status: 200 });
        }
      },
      (error) => {
        clearTimeout(timer);
        if (current) {
          setResult({ load, attempt, data: null, error: messageFor(error), status: (error && error.status) || 0 });
        }
      }
    );

    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [load, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  //a result belongs to the request that made it, anything older reads as
  //still loading rather than showing the previous page's data for a moment
  const settled = result.load === load && result.attempt === attempt;

  if (!settled) {
    const slow = slowFor.load === load && slowFor.attempt === attempt;
    return { state: 'loading', slow, data: null, error: null, status: 0, retry };
  }

  return {
    state: result.error ? 'error' : 'ready',
    slow: false,
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
