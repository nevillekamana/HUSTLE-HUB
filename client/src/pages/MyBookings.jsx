//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Link } from 'react-router-dom';
import * as api from '@/api/endpoints';
import { useAuth } from '@/auth/useAuth';
import { BookingRow, BookingRowsSkeleton } from '@/components/BookingRow';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import ListHeader from '@/components/ListHeader';
import { PageHeader, Sticker } from '@/components/PageHeader';
import { RowList } from '@/components/Rows';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useRequest from '@/hooks/useRequest';

//-----------------------------------------------------\\
//                     WORDING PER ROLE
//-----------------------------------------------------\\

//a client sees what they booked, a freelancer sees what clients booked from them
const COPY = {
  client: {
    lede: 'Every gig you have booked, newest first.',
    list: 'Your bookings',
    empty: 'When you book a gig it shows up here.',
    action: ['/gigs', 'Browse gigs', 'default']
  },
  freelancer: {
    lede: 'Every booking clients have made on your gigs, newest first.',
    list: 'Bookings on your gigs',
    empty: 'When a client books one of your gigs it shows up here.',
    action: ['/my-gigs', 'Manage my gigs', 'outline']
  }
};

//-----------------------------------------------------\\
//                     MY BOOKINGS
//-----------------------------------------------------\\

//the bookings the signed in person is part of, the api decides which ones
//from the token, the page only chooses how to word them
const MyBookings = () => {
  const { user } = useAuth();
  const asClient = Boolean(user && user.role === 'client');
  const copy = asClient ? COPY.client : COPY.freelancer;
  const { state, slow, data, error, retry } = useRequest(api.getMyBookings);
  const bookings = (data && Array.isArray(data.bookings) && data.bookings) || [];

  let body;

  //the ghost rows only appear for a real wait, a quick answer shows no loading
  if (state === 'loading') {
    body = slow && (
      <Card className="gap-0 py-0">
        <p role="status" className="sr-only">
          Loading your bookings…
        </p>
        <ListHeader title={copy.list}>
          <Skeleton aria-hidden="true" className="h-4 w-24" />
        </ListHeader>
        <BookingRowsSkeleton />
      </Card>
    );
  } else if (state === 'error') {
    body = <ErrorBanner message={error} onRetry={retry} />;
  } else if (bookings.length === 0) {
    const [to, label, variant] = copy.action;

    body = (
      <EmptyState title="No bookings yet" text={copy.empty}>
        <Link to={to} className={buttonVariants({ variant })}>
          {label}
        </Link>
      </EmptyState>
    );
  } else {
    body = (
      <Card className="gap-0 py-0">
        <ListHeader title={copy.list}>
          <p className="text-sm text-muted-foreground">
            {bookings.length + (bookings.length === 1 ? ' booking' : ' bookings')}
          </p>
        </ListHeader>
        <RowList>
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} asClient={asClient} />
          ))}
        </RowList>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={
          <>
            My <Sticker>bookings</Sticker>
          </>
        }
        pageTitle="My bookings"
        lede={copy.lede}
      />
      {body}
    </>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default MyBookings;
