//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Check } from 'lucide-react';
import { CategoryTile } from '@/components/Category';
import { Logo } from '@/components/Logo';
import { Sticker } from '@/components/PageHeader';
import { BrandPrint } from '@/components/Prints';
import { Card } from '@/components/ui/card';
import { GIG_CATEGORIES, categoryLabel } from '@/utils/categories';

//-----------------------------------------------------\\
//                     SELLING POINTS
//-----------------------------------------------------\\

const PROMISES = [
  'Every gig shows its full price up front, in rands.',
  'Each booking gets a payment reference you can quote later.',
  'Freelancers see their income by gig and by month.'
];

//-----------------------------------------------------\\
//                      AUTH LAYOUT
//-----------------------------------------------------\\

//sign in and create account share this frame, the form card beside a print
//panel that says what the marketplace is
//the form comes first in the page so keyboard and screen reader users reach
//it straight away, on a wide screen the panel is moved to the left, on a
//phone it follows the form and drops the logo and the category list
//the white panel fills the print with an even frame all round
const AuthLayout = ({ title, pageTitle, lede, children }) => (
  <div className="grid grid-cols-2 items-stretch gap-8 max-md:grid-cols-1 max-md:gap-6">
    <title>{pageTitle + ' · HustleHub+'}</title>

    <Card className="gap-6 px-7 py-7 max-sm:px-5 max-sm:py-6">
      <div>
        <h1 tabIndex={-1} className="text-4xl leading-[1.08] font-extrabold max-sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-2 text-[17px] text-muted-foreground">{lede}</p>
      </div>
      {children}
    </Card>

    <section
      aria-label="About HustleHub+"
      className="relative flex min-h-115 overflow-hidden rounded-card border-2 border-primary shadow-hard md:order-first max-md:min-h-0"
    >
      <BrandPrint size="large" className="absolute inset-0" />
      <div className="relative m-5.5 flex flex-1 flex-col justify-between gap-7 rounded-card border-2 border-primary bg-card p-7 max-sm:m-3.5 max-sm:p-5">
        <Logo className="max-md:hidden" />

        <div className="flex flex-col gap-4">
          <h2 className="text-[32px] leading-tight font-extrabold max-sm:text-[28px]">
            Local talent, <Sticker>fixed</Sticker> prices.
          </h2>
          <ul className="flex flex-col gap-2.5">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-start gap-2.5">
                <Check aria-hidden="true" className="mt-0.5 size-4.5 flex-none text-primary" />
                <span>{promise}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 max-md:hidden">
          <h3 className="font-sans text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
            What you can book
          </h3>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-3.5 gap-y-2.5">
            {GIG_CATEGORIES.map((category) => (
              <li key={category} className="flex items-center gap-2.5 text-sm font-semibold">
                <CategoryTile category={category} />
                {categoryLabel(category)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  </div>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default AuthLayout;
