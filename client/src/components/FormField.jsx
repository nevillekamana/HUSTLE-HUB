//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { CircleAlert } from 'lucide-react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

//-----------------------------------------------------\\
//                      FORM FIELD
//-----------------------------------------------------\\

//a labelled input with its hint or its error underneath, wired together so a
//screen reader reads the problem when the input takes focus
//error is the api style phrase ("is required"), shown after the label so the
//message always names the field it belongs to
//the error is not a live region itself, the form moves focus to the first
//field in trouble instead, which avoids several alerts firing at once
//an icon, when given, sits inside the start of the box as decoration
const FormField = ({ id, label, error, hint, icon: Icon, className, ...inputProps }) => {
  const errorId = id + '-error';
  const hintId = id + '-hint';
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const input = (
    <Input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={Icon ? 'pl-10' : undefined}
      {...inputProps}
    />
  );

  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {Icon ? (
        <div className="relative">
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
          />
          {input}
        </div>
      ) : (
        input
      )}
      {error ? (
        <FieldError id={errorId} role={undefined} className="flex items-start gap-1.5">
          <CircleAlert aria-hidden="true" className="mt-px size-3.5 flex-none" />
          <span>{label + ' ' + error}</span>
        </FieldError>
      ) : (
        hint && (
          <FieldDescription id={hintId} className="text-[13px]">
            {hint}
          </FieldDescription>
        )
      )}
    </Field>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default FormField;
