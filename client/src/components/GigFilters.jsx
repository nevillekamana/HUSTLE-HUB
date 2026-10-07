//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Search } from 'lucide-react';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GIG_CATEGORIES, categoryLabel } from '@/utils/categories';
import { toCents } from '@/utils/money';

//-----------------------------------------------------\\
//                      CHIP STYLES
//-----------------------------------------------------\\

//the pills press in like the apply button, a hard shadow at rest, a small
//sink on hover and fully sunk once chosen, hover leaves a chosen pill alone
const CHIP =
  'inline-flex min-h-9 items-center rounded-full border-2 px-4 text-[13px] font-semibold transition-[transform,box-shadow,background-color] duration-100 not-aria-pressed:hover:translate-x-px not-aria-pressed:hover:translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none aria-pressed:translate-x-[3px] aria-pressed:translate-y-[3px] aria-pressed:shadow-none';

//all stays teal, each category wears its own washed cloth and turns solid
//when chosen
const CHIP_ALL =
  'border-primary bg-card text-primary shadow-[3px_3px_0_var(--primary)] not-aria-pressed:hover:bg-tint not-aria-pressed:hover:shadow-[2px_2px_0_var(--primary)] aria-pressed:bg-primary aria-pressed:text-white';

const CHIP_CATEGORY =
  'border-(--cat-ring) bg-(--cat-wash) text-(--cat-cloth) shadow-[3px_3px_0_var(--cat-cloth)] not-aria-pressed:hover:bg-(--cat-hover) not-aria-pressed:hover:shadow-[2px_2px_0_var(--cat-cloth)] aria-pressed:border-(--cat-cloth) aria-pressed:bg-(--cat-cloth) aria-pressed:text-white';

//-----------------------------------------------------\\
//                     DRAFT CHECKS
//-----------------------------------------------------\\

//prices are typed in rands and sent as cents, an empty box means no limit
const checkDrafts = (drafts) => {
  const errors = {};
  const min = drafts.min.trim();
  const max = drafts.max.trim();

  if (min !== '' && toCents(min) === null) {
    errors.min = 'must be an amount in rands, like 150 or 99.50';
  }

  if (max !== '' && toCents(max) === null) {
    errors.max = 'must be an amount in rands, like 150 or 99.50';
  }

  if (!errors.min && !errors.max && min !== '' && max !== '' && toCents(max) < toCents(min)) {
    errors.max = 'must be at least the min price';
  }

  return errors;
};

//-----------------------------------------------------\\
//                      GIG FILTERS
//-----------------------------------------------------\\

//search and prices wait for apply, a category pill applies straight away and
//takes whatever has been typed with it
//applied holds what the address bar says, so when it changes from outside,
//back button or clear, the boxes follow it
const GigFilters = ({ applied, onApply, onClear }) => {
  const appliedKey = [applied.q, applied.min, applied.max].join('\u0000');
  const [shownKey, setShownKey] = useState(appliedKey);
  const [drafts, setDrafts] = useState({ q: applied.q, min: applied.min, max: applied.max });
  const [errors, setErrors] = useState({});
  const minRef = useRef(null);
  const maxRef = useRef(null);

  if (shownKey !== appliedKey) {
    setShownKey(appliedKey);
    setDrafts({ q: applied.q, min: applied.min, max: applied.max });
    setErrors({});
  }

  const change = (event) => {
    const { name, value } = event.target;
    const next = { ...drafts, [name]: value };
    setDrafts(next);

    if (errors.min || errors.max) {
      setErrors(checkDrafts(next));
    }
  };

  const apply = (category) => {
    const found = checkDrafts(drafts);
    flushSync(() => setErrors(found));

    if (found.min || found.max) {
      const first = found.min ? minRef.current : maxRef.current;

      if (first) {
        first.focus();
      }

      return;
    }

    onApply({ q: drafts.q.trim(), min: drafts.min.trim(), max: drafts.max.trim(), category });
  };

  const submit = (event) => {
    event.preventDefault();
    apply(applied.category);
  };

  const chip = (category, label) => (
    <button
      key={category || 'all'}
      type="button"
      data-category={category || undefined}
      aria-pressed={applied.category === category}
      onClick={() => apply(category)}
      className={cn(CHIP, category ? CHIP_CATEGORY : CHIP_ALL)}
    >
      {label}
    </button>
  );

  return (
    <Card className="mb-4.5 gap-4 px-5.5 max-sm:px-4">
      <form
        noValidate
        role="search"
        aria-label="Filter gigs"
        onSubmit={submit}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-start gap-3.5 max-lg:grid-cols-2">
          <FormField
            id="filter-q"
            name="q"
            type="search"
            label="Search gigs"
            icon={Search}
            value={drafts.q}
            onChange={change}
            maxLength={50}
            autoComplete="off"
            placeholder="Logo, tutoring, copywriting…"
            className="max-lg:col-span-2"
          />
          <FormField
            id="filter-min"
            name="min"
            label="Min price (R)"
            ref={minRef}
            value={drafts.min}
            onChange={change}
            error={errors.min}
            inputMode="decimal"
            autoComplete="off"
          />
          <FormField
            id="filter-max"
            name="max"
            label="Max price (R)"
            ref={maxRef}
            value={drafts.max}
            onChange={change}
            error={errors.max}
            inputMode="decimal"
            autoComplete="off"
          />
          <Button type="submit" className="mt-6.5 max-lg:mt-0">
            Apply filters
          </Button>
          <Button type="button" variant="ghost" onClick={onClear} className="mt-6.5 max-lg:mt-0">
            Clear
          </Button>
        </div>

        <div role="group" aria-label="Category" className="flex flex-wrap items-center gap-2 pr-1 pb-1">
          {chip('', 'All')}
          {GIG_CATEGORIES.map((category) => chip(category, categoryLabel(category)))}
        </div>
      </form>
    </Card>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default GigFilters;
