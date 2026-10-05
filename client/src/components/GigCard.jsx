//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CategoryPill } from '@/components/Category';
import Money from '@/components/Money';
import { Person } from '@/components/Person';
import { CategoryPrint } from '@/components/Prints';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/dates';
import { freelancerName } from '@/utils/people';

//-----------------------------------------------------\\
//                     CATEGORY BAND
//-----------------------------------------------------\\

//the printed cloth across the top of a gig with its category pill, the card
//uses the small print and the detail page the large one
const CategoryBand = ({ category, large = false }) => (
  <div className={large ? 'relative h-35 flex-none' : 'relative h-16 flex-none'}>
    <CategoryPrint category={category} size={large ? 'large' : 'card'} />
    <CategoryPill
      category={category}
      className={
        large
          ? 'absolute bottom-4 left-5 h-8 gap-1.5 px-3.5 text-[13px] [&>svg]:size-4!'
          : 'absolute bottom-2.5 left-3.5'
      }
    />
  </div>
);

//-----------------------------------------------------\\
//                       GIG CARD
//-----------------------------------------------------\\

//one gig in the browse grid, everything shown is escaped text from the api
//browse is the query string of the list the card came from, carried along
//so the detail page's back link returns to the same filters and page
const GigCard = ({ gig, browse = '' }) => {
  const to = '/gigs/' + encodeURIComponent(gig.id);
  const state = { browse };

  return (
    <Card className="gap-0 py-0">
      <CategoryBand category={gig.category} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-[21px] leading-tight font-bold">
          <Link to={to} state={state} className="rounded-sm text-ink hover:text-primary hover:underline">
            {gig.title}
          </Link>
        </h2>
        <p className="line-clamp-2 min-h-11 text-muted-foreground">{gig.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2.5 pt-1.5">
          <Person name={freelancerName(gig)} detail={'Listed ' + formatDate(gig.createdAt)} />
          <Money cents={gig.priceCents} />
        </div>
        <Link
          to={to}
          state={state}
          className="inline-flex items-center gap-1.5 self-start rounded-sm text-[13px] font-semibold text-primary hover:underline"
        >
          View gig
          <ArrowRight aria-hidden="true" className="size-3.5" />
          <span className="sr-only">{': ' + gig.title}</span>
        </Link>
      </div>
    </Card>
  );
};

//the ghost of a card shown while the list loads, same size as the real one
//so nothing jumps when the gigs arrive
const GigCardSkeleton = () => (
  <Card className="gap-0 py-0">
    <Skeleton className="h-16 rounded-none" />
    <div className="flex flex-col gap-2.5 p-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/5" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-8 w-30 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  </Card>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { CategoryBand, GigCard, GigCardSkeleton };
