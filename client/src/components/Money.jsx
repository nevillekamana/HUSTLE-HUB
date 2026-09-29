//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCents } from '@/utils/money';

//-----------------------------------------------------\\
//                         MONEY
//-----------------------------------------------------\\

//every price on the site is this aqua tag, so an amount always looks like an
//amount, the large size is for the price beside the book button
const Money = ({ cents, size = 'default', className }) => (
  <Badge variant="price" className={cn(size === 'lg' && 'px-4.5 py-2 text-3xl', className)}>
    {formatCents(cents)}
  </Badge>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Money;
