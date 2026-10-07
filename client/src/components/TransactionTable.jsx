//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import TableSkeleton from '@/components/TableSkeleton';
import { TABLE_CELL as CELL, TABLE_HEAD as HEAD, TABLE_NUMBER } from '@/components/tableStyles';
import { Badge } from '@/components/ui/badge';
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
              <td className={cn(CELL, TABLE_NUMBER, 'font-semibold')}>
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

//the shape of the table while it loads, one ghost column per real one
const TransactionTableSkeleton = ({ people, count }) => <TableSkeleton columns={people.length + 5} count={count} />;

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { TransactionTable, TransactionTableSkeleton };
