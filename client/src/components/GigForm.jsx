//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { messageFor } from '@/api/client';
import * as api from '@/api/endpoints';
import ErrorBanner from '@/components/ErrorBanner';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { GIG_CATEGORIES, categoryLabel, isCategory } from '@/utils/categories';
import { toCents, toRands } from '@/utils/money';
import { LIMITS, mapFieldErrors, validateGig } from '@/utils/validation';

//-----------------------------------------------------\\
//                     FORM SETTINGS
//-----------------------------------------------------\\

const FIELDS = ['title', 'description', 'category', 'price'];

//a new gig starts empty, an edit starts from the stored gig with its price
//turned back into rands
const startingValues = (gig) =>
  gig
    ? {
        title: gig.title,
        description: gig.description,
        category: isCategory(gig.category) ? gig.category : '',
        price: toRands(gig.priceCents)
      }
    : { title: '', description: '', category: '', price: '' };

//an edit sends only what changed, which the api's update rules allow
const changedFields = (gig, fields) =>
  Object.fromEntries(Object.entries(fields).filter(([key, value]) => gig[key] !== value));

//the api names the price priceCents and words its limit in cents, the form
//shows the same limit in rands next to the price box instead
const priceInRands = (fieldErrors) =>
  (fieldErrors || []).map((item) =>
    item.field === 'priceCents' ? { field: 'price', message: 'must be between R 1 and R 100 000' } : item
  );

//the rand sign inside the start of the price box, decoration like an icon
const RandSign = ({ className, ...props }) => (
  <span {...props} className={cn(className, 'grid place-items-center text-[15px] leading-none font-bold')}>
    R
  </span>
);

//-----------------------------------------------------\\
//                       GIG FORM
//-----------------------------------------------------\\

//creates a gig, or edits one when gig is given, checking every field first
//and then showing whatever the api still refuses beside its field
//the title box takes focus when the form opens, the form is a named landmark
//so a screen reader says which form it is in
//onSaved receives the api's gig and whether anything changed, onMissing is
//for an edit whose gig no longer exists
const GigForm = ({ gig, onSaved, onCancel, onMissing }) => {
  const editing = Boolean(gig);
  const [starting] = useState(() => startingValues(gig));
  const [values, setValues] = useState(starting);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const categoryRef = useRef(null);
  const priceRef = useRef(null);
  const unsaved = !saving && FIELDS.some((field) => values[field] !== starting[field]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  //closing or reloading the tab with typed but unsaved changes asks first,
  //the browser words the question itself
  useEffect(() => {
    if (!unsaved) {
      return;
    }

    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  const showErrors = (found) => {
    flushSync(() => setErrors(found));
    const inputs = { title: titleRef, description: descriptionRef, category: categoryRef, price: priceRef };
    const first = FIELDS.find((field) => found[field]);

    if (first && inputs[first].current) {
      inputs[first].current.focus();
    }
  };

  const change = (event) => {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: validateGig(next)[name] }));
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setBanner(null);
    const found = validateGig(values);

    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }

    const fields = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      priceCents: toCents(values.price)
    };
    const body = editing ? changedFields(gig, fields) : fields;

    if (editing && Object.keys(body).length === 0) {
      onSaved(gig, false);
      return;
    }

    setSaving(true);

    try {
      const data = editing ? await api.updateGig(gig.id, body) : await api.createGig(body);
      onSaved(data && data.gig ? data.gig : null, true);
    } catch (error) {
      setSaving(false);

      if (editing && error && error.status === 404) {
        onMissing(gig);
        return;
      }

      const mapped = mapFieldErrors(priceInRands(error && error.fieldErrors), FIELDS);
      const hasFieldErrors = Object.keys(mapped.errors).length > 0;

      setBanner(hasFieldErrors && !mapped.unmatched ? null : messageFor(error));
      showErrors(mapped.errors);
    }
  };

  const busyLabel = editing ? 'Saving…' : 'Publishing…';
  const submitLabel = editing ? 'Save changes' : 'Publish gig';

  return (
    <Card className="mb-6 px-6 max-sm:px-4.5">
      <form noValidate onSubmit={submit} aria-labelledby="gig-form-title" className="flex flex-col gap-4">
        <div>
          <h2 id="gig-form-title" className="text-[26px] leading-tight font-extrabold">
            {editing ? 'Edit gig' : 'New gig'}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {editing
              ? 'Changes show in Browse as soon as you save them.'
              : 'Clients can find and book it as soon as you publish.'}
          </p>
        </div>

        {banner && <ErrorBanner message={banner} />}

        <FormField
          id="gig-title"
          name="title"
          label="Title"
          ref={titleRef}
          value={values.title}
          onChange={change}
          error={errors.title}
          hint={'Between ' + LIMITS.titleMin + ' and ' + LIMITS.titleMax + ' characters.'}
          autoComplete="off"
          maxLength={LIMITS.titleMax}
        />
        <FormField
          as={Textarea}
          id="gig-description"
          name="description"
          label="Description"
          ref={descriptionRef}
          value={values.description}
          onChange={change}
          error={errors.description}
          hint={
            'What the client gets, at least ' +
            LIMITS.descriptionMin +
            ' characters. ' +
            values.description.length +
            ' of ' +
            LIMITS.descriptionMax +
            ' used.'
          }
          maxLength={LIMITS.descriptionMax}
        />
        <div className="grid grid-cols-2 items-start gap-4 max-sm:grid-cols-1">
          <FormField
            as={NativeSelect}
            id="gig-category"
            name="category"
            label="Category"
            ref={categoryRef}
            value={values.category}
            onChange={change}
            error={errors.category}
            controlClassName="w-full"
          >
            <NativeSelectOption value="">Choose a category</NativeSelectOption>
            {GIG_CATEGORIES.map((category) => (
              <NativeSelectOption key={category} value={category}>
                {categoryLabel(category)}
              </NativeSelectOption>
            ))}
          </FormField>
          <FormField
            id="gig-price"
            name="price"
            label="Price"
            icon={RandSign}
            ref={priceRef}
            value={values.price}
            onChange={change}
            error={errors.price}
            hint="In rands, from R 1 to R 100 000. Clients pay exactly this."
            inputMode="decimal"
            autoComplete="off"
            maxLength={12}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving} focusableWhenDisabled>
            {saving && <Spinner aria-hidden="true" role={undefined} />}
            {saving ? busyLabel : submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default GigForm;
