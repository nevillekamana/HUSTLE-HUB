//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import Money from '@/components/Money';
import { ROW, ROW_LIST, ROW_PRICE } from '@/components/rowLayout';
import { RowGig } from '@/components/Rows';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { bookedGig } from '@/utils/bookings';
import { formatDate } from '@/utils/dates';
import { personName } from '@/utils/people';

//-----------------------------------------------------\\
//                    BOOKING STATUS
//-----------------------------------------------------\\

//the plan's booking statuses, cancelled has no route yet and is kept ready
//for part 3, anything else reads as unknown rather than showing raw data
const STATUS = {
  confirmed: ['secondary', 'Confirmed'],
  cancelled: ['off', 'Cancelled']
};

//on a narrow screen the status sits under the price, level with the details,
//on a phone the details take the full width and the status drops below them
const ROW_STATUS =
  'justify-self-end max-lg:col-start-3 max-lg:row-start-2 max-sm:col-start-2 max-sm:row-start-3 max-sm:justify-self-start';
const ROW_DETAILS = 'max-lg:col-start-2 max-lg:row-start-2 max-sm:col-span-2 max-sm:col-start-2';

//-----------------------------------------------------\\
//                     BOOKING ROW
//-----------------------------------------------------\\

//one booking, the gig as it was when booked, the person on the other side,
//the day it was booked, the price paid and its status
//a client sees the freelancer and a freelancer sees the client
const BookingRow = ({ booking, asClient }) => {
  const gig = bookedGig(booking);
  const other = asClient ? personName(booking.freelancer, 'Freelancer') : personName(booking.client, 'Client');
  const [variant, label] = STATUS[booking.status] || ['off', 'Unknown'];

  return (
    <li className={ROW}>
      <RowGig id={gig.id} title={gig.title} category={gig.category} />

      <div className={cn('flex min-w-0 flex-col gap-0.5 text-sm', ROW_DETAILS)}>
        <span className="break-words">
          <span className="text-muted-foreground">{asClient ? 'Freelancer: ' : 'Client: '}</span>
          {other}
        </span>
        <span className="text-muted-foreground">{'Booked ' + formatDate(booking.createdAt)}</span>
      </div>

      <Money cents={booking.priceCents} className={ROW_PRICE} />

      <Badge variant={variant} className={ROW_STATUS}>
        {label}
      </Badge>
    </li>
  );
};

//-----------------------------------------------------\\
//                     GHOST ROWS
//-----------------------------------------------------\\

//the shape of the list while it loads, so nothing jumps when rows arrive
const BookingRowsSkeleton = ({ count = 4 }) => (
  <ul aria-hidden="true" className={ROW_LIST}>
    {Array.from({ length: count }, (_, index) => (
      <li key={index} className={ROW}>
        <Skeleton className="size-11 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4.5 w-3/4" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className={cn('flex flex-col gap-2', ROW_DETAILS)}>
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className={cn('h-8 w-24 rounded-full', ROW_PRICE)} />
        <Skeleton className={cn('h-6 w-20 rounded-full', ROW_STATUS)} />
      </li>
    ))}
  </ul>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { BookingRow, BookingRowsSkeleton };
