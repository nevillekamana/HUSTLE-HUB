//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { cn } from '@/lib/utils';
import { initials } from '@/utils/people';

//-----------------------------------------------------\\
//                        AVATAR
//-----------------------------------------------------\\

//decoration only, the name is always written out beside it
//light is for the teal header, where the tint would disappear
const Avatar = ({ name, light = false, className }) => (
  <span
    aria-hidden="true"
    className={cn(
      'grid size-8 flex-none place-items-center rounded-full text-[11px] font-bold',
      light ? 'bg-aqua text-ink' : 'bg-tint text-primary',
      className
    )}
  >
    {initials(name)}
  </span>
);

//-----------------------------------------------------\\
//                        PERSON
//-----------------------------------------------------\\

//a name with a short line under it, used for who listed or booked something
const Person = ({ name, detail, className }) => (
  <span className={cn('flex min-w-0 items-center gap-2', className)}>
    <Avatar name={name} />
    <span className="flex min-w-0 flex-col leading-tight">
      <span className="truncate text-[13px] font-semibold">{name}</span>
      {detail && <span className="text-[13px] text-muted-foreground">{detail}</span>}
    </span>
  </span>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { Avatar, Person };
