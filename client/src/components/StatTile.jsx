//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

//-----------------------------------------------------\\
//                      STAT TILE
//-----------------------------------------------------\\

//one headline number with its label above and a short note below
//hero is the single figure a page leads with, drawn large
//the figures are in the body face with ordinary digit widths, a display face
//or even-width digits make a large number look loose
const StatTile = ({ label, value, detail, hero = false, className }) => (
  <Card className={cn('gap-1.5 px-5.5 py-5 max-sm:px-4.5', className)}>
    <p className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">{label}</p>
    <p
      className={cn(
        'font-sans font-extrabold tracking-tight',
        hero ? 'text-[clamp(40px,8vw,60px)] leading-none' : 'text-[30px] leading-tight'
      )}
    >
      {value}
    </p>
    {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
  </Card>
);

//the tile's shape while the numbers load
const StatTileSkeleton = ({ hero = false, className }) => (
  <Card aria-hidden="true" className={cn('gap-3 px-5.5 py-5 max-sm:px-4.5', className)}>
    <Skeleton className="h-3 w-24" />
    <Skeleton className={hero ? 'h-12 w-56' : 'h-8 w-28'} />
    <Skeleton className="h-3.5 w-36" />
  </Card>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { StatTile, StatTileSkeleton };
