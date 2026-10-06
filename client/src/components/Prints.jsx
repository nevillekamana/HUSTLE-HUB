//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { GIG_CATEGORIES, categoryOrOther } from '@/utils/categories';

//-----------------------------------------------------\\
//                   CATEGORY MOTIFS
//-----------------------------------------------------\\

//every print is a shweshwe half drop in a 32px tile, one motif top left, a
//second offset diagonally and two filler dots, drawn in a 12px box so it reads
//as texture on a card band and as a picture when enlarged
//the colours come from the data-category variables on the pattern itself,
//print is the line colour and cloth the washed ground it sits on
const PRINT = 'fill-(--cat-ring)';
const PRINT_LINE = 'fill-none stroke-(--cat-ring)';
const CLOTH = 'fill-(--cat-wash)';
const CLOTH_LINE = 'fill-none stroke-(--cat-wash)';

const MotifA = ({ children }) => <g transform="translate(2 2)">{children}</g>;
const MotifB = ({ children }) => <g transform="translate(18 18)">{children}</g>;

const FillerDots = () => (
  <>
    <circle cx="26" cy="7" r="1.2" className={PRINT} />
    <circle cx="7" cy="26" r="1.2" className={PRINT} />
  </>
);

const MOTIFS = {
  //an artist palette with paint wells, and a pencil
  design: (
    <>
      <MotifA>
        <path d="M6 0.8 C2.8 0.8 0.6 3.1 0.6 6 C0.6 9 2.9 11.3 5.8 11.3 C6.8 11.3 7.2 10.7 6.9 10 C6.6 9.2 7.1 8.4 8 8.4 H9.2 C10.5 8.4 11.4 7.5 11.4 6.2 C11.4 3.2 9 0.8 6 0.8 Z" className={PRINT} />
        <circle cx="3.2" cy="5.8" r="1.1" className={CLOTH} />
        <circle cx="4.9" cy="3.2" r="1.1" className={CLOTH} />
        <circle cx="8" cy="3.1" r="1.1" className={CLOTH} />
        <circle cx="3.9" cy="8.7" r="1" className={CLOTH} />
      </MotifA>
      <MotifB>
        <g transform="rotate(-45 6 6)">
          <path d="M2.8 4.3 H9.4 V7.7 H2.8 L0.2 6 Z" className={PRINT} />
          <rect x="9.9" y="4.3" width="1.9" height="3.4" rx="0.5" className={PRINT} />
          <path d="M2.8 4.3 V7.7 M3.4 6 H9.2" strokeWidth="0.6" className={CLOTH_LINE} />
        </g>
      </MotifB>
    </>
  ),

  //a document with a folded corner, and quotation marks
  writing: (
    <>
      <MotifA>
        <path d="M1.8 0.6 H7.6 L10.2 3.2 V11.4 H1.8 Z" className={PRINT} />
        <path d="M7.6 0.6 L10.2 3.2 H7.6 Z" className={CLOTH} />
        <path d="M3.6 5.4 H8.4 M3.6 7.4 H8.4 M3.6 9.4 H6.8" strokeWidth="0.9" strokeLinecap="round" className={CLOTH_LINE} />
      </MotifA>
      <MotifB>
        <path d="M3 5.4 A2.1 2.1 0 1 1 0.9 7.5 C0.9 4.6 2.5 2.6 5 1.8 L5.3 2.8 C3.9 3.4 3.1 4.4 3 5.4 Z" className={PRINT} />
        <path d="M8.6 5.4 A2.1 2.1 0 1 1 6.5 7.5 C6.5 4.6 8.1 2.6 10.6 1.8 L10.9 2.8 C9.5 3.4 8.7 4.4 8.6 5.4 Z" className={PRINT} />
      </MotifB>
    </>
  ),

  //code brackets, and a terminal window
  development: (
    <>
      <MotifA>
        <path d="M3.6 3 L0.9 6 L3.6 9 M8.4 3 L11.1 6 L8.4 9 M7 1.8 L5 10.2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={PRINT_LINE} />
      </MotifA>
      <MotifB>
        <rect x="0.8" y="1.8" width="10.4" height="8.4" rx="1.6" strokeWidth="1.4" className={PRINT_LINE} />
        <path d="M3 4.8 L4.9 6.4 L3 8 M6 8 H8.6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={PRINT_LINE} />
      </MotifB>
    </>
  ),

  //a megaphone, and a like heart
  marketing: (
    <>
      <MotifA>
        <path d="M0.8 4.4 H3.4 L9 1.4 V10.6 L3.4 7.6 H0.8 Z" className={PRINT} />
        <path d="M2.8 7.6 L3.9 10.8" strokeWidth="1.4" strokeLinecap="round" className={PRINT_LINE} />
        <path d="M10.4 4 Q11.8 6 10.4 8" strokeWidth="1.2" strokeLinecap="round" className={PRINT_LINE} />
      </MotifA>
      <MotifB>
        <path d="M6 10.6 C2 7.9 0.8 6 0.8 4.2 A2.6 2.6 0 0 1 6 3.2 A2.6 2.6 0 0 1 11.2 4.2 C11.2 6 10 7.9 6 10.6 Z" className={PRINT} />
      </MotifB>
    </>
  ),

  //an apple, and an open book
  tutoring: (
    <>
      <MotifA>
        <path d="M6 3.4 C4.3 2.4 1.2 2.8 1.2 6.4 C1.2 9.3 3.3 11.6 4.8 11.6 C5.4 11.6 5.6 11.3 6 11.3 C6.4 11.3 6.6 11.6 7.2 11.6 C8.7 11.6 10.8 9.3 10.8 6.4 C10.8 2.8 7.7 2.4 6 3.4 Z" className={PRINT} />
        <path d="M6 3.4 C6 2.2 6.4 1.2 7.4 0.6" strokeWidth="1" strokeLinecap="round" className={PRINT_LINE} />
        <path d="M7 1.9 C8.4 0.8 9.8 1.2 10.2 1.8 C9 2.9 7.8 2.7 7 1.9 Z" className={PRINT} />
      </MotifA>
      <MotifB>
        <path d="M6 2.6 C4.6 1.6 2.6 1.4 0.8 1.8 V10.2 C2.6 9.8 4.6 10 6 11 C7.4 10 9.4 9.8 11.2 10.2 V1.8 C9.4 1.4 7.4 1.6 6 2.6 Z" className={PRINT} />
        <path d="M6 2.8 V10.8" strokeWidth="0.9" className={CLOTH_LINE} />
      </MotifB>
    </>
  ),

  //the triangle, circle and square mark for all sorts, and a puzzle piece
  other: (
    <>
      <MotifA>
        <path d="M6 0.6 L9.2 5.4 H2.8 Z" className={PRINT} />
        <circle cx="3.2" cy="9" r="2.4" className={PRINT} />
        <rect x="6.8" y="6.6" width="4.6" height="4.6" rx="0.6" className={PRINT} />
      </MotifA>
      <MotifB>
        <path d="M1 3.8 H4 A1.6 1.6 0 1 1 7.2 3.8 H10 V6.4 A1.6 1.6 0 1 1 10 9.6 V11.4 H1 Z" className={PRINT} />
      </MotifB>
    </>
  )
};

//-----------------------------------------------------\\
//                    PATTERN DEFS
//-----------------------------------------------------\\

//a card band uses the print at 1.25x and the gig detail header at 2x
const SCALES = { card: 1.25, large: 2 };

const CategoryPattern = ({ category, size }) => (
  <pattern
    id={'print-' + category + '-' + size}
    data-category={category}
    width="32"
    height="32"
    patternUnits="userSpaceOnUse"
    patternTransform={'scale(' + SCALES[size] + ')'}
  >
    <rect width="32" height="32" className={CLOTH} />
    {MOTIFS[category]}
    <FillerDots />
  </pattern>
);

//the brand print is the four petal flower from the logo, teal on teal
const BrandPattern = ({ id, scale }) => (
  <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform={'scale(' + scale + ')'}>
    <rect width="24" height="24" className="fill-primary" />
    <circle cx="12" cy="7.5" r="3" className="fill-print" />
    <circle cx="16.5" cy="12" r="3" className="fill-print" />
    <circle cx="12" cy="16.5" r="3" className="fill-print" />
    <circle cx="7.5" cy="12" r="3" className="fill-print" />
    <circle cx="12" cy="12" r="1.6" className="fill-primary" />
    <circle cx="0" cy="0" r="1.3" className="fill-print" />
    <circle cx="24" cy="0" r="1.3" className="fill-print" />
    <circle cx="0" cy="24" r="1.3" className="fill-print" />
    <circle cx="24" cy="24" r="1.3" className="fill-print" />
  </pattern>
);

//mounted once by the app shell, every print on the page references these ids
//instead of repeating the pattern markup on each card
//zero sized rather than display none, a pattern inside a hidden svg stops
//painting in some browsers
const PrintDefs = () => (
  <svg aria-hidden="true" width="0" height="0" className="absolute">
    <defs>
      <BrandPattern id="print-brand" scale={1} />
      <BrandPattern id="print-brand-large" scale={2.5} />
      {GIG_CATEGORIES.map((category) => (
        <Fragment key={category}>
          <CategoryPattern category={category} size="card" />
          <CategoryPattern category={category} size="large" />
        </Fragment>
      ))}
    </defs>
  </svg>
);

//-----------------------------------------------------\\
//                    PRINT SURFACES
//-----------------------------------------------------\\

//fills whatever box it is placed in with a category print
const CategoryPrint = ({ category, size = 'card', className }) => (
  <svg aria-hidden="true" className={cn('block size-full', className)}>
    <rect width="100%" height="100%" fill={'url(#print-' + categoryOrOther(category) + '-' + size + ')'} />
  </svg>
);

//the teal strip under the header and the backdrop of the sign in art
const BrandPrint = ({ size = 'strip', className }) => (
  <svg aria-hidden="true" className={cn('block w-full', size === 'strip' ? 'h-3.5' : 'size-full', className)}>
    <rect width="100%" height="100%" fill={'url(#print-brand' + (size === 'strip' ? '' : '-large') + ')'} />
  </svg>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { PrintDefs, CategoryPrint, BrandPrint };
