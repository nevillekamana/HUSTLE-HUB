//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { messageFor } from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import AuthLayout from '@/components/AuthLayout';
import ErrorBanner from '@/components/ErrorBanner';
import FormField from '@/components/FormField';
import { Sticker } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { LIMITS, mapFieldErrors, validateLogin } from '@/utils/validation';

//-----------------------------------------------------\\
//                     DEMO ACCOUNTS
//-----------------------------------------------------\\

//only when every route is mocked for a design review, the flag is compared
//as a plain literal so a normal build leaves these out of the bundle entirely
//the real api has no such accounts
const DEMO_ON = import.meta.env.VITE_API_MOCKS === 'all';
const DEMO_PASSWORD = DEMO_ON ? 'Lagoon-demo-26' : '';
const DEMO_ACCOUNTS = DEMO_ON
  ? [
      ['Client', 'lerato@example.co.za'],
      ['Freelancer', 'thandi@example.co.za'],
      ['Admin', 'admin@hustlehub.co.za']
    ]
  : [];

const FIELDS = ['email', 'password'];

//-----------------------------------------------------\\
//                      LOGIN PAGE
//-----------------------------------------------------\\

//a successful sign in starts the session and the guest route then sends the
//person on, back to the page they asked for or home, so this page never
//navigates itself
//a wrong password, a rate limit or an outage shows as one safe sentence and
//the password box is emptied for the next try
const Login = () => {
  const { login } = useAuth();
  const location = useLocation();
  const [values, setValues] = useState(() => ({
    email: location.state && typeof location.state.email === 'string' ? location.state.email : '',
    password: ''
  }));
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  //errors are committed before focus moves, so the field is read out with its
  //message already attached
  const showErrors = (found, fallback) => {
    flushSync(() => setErrors(found));
    const inputs = { email: emailRef, password: passwordRef };
    const first = FIELDS.find((field) => found[field]) || fallback;

    if (first && inputs[first].current) {
      inputs[first].current.focus();
    }
  };

  //once a field has been flagged it is rechecked as the person types, so the
  //message goes away the moment it is fixed
  const change = (event) => {
    const { name, value } = event.target;
    const next = { ...values, [name]: value };
    setValues(next);

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: validateLogin(next)[name] }));
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setBanner(null);
    const found = validateLogin(values);

    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }

    setSubmitting(true);

    try {
      await login({ email: values.email.trim(), password: values.password });
    } catch (error) {
      const mapped = mapFieldErrors(error && error.fieldErrors, FIELDS);
      const hasFieldErrors = Object.keys(mapped.errors).length > 0;

      setBanner(hasFieldErrors && !mapped.unmatched ? null : messageFor(error));
      setValues((current) => ({ ...current, password: '' }));
      setSubmitting(false);
      showErrors(mapped.errors, 'password');
    }
  };

  const fillDemo = (email) => {
    setValues({ email, password: DEMO_PASSWORD });
    setErrors({});
    setBanner(null);

    if (passwordRef.current) {
      passwordRef.current.focus();
    }
  };

  return (
    <AuthLayout
      title={
        <>
          Welcome <Sticker>back</Sticker>
        </>
      }
      pageTitle="Sign in"
      lede="Sign in to book gigs, manage your listings and see your income."
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        {banner && <ErrorBanner message={banner} />}

        <FormField
          id="login-email"
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
          id="login-password"
          name="password"
          type="password"
          label="Password"
          ref={passwordRef}
          value={values.password}
          onChange={change}
          error={errors.password}
          autoComplete="current-password"
          maxLength={LIMITS.passwordMax}
        />

        <Button type="submit" className="w-full" disabled={submitting} focusableWhenDisabled>
          {submitting && <Spinner aria-hidden="true" role={undefined} />}
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-sm text-muted-foreground">
          New to HustleHub+?{' '}
          <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>

      {DEMO_ON && (
        <section aria-labelledby="demo-heading" className="flex flex-col gap-2.5 border-t-2 border-tint pt-4.5">
          <h2 id="demo-heading" className="text-base font-extrabold">
            Demo accounts
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Mock mode only. Every demo account uses the password{' '}
            <code className="rounded-md bg-tint px-1.5 py-0.5 text-[13px]">{DEMO_PASSWORD}</code>.
          </p>
          <ul className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map(([role, email]) => (
              <li key={email} className="flex items-center justify-between gap-2.5">
                <span className="min-w-0">
                  <strong className="block">{role}</strong>
                  <span className="block truncate text-[13px] text-muted-foreground">{email}</span>
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => fillDemo(email)}>
                  Use this account
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AuthLayout>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Login;
