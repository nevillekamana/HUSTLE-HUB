//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Link } from 'react-router-dom';
import * as api from '@/api/endpoints';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import {
  ChartCard,
  ChartCardSkeleton,
  GigIncomeChart,
  GigIncomeTable,
  MonthIncomeChart,
  MonthIncomeTable
} from '@/components/IncomeCharts';
import { PageHeader, Sticker } from '@/components/PageHeader';
import { StatTile, StatTileSkeleton } from '@/components/StatTile';
import { buttonVariants } from '@/components/ui/button';
import useRequest from '@/hooks/useRequest';
import { readIncome } from '@/utils/income';
import { formatCents } from '@/utils/money';

//-----------------------------------------------------\\
//                      PAGE LAYOUT
//-----------------------------------------------------\\

//the total leads, wider than the two tiles beside it, on a tablet it takes
//the full row above them and on a phone everything stacks
const TILES =
  'mb-6 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-5 max-md:grid-cols-2 max-sm:grid-cols-1';
const HERO = 'max-md:col-span-2 max-sm:col-span-1';
const CHARTS = 'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start gap-5.5 max-lg:grid-cols-1';

//-----------------------------------------------------\\
//                        INCOME
//-----------------------------------------------------\\

//what a freelancer has earned from completed bookings, the api adds it up
//from the token's own payments, so the page only lays the numbers out
//the total, the number of payments and the average lead, then the same
//money split by gig and by month
const Income = () => {
  const { state, slow, data, error, retry } = useRequest(api.getMyIncome);
  const income = readIncome(data && data.income);

  let body;

  //the ghosts only appear for a real wait, a quick answer shows no loading
  if (state === 'loading') {
    body = slow && (
      <>
        <p role="status" className="sr-only">
          Loading your income…
        </p>
        <div className={TILES}>
          <StatTileSkeleton hero className={HERO} />
          <StatTileSkeleton />
          <StatTileSkeleton />
        </div>
        <div className={CHARTS}>
          <ChartCardSkeleton title="By gig" />
          <ChartCardSkeleton title="By month" />
        </div>
      </>
    );
  } else if (state === 'error') {
    body = <ErrorBanner message={error} onRetry={retry} />;
  } else {
    const average = income.count > 0 ? formatCents(Math.round(income.totalCents / income.count)) : '—';

    body = (
      <>
        <div className={TILES}>
          <StatTile
            hero
            label="Total earned"
            value={formatCents(income.totalCents)}
            detail="In rands, from completed bookings"
            className={HERO}
          />
          <StatTile label="Payments" value={income.count} detail="Completed bookings" />
          <StatTile label="Average per booking" value={average} detail="Across all your gigs" />
        </div>

        {income.count === 0 || income.byGig.length === 0 ? (
          <EmptyState title="No income yet" text="Your earnings appear here after your first booking.">
            <Link to="/my-gigs" className={buttonVariants({ variant: 'outline' })}>
              Manage my gigs
            </Link>
          </EmptyState>
        ) : (
          <div className={CHARTS}>
            <ChartCard
              title="By gig"
              chart={(id) => <GigIncomeChart rows={income.byGig} totalCents={income.totalCents} labelledBy={id} />}
              table={(id) => <GigIncomeTable rows={income.byGig} totalCents={income.totalCents} labelledBy={id} />}
            />
            <ChartCard
              title="By month"
              chart={(id) => <MonthIncomeChart rows={income.byMonth} labelledBy={id} />}
              table={(id) => <MonthIncomeTable rows={income.byMonth} labelledBy={id} />}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={
          <>
            Your <Sticker>income</Sticker>
          </>
        }
        pageTitle="Income"
        lede="What you have earned from completed bookings, in rands."
      />
      {body}
    </>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Income;
