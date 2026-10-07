//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useEffect, useId, useRef, useState } from 'react';
import { Table2 } from 'lucide-react';
import ListHeader from '@/components/ListHeader';
import { TABLE_CELL, TABLE_HEAD, TABLE_NUMBER } from '@/components/tableStyles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatMonth } from '@/utils/dates';
import { plural, shareOf } from '@/utils/income';
import { formatCents, formatCentsShort } from '@/utils/money';

//-----------------------------------------------------\\
//                     CHART PIECES
//-----------------------------------------------------\\

//the tallest column, in pixels, the value above it and the baseline below
//fit inside the plot's fixed height
const COLUMN_MAX = 150;

//a small label over a bar on hover or keyboard focus, the bar's whole row
//or column is the target so the pointer never has to land on the thin mark
//the value leads and the words follow, and everything in it is in the table
//view too, so nothing can only be read by hovering
const TIP =
  'pointer-events-none invisible absolute z-10 flex flex-col rounded-lg bg-ink px-3 py-2 text-xs whitespace-nowrap text-white/80 shadow-hard-sm group-hover:visible group-focus-visible:visible';

//the one series colour, lifting to its lighter step under the pointer
const MARK = 'bg-chart transition-colors group-hover:bg-chart-hover group-focus-visible:bg-chart-hover';

//-----------------------------------------------------\\
//                      CHART CARD
//-----------------------------------------------------\\

//a chart in a card with its heading and a switch to the same numbers as a
//table, the plain equivalent for anyone who cannot use the chart
//chart and table are render functions given the heading's id to name
//themselves after
const ChartCard = ({ title, chart, table }) => {
  const [asTable, setAsTable] = useState(false);
  const titleId = useId();

  return (
    <Card className="gap-0 py-0">
      <ListHeader id={titleId} title={title}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={asTable}
          onClick={() => setAsTable((shown) => !shown)}
          className="aria-pressed:bg-tint"
        >
          <Table2 aria-hidden="true" />
          Table view
        </Button>
      </ListHeader>
      {asTable ? table(titleId) : <div className="px-4.5 py-5 max-sm:px-3.5">{chart(titleId)}</div>}
    </Card>
  );
};

//-----------------------------------------------------\\
//                     INCOME BY GIG
//-----------------------------------------------------\\

//income per gig as horizontal bars, every bar the same colour because the
//gigs are told apart by their names, and the longest bar earned the most
//the amount sits at the end of each bar, with room kept for it on the right
//the tip adds each gig's share of the total
const GigIncomeChart = ({ rows, totalCents, labelledBy }) => {
  const max = Math.max(1, ...rows.map((row) => row.totalCents));

  return (
    <ul aria-labelledby={labelledBy} className="flex flex-col gap-4">
      {rows.map((row, index) => {
        const tipId = labelledBy + '-gig-' + index;
        const width = (row.totalCents / max) * 100;
        const end = { left: width + '%' };

        return (
          <li
            key={row.gigId || index}
            tabIndex={0}
            aria-describedby={tipId}
            className="group flex flex-col gap-1.5 rounded-md outline-offset-4"
          >
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold break-words">{row.title}</span>
              <span className="text-sm text-muted-foreground">{plural(row.count, 'booking')}</span>
            </p>
            <div className="relative mr-28 h-5">
              <span
                aria-hidden="true"
                className={cn('absolute inset-y-0.75 left-0 rounded-r-[4px]', MARK)}
                style={{ width: 'max(4px, ' + width + '%)' }}
              />
              <span className="absolute top-1/2 -translate-y-1/2 pl-2 text-sm font-semibold whitespace-nowrap" style={end}>
                {formatCents(row.totalCents)}
              </span>
              <span
                id={tipId}
                role="tooltip"
                className={cn(TIP, 'bottom-full mb-1.5', width > 50 && '-translate-x-full')}
                style={end}
              >
                <strong className="text-sm text-white">{shareOf(row.totalCents, totalCents)}</strong>
                of your income
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const GigIncomeTable = ({ rows, totalCents, labelledBy }) => (
  <table aria-labelledby={labelledBy} className="w-full border-collapse text-sm">
    <thead>
      <tr>
        <th scope="col" className={TABLE_HEAD}>
          Gig
        </th>
        <th scope="col" className={cn(TABLE_HEAD, 'text-right')}>
          Bookings
        </th>
        <th scope="col" className={cn(TABLE_HEAD, 'text-right')}>
          Income
        </th>
        <th scope="col" className={cn(TABLE_HEAD, 'text-right')}>
          Share
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row, index) => (
        <tr key={row.gigId || index}>
          <th scope="row" className={cn(TABLE_CELL, 'text-left font-semibold break-words')}>
            {row.title}
          </th>
          <td className={cn(TABLE_CELL, TABLE_NUMBER)}>{row.count}</td>
          <td className={cn(TABLE_CELL, TABLE_NUMBER, 'font-semibold')}>{formatCents(row.totalCents)}</td>
          <td className={cn(TABLE_CELL, TABLE_NUMBER)}>{shareOf(row.totalCents, totalCents)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

//-----------------------------------------------------\\
//                    INCOME BY MONTH
//-----------------------------------------------------\\

//income per month as columns, oldest on the left, with quiet months shown
//as zero so the gaps in time are honest
//each column carries its amount in short form, the tip and the table give
//the full amount and the number of bookings
//more months than fit scroll sideways, starting at the latest, the padding
//inside the scrolling box keeps a focused column's ring from being clipped
const MonthIncomeChart = ({ rows, labelledBy }) => {
  const scrollerRef = useRef(null);
  const max = Math.max(1, ...rows.map((row) => row.totalCents));

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (scroller) {
      scroller.scrollLeft = scroller.scrollWidth;
    }
  }, [rows]);

  return (
    <div ref={scrollerRef} className="overflow-x-auto">
      <ol aria-labelledby={labelledBy} className="flex min-w-full px-3 py-1">
        {rows.map((row) => {
          const tipId = labelledBy + '-month-' + row.month;
          const height = row.totalCents > 0 ? Math.max(3, Math.round((row.totalCents / max) * COLUMN_MAX)) : 0;

          return (
            <li
              key={row.month}
              tabIndex={0}
              aria-describedby={tipId}
              className="group relative flex min-w-18 flex-1 flex-col items-center rounded-md outline-offset-2"
            >
              <div className="flex h-48 w-full flex-col items-center justify-end gap-1.5 border-b border-border">
                <span className="text-xs font-semibold whitespace-nowrap">{formatCentsShort(row.totalCents)}</span>
                {height > 0 && (
                  <span aria-hidden="true" className={cn('w-6 rounded-t-[4px]', MARK)} style={{ height: height + 'px' }} />
                )}
              </div>
              <span className="mt-2 text-xs whitespace-nowrap text-muted-foreground">{formatMonth(row.month)}</span>
              <span id={tipId} role="tooltip" className={cn(TIP, 'top-0 left-1/2 -translate-x-1/2')}>
                <strong className="text-sm text-white">{formatCents(row.totalCents)}</strong>
                {plural(row.count, 'booking')}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const MonthIncomeTable = ({ rows, labelledBy }) => (
  <table aria-labelledby={labelledBy} className="w-full border-collapse text-sm">
    <thead>
      <tr>
        <th scope="col" className={TABLE_HEAD}>
          Month
        </th>
        <th scope="col" className={cn(TABLE_HEAD, 'text-right')}>
          Bookings
        </th>
        <th scope="col" className={cn(TABLE_HEAD, 'text-right')}>
          Income
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.month}>
          <th scope="row" className={cn(TABLE_CELL, 'text-left font-semibold whitespace-nowrap')}>
            {formatMonth(row.month)}
          </th>
          <td className={cn(TABLE_CELL, TABLE_NUMBER)}>{row.count}</td>
          <td className={cn(TABLE_CELL, TABLE_NUMBER, 'font-semibold')}>{formatCents(row.totalCents)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

//-----------------------------------------------------\\
//                     GHOST CHART
//-----------------------------------------------------\\

//the shape of a chart card while the numbers load
const ChartCardSkeleton = ({ title }) => (
  <Card aria-hidden="true" className="gap-0 py-0">
    <ListHeader title={title}>
      <Skeleton className="h-9 w-28 rounded-full" />
    </ListHeader>
    <div className="flex flex-col gap-5 px-4.5 py-5">
      {['w-[90%]', 'w-[65%]', 'w-[40%]'].map((width) => (
        <div key={width} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className={cn('h-3.5', width)} />
        </div>
      ))}
    </div>
  </Card>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export {
  ChartCard,
  ChartCardSkeleton,
  GigIncomeChart,
  GigIncomeTable,
  MonthIncomeChart,
  MonthIncomeTable
};
