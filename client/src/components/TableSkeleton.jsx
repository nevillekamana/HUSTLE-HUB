//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

//-----------------------------------------------------\\
//                     GHOST TABLE
//-----------------------------------------------------\\

//the shape of a table while it loads, drawn with plain boxes so it is not
//mistaken for a real table by a screen reader
//minWidth matches the real table's, so a phone cuts it off where the real
//table will start to scroll
//the last column is drawn as a pill, the place a status or role badge sits
const TableSkeleton = ({ columns, count = 4, minWidth = 'min-w-170' }) => (
  <div aria-hidden="true" className="overflow-hidden">
    <div className={minWidth}>
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

export default TableSkeleton;
