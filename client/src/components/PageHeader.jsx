//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { cn } from '@/lib/utils';

//-----------------------------------------------------\\
//                      PAGE HEADER
//-----------------------------------------------------\\

//the word in a heading that sits on the tilted white plate
const Sticker = ({ children }) => <span className="sticker">{children}</span>;

//every page opens the same way, a big heading with one sticker word, a short
//line under it and room on the right for the page's main action
//the heading takes focus after each navigation so a screen reader starts at
//the new page, and the tab title names the page for the same reason
const PageHeader = ({ title, pageTitle, lede, className, children }) => (
  <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
    <title>{pageTitle + ' · HustleHub+'}</title>
    <div>
      <h1 tabIndex={-1} className="text-[clamp(32px,5vw,52px)] leading-[1.08] font-extrabold">
        {title}
      </h1>
      {lede && <p className="mt-2 max-w-[62ch] text-[17px] text-muted-foreground">{lede}</p>}
    </div>
    {children}
  </div>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { PageHeader, Sticker };
