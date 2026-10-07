//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Avatar } from '@/components/Person';
import TableSkeleton from '@/components/TableSkeleton';
import { TABLE_CELL as CELL, TABLE_HEAD as HEAD } from '@/components/tableStyles';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dates';
import { personName } from '@/utils/people';

//-----------------------------------------------------\\
//                    TABLE SETTINGS
//-----------------------------------------------------\\

//each role in its own colour, always with its name written out, so the
//colour is never the only clue
const ROLES = {
  client: ['secondary', 'Client'],
  freelancer: ['aqua', 'Freelancer'],
  admin: ['ink', 'Admin']
};

//narrower than the payments table, it has fewer columns to fit
const MIN_WIDTH = 'min-w-150';

//a long email may wrap just before its @, between the name and the domain,
//rather than at whichever letter reaches the edge
const Email = ({ address }) => {
  const text = typeof address === 'string' ? address : '';
  const at = text.lastIndexOf('@');

  return at > 0 ? (
    <>
      {text.slice(0, at)}
      <wbr />
      {text.slice(at)}
    </>
  ) : (
    text
  );
};

//-----------------------------------------------------\\
//                      USER TABLE
//-----------------------------------------------------\\

//accounts with their name, email, role and the day they joined, newest first
//as the api sends them, only the public fields ever arrive here
//each row is headed by the person's name
//the scrolling box can take focus, so a keyboard user can scroll it too
const UserTable = ({ users, labelledBy }) => (
  <div role="region" aria-labelledby={labelledBy} tabIndex={0} className="overflow-x-auto">
    <table aria-labelledby={labelledBy} className={cn('w-full border-collapse text-sm', MIN_WIDTH)}>
      <thead>
        <tr>
          <th scope="col" className={HEAD}>
            Name
          </th>
          <th scope="col" className={HEAD}>
            Email
          </th>
          <th scope="col" className={HEAD}>
            Role
          </th>
          <th scope="col" className={HEAD}>
            Joined
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const name = personName(user, 'Unnamed account');
          const [variant, label] = ROLES[user.role] || ['off', 'Unknown'];

          return (
            <tr key={user.id}>
              <th scope="row" className={cn(CELL, 'min-w-48 text-left font-semibold')}>
                <span className="flex items-center gap-2.5">
                  <Avatar name={name} />
                  <span className="break-words">{name}</span>
                </span>
              </th>
              <td className={cn(CELL, 'min-w-52 break-words')}>
                <Email address={user.email} />
              </td>
              <td className={CELL}>
                <Badge variant={variant}>{label}</Badge>
              </td>
              <td className={cn(CELL, 'whitespace-nowrap')}>{formatDate(user.createdAt)}</td>
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
const UserTableSkeleton = ({ count }) => <TableSkeleton columns={4} count={count} minWidth={MIN_WIDTH} />;

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { UserTable, UserTableSkeleton };
