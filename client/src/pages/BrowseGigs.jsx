//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import * as api from '@/api/endpoints';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import { GigCard, GigCardSkeleton } from '@/components/GigCard';
import GigFilters from '@/components/GigFilters';
import { PageHeader, Sticker } from '@/components/PageHeader';
import Pager from '@/components/Pager';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useRequest from '@/hooks/useRequest';
import { isCategory } from '@/utils/categories';
import { toCents } from '@/utils/money';

//-----------------------------------------------------\\
//                   FILTERS IN THE URL
//-----------------------------------------------------\\

//twelve fills the grid evenly at three, two or one across
const PAGE_SIZE = 12;
const SEARCH_MAX = 50;

//the address bar is the single record of what is being browsed, so a
//refresh, the back button or a shared link all show the same results
//anything unexpected in it is ignored rather than sent on
const readFilters = (params) => {
  const category = params.get('category');
  const page = Number(params.get('page'));

  return {
    q: (params.get('q') || '').slice(0, SEARCH_MAX),
    min: params.get('min') || '',
    max: params.get('max') || '',
    category: isCategory(category) ? category : '',
    page: Number.isInteger(page) && page > 1 ? page : 1
  };
};

const writeFilters = ({ q, min, max, category, page }) => {
  const params = new URLSearchParams();

  if (q) {
    params.set('q', q);
  }

  if (category) {
    params.set('category', category);
  }

  if (min) {
    params.set('min', min);
  }

  if (max) {
    params.set('max', max);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  return params;
};

//the api takes prices in cents and leaves out any filter that is not set
const toApiQuery = (filters) => {
  const minPrice = toCents(filters.min);
  const maxPrice = toCents(filters.max);

  return {
    q: filters.q.trim() || undefined,
    category: filters.category || undefined,
    minPrice: minPrice === null ? undefined : minPrice,
    maxPrice: maxPrice === null ? undefined : maxPrice,
    page: filters.page,
    limit: PAGE_SIZE
  };
};

//-----------------------------------------------------\\
//                      BROWSE PAGE
//-----------------------------------------------------\\

//every role can browse, only active gigs come back from the api
//a new filter goes back to page one, and moving between pages brings the
//results back into view and announces the new range
const BrowseGigs = () => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const filters = readFilters(params);
  const queryKey = JSON.stringify(toApiQuery(filters));
  const load = useCallback(() => api.getGigs(JSON.parse(queryKey)), [queryKey]);
  const { state, slow, data, error, retry } = useRequest(load);
  const summaryRef = useRef(null);
  const shownPage = useRef(filters.page);

  const filtering = Boolean(filters.q || filters.min || filters.max || filters.category);
  const gigs = state === 'ready' && data && Array.isArray(data.gigs) ? data.gigs : [];
  const total = state === 'ready' && data && Number.isInteger(data.total) ? data.total : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilters = (next) => setParams(writeFilters({ ...next, page: 1 }));
  const clearFilters = () => setParams(new URLSearchParams());
  const hrefFor = (page) => {
    const search = writeFilters({ ...filters, page }).toString();
    return search ? '?' + search : '/gigs';
  };

  //a page past the end, after the list shrank, quietly becomes the last one
  const pastTheEnd = state === 'ready' && gigs.length === 0 && total > 0 && filters.page > pages;

  useEffect(() => {
    if (pastTheEnd) {
      setParams(writeFilters({ ...readFilters(params), page: pages }), { replace: true });
    }
  }, [pastTheEnd, pages, params, setParams]);

  //after a page change the summary line takes focus, which scrolls the
  //results into view and tells a screen reader which gigs are showing
  useEffect(() => {
    if (state !== 'ready' || shownPage.current === filters.page) {
      return;
    }

    shownPage.current = filters.page;

    if (summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [state, filters.page]);

  let body;

  //the ghosts only appear for a real wait, a quick answer shows no loading
  if (state === 'loading' || pastTheEnd) {
    body = slow && (
      <>
        <p role="status" className="sr-only">
          Loading gigs…
        </p>
        <Skeleton aria-hidden="true" className="mb-3.5 h-5 w-44" />
        <div aria-hidden="true" className="grid grid-cols-3 gap-5.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {Array.from({ length: 6 }, (_, index) => (
            <GigCardSkeleton key={index} />
          ))}
        </div>
      </>
    );
  } else if (state === 'error') {
    body = <ErrorBanner message={error} onRetry={retry} />;
  } else if (gigs.length === 0) {
    body = filtering ? (
      <EmptyState title="No gigs match your filters" text="Try a different category or widen the price range.">
        <Button type="button" variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      </EmptyState>
    ) : (
      <EmptyState title="No gigs yet" text="Freelancers have not listed anything yet, check back soon." />
    );
  } else {
    const first = (filters.page - 1) * PAGE_SIZE + 1;
    const last = first + gigs.length - 1;
    const range = first === last ? String(first) : first + '–' + last;

    body = (
      <>
        <p
          ref={summaryRef}
          tabIndex={-1}
          role="status"
          className="mb-3.5 scroll-mt-4 text-sm font-medium text-muted-foreground"
        >
          {'Showing ' + range + ' of ' + total + (total === 1 ? ' gig' : ' gigs')}
        </p>
        <div className="grid grid-cols-3 gap-5.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {gigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} browse={location.search} />
          ))}
        </div>
        <Pager page={filters.page} pages={pages} hrefFor={hrefFor} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={
          <>
            Browse <Sticker>gigs</Sticker>
          </>
        }
        pageTitle="Browse gigs"
        lede="Every price is fixed up front and shown in rands."
      />
      <GigFilters applied={filters} onApply={applyFilters} onClear={clearFilters} />
      {body}
    </>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default BrowseGigs;
