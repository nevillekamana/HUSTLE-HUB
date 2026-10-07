//-----------------------------------------------------\\
//                      LIST HEADER
//-----------------------------------------------------\\

//the top of a list card, a heading with a short summary beside it
//it is shown while loading too, with a ghost summary, so the list does not
//jump when it arrives, and the heading can take focus when a row is removed
//id lets a table beneath name itself after the heading
const ListHeader = ({ id, title, headingRef, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-2 border-tint px-4.5 py-3.5 max-sm:px-3.5">
    <h2 id={id} ref={headingRef} tabIndex={-1} className="text-[19px] font-bold">
      {title}
    </h2>
    {children}
  </div>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default ListHeader;
