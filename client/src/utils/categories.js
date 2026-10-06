//-----------------------------------------------------\\
//                   GIG CATEGORIES
//-----------------------------------------------------\\

//mirrors GIG_CATEGORIES in the api gig model, the server rejects anything
//outside this list so the client offers exactly the same set
//the order here is the order the filter chips and the dropdown show
const GIG_CATEGORIES = ['design', 'writing', 'development', 'marketing', 'tutoring', 'other'];

const CATEGORY_LABELS = Object.freeze({
  design: 'Design',
  writing: 'Writing',
  development: 'Development',
  marketing: 'Marketing',
  tutoring: 'Tutoring',
  other: 'Other'
});

//-----------------------------------------------------\\
//                       HELPERS
//-----------------------------------------------------\\

//an unknown value from an older record still gets a readable label and the
//neutral cloth rather than breaking the card it sits on
const isCategory = (value) => GIG_CATEGORIES.includes(value);

const categoryLabel = (value) => CATEGORY_LABELS[value] || CATEGORY_LABELS.other;

const categoryOrOther = (value) => (isCategory(value) ? value : 'other');

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { GIG_CATEGORIES, CATEGORY_LABELS, isCategory, categoryLabel, categoryOrOther };
