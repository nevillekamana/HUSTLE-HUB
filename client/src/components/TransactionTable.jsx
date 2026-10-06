//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { bookedGig } from '@/utils/bookings';
import { categoryOrOther } from '@/utils/categories';
import { formatDate } from '@/utils/dates';
import { formatCents } from '@/utils/money';
import { personName } from '@/utils/people';

//-----------------------------------------------------\\
//                    TABLE SETTINGS
//-----------------------------------------------------\\

const PEOPLE = { client: 'Client', freelancer: 'Freelancer' };

//the plan's payment statuses, refunded arrives with cancelling in part 3
const STATUS = {
  completed: ['success', 'Completed'],
  refunded: ['off', 'Refunded']
};

const HEAD = 'px-4.5 py-3 text-left text-xs font-bold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase';
const CELL = 'border-t-2 border-tint px-4.5 py-3.5';

//wide enough that no column squeezes its text, a narrower screen scrolls the
//table inside its card instead of the page
const TABLE = 'w-full min-w-170 border-collapse text-sm';

//-----------------------------------------------------\\
//                  TRANSACTION TABLE
//-----------------------------------------------------\\

//payments with their reference, gig, the people involved, date, amount and
//status, newest first as the api sends them
//people picks the name columns, a client sees the freelancer, a freelancer
//the client, and an admin both
//each row is headed by its reference, so a screen reader moving across a
//row hears which payment it is in
//the scrolling box can take focus, so a keyboard user can scroll it too
const TransactionTable = ({ transactions, people, labelledBy }) => (
  <div role="region" aria-labelledby={labelledBy} tabIndex={0} className="overflow-x-auto">
    <table aria-labelledby={labelledBy} className={TABLE}>
      <thead>
        <tr>
          <th scope="col" className={HEAD}>
            Reference
          </th>
          <th scope="col" className={HEAD}>
            Gig
          </th>
          {people.map((person) => (
            <th key={person} scope="col" className={HEAD}>
              {PEOPLE[person]}
            </th>
          ))}
          <th scope="col" className={HEAD}>
            Date
          </th>
          <th scope="col" className={cn(HEAD, 'text-right')}>
            Amount
          </th>
          <th scope="col" className={HEAD}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => {
          const gig = bookedGig(transaction);
          const [variant, label] = STATUS[transaction.status] || ['off', 'Unknown'];

          return (
            <tr key={transaction.id}>
              <th
                scope="row"
                className={cn(CELL, 'text-left font-mono text-[13px] font-semibold tracking-[0.04em] whitespace-nowrap')}
              >
                {transaction.reference}
              </th>
              <td className={cn(CELL, 'min-w-48')}>
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    data-category={categoryOrOther(gig.category)}
                    className="size-2.5 flex-none rounded-full bg-(--cat-cloth)"
                  />
                  <span className="break-words">{gig.title}</span>
                </span>
              </td>
              {people.map((person) => (
                <td key={person} className={cn(CELL, 'min-w-40')}>
                  {personName(transaction[person], PEOPLE[person])}
                </td>
              ))}
              <td className={cn(CELL, 'whitespace-nowrap')}>{formatDate(transaction.createdAt)}</td>
              <td className={cn(CELL, 'text-right font-semibold whitespace-nowrap tabular-nums')}>
                {formatCents(transaction.amountCents)}
              </td>
              <td className={CELL}>
                <Badge variant={variant}>{label}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

//-----------------------------------------------------\\
//                     GHOST TABLE
//-----------------------------------------------------\\

//the shape of the table while it loads, drawn with plain boxes so it is not
//mistaken for a real table by a screen reader
const TransactionTableSkeleton = ({ columns = 6, count = 4 }) => (
  <div aria-hidden="true" className="overflow-hidden">
    <div className="min-w-170">
      <div className="flex gap-6 px-4.5 py-3.5">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: count }, (_, row) => (
        <div key={row} className="flex items-center gap-6 border-t-2 border-tint px-4.5 py-4">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className={cn('flex-1', index === columns - 1 ? 'h-6 rounded-full' : 'h-4')} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { TransactionTable, TransactionTableSkeleton };
