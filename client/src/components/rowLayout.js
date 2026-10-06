//-----------------------------------------------------\\
//                      ROW LAYOUT
//-----------------------------------------------------\\

//my gigs and my bookings share one layout, emblem, title, details, price,
//then whatever ends the row, on a narrow screen the price stays beside the
//title and the rest drops underneath
//the list holds the columns and each row borrows them as a subgrid, so
//prices and buttons line up down the list whatever their width
const ROW_LIST =
  'grid grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_auto_auto] gap-x-4 max-lg:grid-cols-[auto_minmax(0,1fr)_auto] max-sm:gap-x-3';

const ROW =
  'col-span-full grid grid-cols-subgrid items-center gap-y-3 border-t-2 border-tint px-4.5 py-3.5 first:border-t-0 max-sm:px-3.5';

//the price keeps its place beside the title on a narrow screen
const ROW_PRICE = 'justify-self-end max-lg:col-start-3 max-lg:row-start-1';

const UNDER_TITLE = 'max-lg:col-span-2 max-lg:col-start-2';

//on a phone the buttons take the full width of the row so they stay on one line
const ROW_ACTIONS = 'max-lg:col-span-2 max-lg:col-start-2 max-sm:col-span-full max-sm:col-start-1';

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { ROW_LIST, ROW, ROW_PRICE, UNDER_TITLE, ROW_ACTIONS };
