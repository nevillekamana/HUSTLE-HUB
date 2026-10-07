//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import * as api from '@/api/endpoints';
import BookingPanel from '@/components/BookingPanel';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import { CategoryBand } from '@/components/GigCard';
import { Person } from '@/components/Person';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useRequest from '@/hooks/useRequest';
import { categoryLabel } from '@/utils/categories';
import { formatDate } from '@/utils/dates';
import { formatCents } from '@/utils/money';
import { freelancerName } from '@/utils/people';

//-----------------------------------------------------\\
//                     WAY BACK
//-----------------------------------------------------\\

//a card passes the list's query string along, only a query string is
//accepted so the link can never point anywhere but the browse page
const backTo = (state) => {
  const browse = state && state.browse;
  return typeof browse === 'string' && /^\?[^#]*$/.test(browse) ? '/gigs' + browse : '/gigs';
};

const BackLink = ({ to }) => (
  <Link
    to={to}
    className="mb-4 inline-flex items-center gap-1.5 rounded-sm font-semibold text-primary hover:underline"
  >
    <ArrowLeft aria-hidden="true" className="size-4" />
    All gigs
  </Link>
);

//-----------------------------------------------------\\
//                     GHOST DETAIL
//-----------------------------------------------------\\

const DetailSkeleton = () => (
  <div aria-hidden="true" className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-7 max-lg:grid-cols-1">
    <Card className="gap-0 py-0">
      <Skeleton className="h-35 rounded-none" />
      <div className="flex flex-col gap-3.5 px-6.5 pt-6 pb-7">
        <Skeleton className="h-9 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
    </Card>
    <Card className="gap-4 px-5.5">
      <Skeleton className="h-10 w-1/2 rounded-full" />
      <Skeleton className="h-11 w-full rounded-full" />
    </Card>
  </div>
);

//-----------------------------------------------------\\
//                      GIG DETAIL
//-----------------------------------------------------\\

//one gig with the panel for booking it, the title is the freelancer's own
//text so it gets no sticker
//an invalid or unknown id and a hidden gig all read the same, the api gives
//the same 404 for each so nobody can tell a hidden listing exists
//the heading takes focus once the gig arrives, the loading heading it
//replaces had it while the request was out
const GigDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const load = useCallback(() => api.getGig(id), [id]);
  const { state, slow, data, error, status, retry } = useRequest(load);
  const [updated, setUpdated] = useState(null);
  const headingRef = useRef(null);
  const back = backTo(location.state);

  const gig = updated && updated.id === id ? updated : data && data.gig;
  const missing = state === 'error' && (status === 404 || status === 400);

  useEffect(() => {
    if (state === 'loading' || !headingRef.current) {
      return;
    }

    if (!document.activeElement || document.activeElement === document.body) {
      headingRef.current.focus({ preventScroll: true });
    }
  }, [state]);

  //the hidden heading is there from the start so focus has somewhere to land,
  //the ghost and its announcement wait until the answer is genuinely slow
  if (state === 'loading') {
    return (
      <>
        <title>Gig · HustleHub+</title>
        <h1 tabIndex={-1} className="sr-only">
          Loading gig…
        </h1>
        <BackLink to={back} />
        {slow && (
          <>
            <p role="status" className="sr-only">
              Loading gig…
            </p>
            <DetailSkeleton />
          </>
        )}
      </>
    );
  }

  if (missing || (state === 'ready' && !gig)) {
    return (
      <>
        <title>Gig not found · HustleHub+</title>
        <h1 ref={headingRef} tabIndex={-1} className="sr-only">
          Gig not found
        </h1>
        <BackLink to={back} />
        <EmptyState title="We couldn’t find that gig" text="It may have been removed by the freelancer.">
          <Link to={back} className={buttonVariants({ variant: 'outline' })}>
            Back to gigs
          </Link>
        </EmptyState>
      </>
    );
  }

  if (state === 'error') {
    return (
      <>
        <title>Gig · HustleHub+</title>
        <h1 ref={headingRef} tabIndex={-1} className="sr-only">
          Gig could not load
        </h1>
        <BackLink to={back} />
        <ErrorBanner message={error} onRetry={retry} />
      </>
    );
  }

  const facts = [
    ['Category', categoryLabel(gig.category)],
    ['Listed', formatDate(gig.createdAt)],
    ['Price', formatCents(gig.priceCents)]
  ];

  return (
    <>
      <title>{gig.title + ' · HustleHub+'}</title>
      <BackLink to={back} />
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start gap-7 max-lg:grid-cols-1">
        <Card className="gap-0 py-0">
          <CategoryBand category={gig.category} large />
          <div className="flex flex-col gap-3.5 px-6.5 pt-6 pb-7 max-sm:px-5">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-[clamp(30px,4vw,42px)] leading-[1.08] font-extrabold break-words"
            >
              {gig.title}
            </h1>
            {!gig.isActive && (
              <Badge variant="off" className="self-start">
                Inactive: hidden from clients
              </Badge>
            )}
            <Person name={freelancerName(gig)} detail="Freelancer" />
            <p className="text-[17px] break-words whitespace-pre-line">{gig.description}</p>
            <dl className="grid grid-cols-3 gap-3 max-sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-background px-3 py-2.5">
                  <dt className="text-xs font-bold tracking-[0.06em] text-muted-foreground uppercase">{label}</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
        <div className="sticky top-4 flex flex-col gap-4 max-lg:static">
          <BookingPanel gig={gig} onChange={(next) => setUpdated({ ...gig, ...next, id: gig.id })} />
        </div>
      </div>
    </>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default GigDetail;
