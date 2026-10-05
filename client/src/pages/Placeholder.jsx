//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Hammer } from 'lucide-react';
import { PageHeader, Sticker } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

//-----------------------------------------------------\\
//                   PAGE PLACEHOLDER
//-----------------------------------------------------\\

//stands in for a page until its build stage lands, so the routes, guards and
//navigation can be tried end to end first, each stage swaps one out
const Placeholder = ({ lead, sticker, pageTitle }) => (
  <>
    <PageHeader
      title={
        <>
          {lead} <Sticker>{sticker}</Sticker>
        </>
      }
      pageTitle={pageTitle}
    />
    <Card className="py-0">
      <Empty>
        <EmptyMedia variant="icon">
          <Hammer aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Still being built</EmptyTitle>
        <EmptyDescription>This page arrives in a later stage of the build.</EmptyDescription>
      </Empty>
    </Card>
  </>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Placeholder;
