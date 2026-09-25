//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import {
  CodeXmlIcon,
  FileTextIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  PaletteIcon,
  ShapesIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { categoryLabel, categoryOrOther } from '@/utils/categories';

//-----------------------------------------------------\\
//                    CATEGORY ICONS
//-----------------------------------------------------\\

//pictorial rather than abstract, each icon names the kind of work at a glance
const CATEGORY_ICONS = {
  design: PaletteIcon,
  writing: FileTextIcon,
  development: CodeXmlIcon,
  marketing: MegaphoneIcon,
  tutoring: GraduationCapIcon,
  other: ShapesIcon
};

const CategoryIcon = ({ category, className }) => {
  const Icon = CATEGORY_ICONS[categoryOrOther(category)];
  return <Icon aria-hidden="true" className={className} />;
};

//-----------------------------------------------------\\
//                  CATEGORY COMPONENTS
//-----------------------------------------------------\\

//the 44px list emblem, washed colour and icon only, the print is kept for the
//larger surfaces where it reads as cloth rather than noise
const CategoryTile = ({ category, className }) => (
  <span
    aria-hidden="true"
    data-category={categoryOrOther(category)}
    className={cn(
      'grid size-11 flex-none place-items-center rounded-lg border-2 border-(--cat-ring) bg-(--cat-wash) text-(--cat-cloth)',
      className
    )}
  >
    <CategoryIcon category={category} className="size-5" />
  </span>
);

//the small washed label that sits under a title in a list row
const CategoryTag = ({ category, className }) => (
  <Badge variant="category" data-category={categoryOrOther(category)} className={className}>
    {categoryLabel(category)}
  </Badge>
);

//the solid pill that sits on a printed band, the only place a cloth is used
//at full strength behind white text
const CategoryPill = ({ category, className }) => (
  <Badge variant="category-solid" data-category={categoryOrOther(category)} className={className}>
    <CategoryIcon category={category} />
    {categoryLabel(category)}
  </Badge>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { CategoryIcon, CategoryTile, CategoryTag, CategoryPill };
