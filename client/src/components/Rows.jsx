//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Link } from 'react-router-dom';
import { CategoryTag, CategoryTile } from '@/components/Category';
import { ROW_LIST } from '@/components/rowLayout';

//-----------------------------------------------------\\
//                       ROW LIST
//-----------------------------------------------------\\

//the list that holds the shared row columns
const RowList = ({ ref, children }) => (
  <ul ref={ref} className={ROW_LIST}>
    {children}
  </ul>
);

//-----------------------------------------------------\\
//                     ROW GIG CELLS
//-----------------------------------------------------\\

//the first two cells of a row, the washed emblem and the gig's title over
//its category, the title links to the gig when its id is known
//the title is the freelancer's own text, shown as text and never as markup
const RowGig = ({ id, title, category }) => (
  <>
    <CategoryTile category={category} />
    <div className="flex min-w-0 flex-col items-start gap-1">
      <h3 className="text-[17px] leading-tight font-bold break-words">
        {id ? (
          <Link
            to={'/gigs/' + encodeURIComponent(id)}
            className="rounded-sm text-ink hover:text-primary hover:underline"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      <CategoryTag category={category} />
    </div>
  </>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { RowGig, RowList };
