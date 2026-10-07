//-----------------------------------------------------\\
//                     TABLE STYLES
//-----------------------------------------------------\\

//every data table in the app shares these, quiet uppercase column heads,
//rows split by the tint line and numbers right aligned in even columns
const TABLE_HEAD =
  'px-4.5 py-3 text-left text-xs font-bold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase';

const TABLE_CELL = 'border-t-2 border-tint px-4.5 py-3.5';

const TABLE_NUMBER = 'text-right whitespace-nowrap tabular-nums';

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { TABLE_CELL, TABLE_HEAD, TABLE_NUMBER };
