//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '@/api/endpoints';
import { EmptyContent } from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import ListHeader from '@/components/ListHeader';
import { PageHeader, Sticker } from '@/components/PageHeader';
import Pager from '@/components/Pager';
import { TransactionTable, TransactionTableSkeleton } from '@/components/TransactionTable';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserTable, UserTableSkeleton } from '@/components/UserTable';
import useRequest from '@/hooks/useRequest';

//-----------------------------------------------------\\
//                 PAGED LISTS IN THE URL
//-----------------------------------------------------\\

//ten rows a list keeps both tables close together without a long scroll
const PAGE_SIZE = 10;

//an admin sees who paid and who was paid
const BOTH = ['client', 'freelancer'];

//each list keeps its page number in the address under its own key, so the
//two page separately and a refresh, the back button or a shared link land
//on the same pages, anything unexpected reads as the first page
const readPage = (params, key) => {
  const page = Number(params.get(key));
  return Number.isInteger(page) && page > 1 ? page : 1;
};

const withPage = (params, key, page) => {
  const next = new URLSearchParams(params);

  if (page > 1) {
    next.set(key, String(page));
  } else {
    next.delete(key);
  }

  return next;
};

//"9 users" when everything fits on one page, "Showing 11–20 of 23 users"
//once it does not
const summaryOf = ({ page, rows, total }, [one, many]) => {
  const noun = total === 1 ? one : many;

  if (total <= PAGE_SIZE) {
    return total + ' ' + noun;
  }

  const first = (page - 1) * PAGE_SIZE + 1;
  const last = first + rows.length - 1;
  return 'Showing ' + (first === last ? first : first + '–' + last) + ' of ' + total + ' ' + noun;
};

//-----------------------------------------------------\\
//                   ONE PAGED LIST
//-----------------------------------------------------\\

//one list's request, the page it is on and where its pager links go
//field is the name the api gives the rows, the total comes alongside them
//a page past the end, after the list shrank, quietly becomes the last one
const usePagedList = (fetchPage, key, field) => {
  const [params, setParams] = useSearchParams();
  const page = readPage(params, key);
  const load = useCallback(() => fetchPage({ page, limit: PAGE_SIZE }), [fetchPage, page]);
  const request = useRequest(load);

  const ready = request.state === 'ready' && request.data;
  const rows = ready && Array.isArray(request.data[field]) ? request.data[field] : [];
  const total = ready && Number.isInteger(request.data.total) ? request.data.total : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pastTheEnd = Boolean(ready) && rows.length === 0 && total > 0 && page > pages;

  useEffect(() => {
    if (pastTheEnd) {
      setParams((current) => withPage(current, key, pages), { replace: true });
    }
  }, [pastTheEnd, key, pages, setParams]);

  //only this list's key changes, the other list stays on its page
  const hrefFor = (target) => ({ search: withPage(params, key, target).toString() });

  return { ...request, page, rows, total, pages, pastTheEnd, hrefFor };
};

//-----------------------------------------------------\\
//                     LIST IN A CARD
//-----------------------------------------------------\\

//one list in its card, the heading stays in place while the rows load,
//fail or turn out empty, so the page keeps its shape
//ghost and the loading line only appear for a real wait
//table draws the rows, given them and the heading's id to name itself after
//after moving between pages the summary takes focus, which brings the list
//back into view and tells a screen reader which rows are showing
const AdminList = ({ list, id, title, nouns, loading, ghost, empty, pagerLabel, table }) => {
  const summaryRef = useRef(null);
  const shownPage = useRef(list.page);

  useEffect(() => {
    if (list.state !== 'ready' || shownPage.current === list.page) {
      return;
    }

    shownPage.current = list.page;

    if (summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [list.state, list.page]);

  let summary = null;
  let body = null;

  if (list.state === 'loading' || list.pastTheEnd) {
    if (list.slow) {
      summary = <Skeleton aria-hidden="true" className="h-4 w-36" />;
      body = (
        <>
          <p role="status" className="sr-only">
            {loading}
          </p>
          {ghost}
        </>
      );
    }
  } else if (list.state === 'error') {
    body = (
      <div className="p-4.5 max-sm:p-3.5">
        <ErrorBanner message={list.error} onRetry={list.retry} />
      </div>
    );
  } else if (list.rows.length === 0) {
    body = <EmptyContent heading="h3" title={empty[0]} text={empty[1]} />;
  } else {
    summary = (
      <p ref={summaryRef} tabIndex={-1} role="status" className="scroll-mt-4 text-sm text-muted-foreground">
        {summaryOf(list, nouns)}
      </p>
    );
    body = (
      <>
        {table(list.rows, id)}
        <Pager
          page={list.page}
          pages={list.pages}
          hrefFor={list.hrefFor}
          label={pagerLabel}
          className="mt-0 border-t-2 border-tint px-4.5 py-4 max-sm:px-3.5"
        />
      </>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <ListHeader id={id} title={title}>
        {summary}
      </ListHeader>
      {body}
    </Card>
  );
};

//-----------------------------------------------------\\
//                         ADMIN
//-----------------------------------------------------\\

//everyone on the platform and every simulated payment, newest first
//the api only answers an admin's token, the route guard keeps everyone
//else from reaching the page at all
const Admin = () => {
  const users = usePagedList(api.getUsers, 'users', 'users');
  const payments = usePagedList(api.getAllTransactions, 'payments', 'transactions');

  return (
    <>
      <PageHeader
        title={
          <>
            Admin <Sticker>overview</Sticker>
          </>
        }
        pageTitle="Admin"
        lede="Everyone on the platform and every simulated payment, newest first."
      />
      <div className="flex flex-col gap-6">
        <AdminList
          list={users}
          id="all-users"
          title="Users"
          nouns={['user', 'users']}
          loading="Loading users…"
          ghost={<UserTableSkeleton />}
          empty={['No users yet', 'New accounts appear here as people register.']}
          pagerLabel="Pages of users"
          table={(rows, id) => <UserTable users={rows} labelledBy={id} />}
        />
        <AdminList
          list={payments}
          id="all-payments"
          title="Transactions"
          nouns={['payment', 'payments']}
          loading="Loading payments…"
          ghost={<TransactionTableSkeleton people={BOTH} />}
          empty={['No payments yet', 'Payments appear here as clients book gigs.']}
          pagerLabel="Pages of transactions"
          table={(rows, id) => <TransactionTable transactions={rows} people={BOTH} labelledBy={id} />}
        />
      </div>
    </>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Admin;
