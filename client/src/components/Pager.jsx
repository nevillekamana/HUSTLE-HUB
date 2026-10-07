//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

//-----------------------------------------------------\\
//                     PAGE NUMBERS
//-----------------------------------------------------\\

//first, last and the pages either side of the current one, with a gap
//marker wherever pages are skipped, so a long list never floods the row
const pageWindow = (page, pages) => {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const numbers = [...wanted].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);

  return numbers.flatMap((n, index) => (index > 0 && n - numbers[index - 1] > 1 ? ['gap-' + n, n] : [n]));
};

const PILL =
  'inline-flex min-h-9 min-w-10 items-center justify-center rounded-full border-2 border-primary px-3.5 text-[13px] font-semibold';

//-----------------------------------------------------\\
//                         PAGER
//-----------------------------------------------------\\

//every page is a real link, so back and forward, a new tab and a shared
//address all land on the same page of results
//hrefFor turns a page number into the address to go to, and a page with
//more than one list names each pager after its list
const Pager = ({ page, pages, hrefFor, label = 'Pagination', className }) => {
  if (pages <= 1) {
    return null;
  }

  const edge = (target, text, enabled) =>
    enabled ? (
      <Link to={hrefFor(target)} className={cn(PILL, 'bg-card text-primary hover:bg-tint')}>
        {text}
      </Link>
    ) : (
      <span aria-disabled="true" className={cn(PILL, 'cursor-not-allowed bg-card text-primary opacity-50')}>
        {text}
      </span>
    );

  return (
    <nav aria-label={label} className={cn('mt-7 flex flex-wrap items-center justify-center gap-2', className)}>
      {edge(page - 1, 'Previous', page > 1)}
      {pageWindow(page, pages).map((entry) =>
        typeof entry === 'string' ? (
          <span key={entry} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={entry}
            to={hrefFor(entry)}
            aria-label={'Page ' + entry}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(PILL, entry === page ? 'bg-primary text-white' : 'bg-card text-primary hover:bg-tint')}
          >
            {entry}
          </Link>
        )
      )}
      {edge(page + 1, 'Next', page < pages)}
    </nav>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Pager;
