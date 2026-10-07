//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { BrandPrint } from '@/components/Prints';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

//-----------------------------------------------------\\
//                     PRINT EMBLEM
//-----------------------------------------------------\\

//the round cloth badge above an empty or missing page, a white question mark
//on the teal print says "nothing here" at a glance, decoration only
const PrintEmblem = ({ mark = '?' }) => (
  <EmptyMedia className="relative size-19 overflow-hidden rounded-full border-2 border-primary shadow-[3px_3px_0_var(--primary)]">
    <BrandPrint className="absolute inset-0 h-full" />
    {mark && (
      <span aria-hidden="true" className="relative font-heading text-[48px] leading-none font-extrabold text-white">
        {mark}
      </span>
    )}
  </EmptyMedia>
);

//-----------------------------------------------------\\
//                      EMPTY STATE
//-----------------------------------------------------\\

//what a list says when there is nothing in it, the emblem, a short title,
//one line of help and usually a way forward
//the title is a real heading so it shows up in a screen reader's outline,
//one level below the heading of the card it sits in
const EmptyContent = ({ title, text, mark, heading: Heading = 'h2', children }) => (
  <Empty>
    <PrintEmblem mark={mark} />
    <EmptyTitle>
      <Heading>{title}</Heading>
    </EmptyTitle>
    <EmptyDescription>{text}</EmptyDescription>
    {children}
  </Empty>
);

//the same in a card of its own, for a page whose only list is empty
const EmptyState = (props) => (
  <Card className="py-0">
    <EmptyContent {...props} />
  </Card>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { EmptyContent, PrintEmblem };
export default EmptyState;
