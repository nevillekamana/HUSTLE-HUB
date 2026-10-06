//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Link } from 'react-router-dom';
import * as api from '@/api/endpoints';
import { useAuth } from '@/auth/useAuth';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import ListHeader from '@/components/ListHeader';
import { PageHeader, Sticker } from '@/components/PageHeader';
import { TransactionTable, TransactionTableSkeleton } from '@/components/TransactionTable';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useRequest from '@/hooks/useRequest';
import { formatCents } from '@/utils/money';

//-----------------------------------------------------\\
//                     WORDING PER ROLE
//-----------------------------------------------------\\

const LIST_ID = 'payment-history';

//a client pays and sees the freelancer, a freelancer is paid and sees the client
const COPY = {
  client: {
    people: ['freelancer'],
    total: ' paid',
    empty: 'Each booking creates a payment here, with a reference you can quote.',
    action: ['/gigs', 'Browse gigs', 'default']
  },
  freelancer: {
    people: ['client'],
    total: ' received',
    empty: 'Payments for your gigs appear here once clients book them.',
    action: ['/my-gigs', 'Manage my gigs', 'outline']
  }
};

//how many payments and what the completed ones add up to, summed in cents
const summarise = (transactions, copy) => {
  const total = transactions
    .filter((transaction) => transaction.status === 'completed')
    .reduce((sum, transaction) => sum + (Number.isInteger(transaction.amountCents) ? transaction.amountCents : 0), 0);
  const count = transactions.length + (transactions.length === 1 ? ' payment' : ' payments');

  return count + ', ' + formatCents(total) + copy.total;
};

//-----------------------------------------------------\\
//                     TRANSACTIONS
//-----------------------------------------------------\\

//the simulated payments behind the signed in person's bookings, the api
//decides which ones from the token
const Transactions = () => {
  const { user } = useAuth();
  const asClient = Boolean(user && user.role === 'client');
  const copy = asClient ? COPY.client : COPY.freelancer;
  const { state, slow, data, error, retry } = useRequest(api.getMyTransactions);
  const transactions = (data && Array.isArray(data.transactions) && data.transactions) || [];

  let body;

  //the ghost table only appears for a real wait, a quick answer shows no loading
  if (state === 'loading') {
    body = slow && (
      <Card className="gap-0 py-0">
        <p role="status" className="sr-only">
          Loading your payments
        </p>
        <ListHeader title="Payment history">
          <Skeleton aria-hidden="true" className="h-4 w-44" />
        </ListHeader>
        <TransactionTableSkeleton />
      </Card>
    );
  } else if (state === 'error') {
    body = <ErrorBanner message={error} onRetry={retry} />;
  } else if (transactions.length === 0) {
    const [to, label, variant] = copy.action;

    body = (
      <EmptyState title="No payments yet" text={copy.empty}>
        <Link to={to} className={buttonVariants({ variant })}>
          {label}
        </Link>
      </EmptyState>
    );
  } else {
    body = (
      <Card className="gap-0 py-0">
        <ListHeader id={LIST_ID} title="Payment history">
          <p className="text-sm text-muted-foreground">{summarise(transactions, copy)}</p>
        </ListHeader>
        <TransactionTable transactions={transactions} people={copy.people} labelledBy={LIST_ID} />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={
          <>
            Your <Sticker>transactions</Sticker>
          </>
        }
        pageTitle="Transactions"
        lede="Simulated payments, one for every booking. Quote the reference if you need help with a payment."
      />
      {body}
    </>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Transactions;
