//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { messageFor } from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import AuthLayout from '@/components/AuthLayout';
import ErrorBanner from '@/components/ErrorBanner';
import FormField from '@/components/FormField';
import { Sticker } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { LIMITS, mapFieldErrors, validateRegister } from '@/utils/validation';

//-----------------------------------------------------\\
//                     FORM SETTINGS
//-----------------------------------------------------\\

const FIELDS = ['fullName', 'email', 'password', 'role'];

//the two roles anyone may pick, client is chosen to start with, which is
//also what the api assumes when no role is sent
const ROLE_CHOICES = [
  ['client', 'Hire freelancers', 'Browse and book gigs'],
  ['freelancer', 'Offer my services', 'List gigs and track income']
];

const ACCOUNT_CREATED = 'Account created, sign in with your new details';

//-----------------------------------------------------\\
//                     REGISTER PAGE
//-----------------------------------------------------\\

//checks every field before sending, then shows whatever the api still
//refuses next to the field it belongs to
//creating an account does not sign anyone in, so a new person is taken to
//sign in with their email already filled and a note that it worked
const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: '', email: '', password: '', role: 'client' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const roleRef = useRef(null);

  const showErrors = (found) => {
    flushSync(() => setErrors(found));
    const inputs = { fullName: fullNameRef, email: emailRef, password: passwordRef, role: roleRef };
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
      setErrors((current) => ({ ...current, [name]: validateRegister(next)[name] }));
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setBanner(null);
    const found = validateRegister(values);

    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }

    setSubmitting(true);
    const email = values.email.trim();

    try {
      await register({ fullName: values.fullName.trim(), email, password: values.password, role: values.role });
      navigate('/login', { state: { notice: ACCOUNT_CREATED, tone: 'success', email } });
    } catch (error) {
      //a taken address is the one refusal worth pinning to its field
      const mapped =
        error && error.status === 409
          ? { errors: { email: 'is already registered' }, unmatched: false }
          : mapFieldErrors(error && error.fieldErrors, FIELDS);
      const hasFieldErrors = Object.keys(mapped.errors).length > 0;

      setBanner(hasFieldErrors && !mapped.unmatched ? null : messageFor(error));
      setSubmitting(false);
      showErrors(mapped.errors);
    }
  };

  return (
    <AuthLayout
      title={
        <>
          Create your <Sticker>account</Sticker>
        </>
      }
      pageTitle="Create account"
      lede="Join as a client to book gigs, or as a freelancer to list your own."
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        {banner && <ErrorBanner message={banner} />}

        <FormField
          id="register-full-name"
          name="fullName"
          label="Full name"
          ref={fullNameRef}
          value={values.fullName}
          onChange={change}
          error={errors.fullName}
          autoComplete="name"
          maxLength={LIMITS.nameMax}
        />
        <FormField
          id="register-email"
          name="email"
          type="email"
          label="Email"
          ref={emailRef}
          value={values.email}
          onChange={change}
          error={errors.email}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={LIMITS.emailMax}
        />
        <FormField
          id="register-password"
          name="password"
          type="password"
          label="Password"
          ref={passwordRef}
          value={values.password}
          onChange={change}
          error={errors.password}
          hint="At least 8 characters, with a letter and a number."
          autoComplete="new-password"
          maxLength={LIMITS.passwordMax}
        />

        <fieldset aria-describedby={errors.role ? 'register-role-error' : undefined}>
          <legend className="mb-2 text-[13px] font-semibold text-muted-foreground">I want to</legend>
          <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
            {ROLE_CHOICES.map(([value, title, text], index) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-2.5 rounded-[14px] border-2 border-tint bg-card px-3.5 py-3 has-checked:border-primary has-checked:bg-tint"
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  ref={index === 0 ? roleRef : undefined}
                  checked={values.role === value}
                  onChange={change}
                  className="mt-1 size-4 flex-none accent-primary"
                />
                <span>
                  <strong className="block">{title}</strong>
                  <span className="text-[13px] text-muted-foreground">{text}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.role && (
            <p id="register-role-error" className="mt-1.5 flex items-start gap-1.5 text-[13px] font-semibold text-destructive">
              <CircleAlert aria-hidden="true" className="mt-px size-3.5 flex-none" />
              Choose whether you want to hire or offer services
            </p>
          )}
        </fieldset>

        <p className="text-[13px] text-muted-foreground">
          Admin accounts are set up by the platform team and cannot be created here.
        </p>

        <Button type="submit" className="w-full" disabled={submitting} focusableWhenDisabled>
          {submitting && <Spinner aria-hidden="true" role={undefined} />}
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Register;
