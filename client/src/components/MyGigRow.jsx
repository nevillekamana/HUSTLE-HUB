//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useEffect, useRef } from 'react';
import { Pause, Pencil, Play, Trash2 } from 'lucide-react';
import ErrorBanner from '@/components/ErrorBanner';
import Money from '@/components/Money';
import { ROW, ROW_ACTIONS, ROW_LIST, ROW_PRICE, UNDER_TITLE } from '@/components/rowLayout';
import { RowGig } from '@/components/Rows';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dates';

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
      <RowGig id={gig.id} title={gig.title} category={gig.category} />

      <div
        className={cn(
          'flex flex-col items-start gap-1 text-sm max-lg:row-start-2 max-lg:flex-row max-lg:items-center max-lg:gap-2.5',
          UNDER_TITLE
        )}
      >
        <span className="text-muted-foreground">{'Listed ' + formatDate(gig.createdAt)}</span>
        {gig.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="off">Paused</Badge>}
      </div>

      <Money cents={gig.priceCents} className={ROW_PRICE} />

      <div className={cn('flex flex-wrap justify-end gap-2 max-lg:justify-start', ROW_ACTIONS)}>
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
  <ul aria-hidden="true" className={ROW_LIST}>
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
        <Skeleton className={cn('h-8 w-24 rounded-full', ROW_PRICE)} />
        <div className={cn('flex gap-2 max-lg:justify-start', ROW_ACTIONS)}>
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

export { MyGigRow, MyGigRowsSkeleton };
