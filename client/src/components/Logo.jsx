//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { cn } from '@/lib/utils';

//-----------------------------------------------------\\
//                      LOGO MARK
//-----------------------------------------------------\\

//the h+ glyph in a 100 unit box, a narrow h with a wide gap and a big plus so
//the plus survives at favicon size
const HGlyph = () => (
  <>
    <rect x="14" y="31" width="13" height="46" rx="2" />
    <rect x="41" y="31" width="13" height="46" rx="2" />
    <rect x="14" y="48" width="40" height="12" />
    <rect x="60" y="30" width="28" height="10" rx="3.3" />
    <rect x="69" y="21" width="10" height="28" rx="3.3" />
  </>
);

//the sticker mark, a white plate tilted like the heading stickers with a hard
//shadow behind it, the glyph is nudged off centre so it looks centred
//on the teal header the shadow is ink and the plate needs no edge, on a light
//surface a teal edge and shadow stop the white plate vanishing
const LogoMark = ({ onDark = false, className }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true" className={cn('block flex-none overflow-visible', className)}>
    <g transform="rotate(-6 50 50)">
      <rect x="14" y="14" width="78" height="78" rx="16" className={onDark ? 'fill-ink' : 'fill-primary'} />
      <rect
        x="6"
        y="6"
        width="78"
        height="78"
        rx="16"
        strokeWidth={onDark ? 0 : 6}
        className={cn('fill-white', !onDark && 'stroke-primary')}
      />
      <g transform="translate(6.8 6.8) scale(0.78)" className="fill-primary">
        <HGlyph />
      </g>
    </g>
  </svg>
);

//-----------------------------------------------------\\
//                     FULL LOCKUP
//-----------------------------------------------------\\

//the mark and the wordmark together, the name stays real text so it is read
//out by a screen reader and found by search, and a page translator leaves
//the brand name as it is
//large is the showpiece size for the sign in panel, a step smaller below the
//lg width where that panel is narrower
const Logo = ({ onDark = false, large = false, className }) => (
  <span
    className={cn(
      'inline-flex items-center font-heading leading-none font-extrabold tracking-tight',
      large
        ? 'gap-3.5 text-[40px] max-lg:gap-2.5 max-lg:text-[30px]'
        : 'gap-2.5 text-[25px] max-sm:gap-2 max-sm:text-[22px]',
      onDark ? 'text-white' : 'text-ink',
      className
    )}
  >
    <LogoMark onDark={onDark} className={large ? 'size-18 max-lg:size-14' : 'size-11.5 max-sm:size-10'} />
    <span translate="no">
      HustleHub<span className={onDark ? 'text-aqua' : 'text-primary'}>+</span>
    </span>
  </span>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { Logo, LogoMark };
