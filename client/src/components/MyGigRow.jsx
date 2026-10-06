//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { CategoryTag, CategoryTile } from '@/components/Category';
import ErrorBanner from '@/components/ErrorBanner';
import Money from '@/components/Money';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dates';

//-----------------------------------------------------\\
//                      ROW LAYOUT
//-----------------------------------------------------\\

//emblem, title, listed and status, price, then the actions, on a narrow
//screen the price stays beside the title and the rest drops underneath
//the list holds the columns and each row borrows them as a subgrid, so
//prices and buttons line up down the list whatever their width
const LIST =
  'grid grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_auto_auto] gap-x-4 max-lg:grid-cols-[auto_minmax(0,1fr)_auto] max-sm:gap-x-3';

const ROW =
  'col-span-full grid grid-cols-subgrid items-center gap-y-3 border-t-2 border-tint px-4.5 py-3.5 first:border-t-0 max-sm:px-3.5';

const UNDER_TITLE = 'max-lg:col-span-2 max-lg:col-start-2';

//on a phone the buttons take the full width of the row so they stay on one line
const ACTIONS = 'max-lg:col-span-2 max-lg:col-start-2 max-sm:col-span-full max-sm:col-start-1';

//-----------------------------------------------------\\
//                     MY GIG LIST
//-----------------------------------------------------\\

const MyGigList = ({ ref, children }) => (
  <ul ref={ref} className={LIST}>
    {children}
  </ul>
);

//-----------------------------------------------------\\
//                      MY GIG ROW
//-----------------------------------------------------\\

//one of the freelancer's own gigs with its edit, pause and delete actions
//each button carries the gig's title for a screen reader, so a list of
//"Edit" buttons still says which gig each one belongs to
//busy names the action under way on this row, problem is a sentence about
//the last one that failed
//delete asks first, the delete button opens and closes the question below
//the row, focus moves to the question as it opens and back to the button if
//the person keeps the gig
const MyGigRow = ({ gig, busy, problem, confirming, onEdit, onToggle, onAskDelete, onDelete }) => {
  const questionRef = useRef(null);
  const deleteRef = useRef(null);
  const focusNext = useRef(null);

  useEffect(() => {
    const target = { question: questionRef, delete: deleteRef }[focusNext.current];
    focusNext.current = null;

    if (target && target.current) {
      target.current.focus();
    }
  }, [confirming]);

  const ask = (open) => {
    focusNext.current = open ? 'question' : 'delete';
    onAskDelete(open ? gig.id : null);
  };

  const toggling = busy === 'toggle';
  const deleting = busy === 'delete';
  const confirmId = 'delete-' + gig.id;
  const named = <span className="sr-only">{' ' + gig.title}</span>;

  let toggleLabel = gig.isActive ? 'Pause' : 'Resume';

  if (toggling) {
    toggleLabel = gig.isActive ? 'Pausing…' : 'Resuming…';
  }

  return (
    <li className={ROW}>
      <CategoryTile category={gig.category} />

      <div className="flex min-w-0 flex-col items-start gap-1">
        <h3 className="text-[17px] leading-tight font-bold break-words">
          <Link
            to={'/gigs/' + encodeURIComponent(gig.id)}
            className="rounded-sm text-ink hover:text-primary hover:underline"
          >
            {gig.title}
          </Link>
        </h3>
        <CategoryTag category={gig.category} />
      </div>

      <div
        className={cn(
          'flex flex-col items-start gap-1 text-sm max-lg:row-start-2 max-lg:flex-row max-lg:items-center max-lg:gap-2.5',
          UNDER_TITLE
        )}
      >
        <span className="text-muted-foreground">{'Listed ' + formatDate(gig.createdAt)}</span>
        {gig.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="off">Paused</Badge>}
      </div>

      <Money cents={gig.priceCents} className="justify-self-end max-lg:col-start-3 max-lg:row-start-1" />

      <div className={cn('flex flex-wrap justify-end gap-2 max-lg:justify-start', ACTIONS)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-edit={gig.id}
          onClick={() => onEdit(gig)}
          disabled={Boolean(busy)}
        >
          <Pencil aria-hidden="true" />
          Edit
          {named}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggle(gig)}
          disabled={Boolean(busy)}
          focusableWhenDisabled={toggling}
        >
          {toggling ? (
            <Spinner aria-hidden="true" role={undefined} />
          ) : gig.isActive ? (
            <Pause aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}
          {toggleLabel}
          {named}
        </Button>
        <Button
          type="button"
          ref={deleteRef}
          variant="destructive"
          size="sm"
          aria-expanded={confirming}
          aria-controls={confirming ? confirmId : undefined}
          onClick={() => ask(!confirming)}
          disabled={Boolean(busy)}
          className="aria-expanded:bg-danger-tint"
        >
          <Trash2 aria-hidden="true" />
          Delete
          {named}
        </Button>
      </div>

      {problem && <ErrorBanner message={problem} className="col-span-full" />}

      {confirming && (
        <div
          id={confirmId}
          className="col-span-full flex flex-wrap items-center gap-3 rounded-xl border-2 border-destructive bg-danger-tint px-3.5 py-3"
        >
          <p ref={questionRef} tabIndex={-1} className="min-w-50 flex-1">
            {'Delete “' + gig.title + '”? It leaves Browse and this list, and this can’t be undone. '}
            Bookings and payments already made stay on record.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onDelete(gig)}
              disabled={deleting}
              focusableWhenDisabled
            >
              {deleting && <Spinner aria-hidden="true" role={undefined} />}
              {deleting ? 'Deleting…' : 'Delete gig'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => ask(false)} disabled={deleting}>
              Keep it
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

//-----------------------------------------------------\\
//                     GHOST ROWS
//-----------------------------------------------------\\

//the shape of the list while it loads, so nothing jumps when rows arrive
const MyGigRowsSkeleton = ({ count = 4 }) => (
  <ul aria-hidden="true" className={LIST}>
    {Array.from({ length: count }, (_, index) => (
      <li key={index} className={ROW}>
        <Skeleton className="size-11 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4.5 w-3/4" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className={cn('flex flex-col gap-2 max-lg:row-start-2 max-lg:flex-row', UNDER_TITLE)}>
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 justify-self-end rounded-full max-lg:col-start-3 max-lg:row-start-1" />
        <div className={cn('flex gap-2 max-lg:justify-start', ACTIONS)}>
          <Skeleton className="h-9 w-18 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </li>
    ))}
  </ul>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { MyGigList, MyGigRow, MyGigRowsSkeleton };
