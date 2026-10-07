//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Copy, Info, Lock } from 'lucide-react';
import { messageFor } from '@/api/client';
import * as api from '@/api/endpoints';
import { useAuth } from '@/auth/useAuth';
import ErrorBanner from '@/components/ErrorBanner';
import Money from '@/components/Money';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dates';
import { formatCents } from '@/utils/money';
import { freelancerName } from '@/utils/people';

//-----------------------------------------------------\\
//                     SMALL PIECES
//-----------------------------------------------------\\

const EYEBROW = 'text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase';
const PANEL = 'gap-4 px-5.5 max-sm:px-4.5';

//label and value pairs, labels on the left and values right aligned
const Facts = ({ rows }) => (
  <dl className="flex flex-col gap-2">
    {rows.map(([label, value]) => (
      <div key={label} className="flex items-center justify-between gap-3">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="text-right font-semibold tabular-nums">{value}</dd>
      </div>
    ))}
  </dl>
);

const PaymentNote = () => (
  <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
    <Lock aria-hidden="true" className="size-3.5 flex-none" />
    Payment is simulated. No card details are ever collected.
  </p>
);

//the api's own sentence for most refusals, a missing gig is explained in
//terms of this page rather than as a bare "not found"
const bookingProblem = (error) =>
  error && error.status === 404 ? 'This gig is no longer available to book' : messageFor(error);

//-----------------------------------------------------\\
//                  PAYMENT REFERENCE
//-----------------------------------------------------\\

//the reference printed like a ticket stub, with a copy button
//the clipboard is not always allowed (an older browser, a blocked
//permission), then the text is selected instead so ctrl+c still works
const ReferenceTicket = ({ reference }) => {
  const textRef = useRef(null);
  const [copyNote, setCopyNote] = useState('');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopyNote('Reference copied');
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textRef.current);
      selection.removeAllRanges();
      selection.addRange(range);
      setCopyNote('Reference selected, press Ctrl+C to copy');
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className={EYEBROW}>Payment reference</p>
      <div className="relative flex items-center justify-between gap-2.5 rounded-xl border-2 border-dashed border-primary bg-background px-4 py-3 before:absolute before:top-1/2 before:-left-2.5 before:-mt-2 before:size-4 before:rounded-full before:border-2 before:border-primary before:bg-card before:content-[''] after:absolute after:top-1/2 after:-right-2.5 after:-mt-2 after:size-4 after:rounded-full after:border-2 after:border-primary after:bg-card after:content-['']">
        <span ref={textRef} translate="no" className="font-mono text-[17px] font-bold tracking-[0.06em] break-all">
          {reference}
        </span>
        <Button type="button" variant="outline" size="icon-sm" onClick={copy} aria-label="Copy payment reference">
          <Copy aria-hidden="true" />
        </Button>
      </div>
      <p role="status" className="min-h-5 text-[13px] text-muted-foreground">
        {copyNote}
      </p>
    </div>
  );
};

//-----------------------------------------------------\\
//                    CLIENT BOOKING
//-----------------------------------------------------\\

//book, then confirm, then the confirmation with the transaction reference
//each step moves focus to its heading so the change is announced, and
//cancelling puts focus back on the book button
const ClientBooking = ({ gig }) => {
  const [step, setStep] = useState('idle');
  const [problem, setProblem] = useState(null);
  const [result, setResult] = useState(null);
  const headingRef = useRef(null);
  const bookRef = useRef(null);
  const moved = useRef(false);

  useEffect(() => {
    if (!moved.current) {
      return;
    }

    moved.current = false;
    const target = step === 'idle' ? bookRef.current : headingRef.current;

    if (target) {
      target.focus();
    }
  }, [step]);

  const go = (next) => {
    moved.current = true;
    setStep(next);
  };

  const start = () => {
    setProblem(null);
    go('confirm');
  };

  const confirm = async () => {
    if (step === 'working') {
      return;
    }

    setStep('working');

    try {
      const data = await api.createBooking(gig.id);
      setResult(data);
      go('done');
    } catch (error) {
      setProblem(bookingProblem(error));
      go('idle');
    }
  };

  if (step === 'done' && result && result.transaction) {
    const { transaction } = result;

    return (
      <Card role="region" aria-labelledby="booking-done-title" className="gap-0 py-0">
        <div className="flex items-center gap-2.5 border-b-2 border-primary bg-success-tint px-5.5 py-4">
          <CircleCheck aria-hidden="true" className="size-6 flex-none text-success" />
          <h2 id="booking-done-title" ref={headingRef} tabIndex={-1} className="text-[22px] font-extrabold">
            Booking confirmed
          </h2>
        </div>
        <div className="flex flex-col gap-4 px-5.5 py-5 max-sm:px-4.5">
          <ReferenceTicket reference={transaction.reference} />
          <Facts
            rows={[
              ['Amount', formatCents(transaction.amountCents)],
              [
                'Status',
                <Badge key="status" variant="success">
                  Completed
                </Badge>
              ],
              ['Freelancer', freelancerName(gig)],
              ['Date', formatDate(transaction.createdAt)]
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/bookings" className={buttonVariants()}>
              View my bookings
            </Link>
            <Link to="/gigs" className={buttonVariants({ variant: 'ghost' })}>
              Browse more gigs
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  if (step === 'confirm' || step === 'working') {
    const working = step === 'working';

    return (
      <Card className={PANEL}>
        <h2 ref={headingRef} tabIndex={-1} className="text-[22px] font-extrabold">
          Confirm your booking
        </h2>
        <Facts
          rows={[
            ['Gig', gig.title],
            ['Freelancer', freelancerName(gig)],
            ['Amount', formatCents(gig.priceCents)]
          ]}
        />
        <PaymentNote />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={confirm} disabled={working} focusableWhenDisabled>
            {working && <Spinner aria-hidden="true" role={undefined} />}
            {working ? 'Booking…' : 'Confirm booking'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => go('idle')} disabled={working}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={PANEL}>
      <p className={EYEBROW}>Fixed price</p>
      <Money cents={gig.priceCents} size="lg" className="self-start" />
      {problem && <ErrorBanner message={problem} />}
      <Button type="button" ref={bookRef} onClick={start} className="w-full">
        Book this gig
      </Button>
      <PaymentNote />
    </Card>
  );
};

//-----------------------------------------------------\\
//                 OWNER AND OTHER VIEWERS
//-----------------------------------------------------\\

//a freelancer looking at their own listing sees it as clients do, with a way
//to edit it from my gigs
const OwnerPanel = ({ gig }) => (
  <Card className={PANEL}>
    <p className={EYEBROW}>Your gig</p>
    <Money cents={gig.priceCents} size="lg" className="self-start" />
    <p className="text-muted-foreground">This is how clients see your listing.</p>
    <Link to="/my-gigs" state={{ edit: gig.id }} className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
      Edit gig
    </Link>
  </Card>
);

//other freelancers and admins can look but not book, an admin can also take
//a listing down, which only hides it, past bookings stay on record
//focus follows the question as it opens and closes, and lands on the new
//status once the listing is down, so a keyboard user is never dropped
const ViewerPanel = ({ gig, isAdmin, onChange }) => {
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState(null);
  const questionRef = useRef(null);
  const openRef = useRef(null);
  const statusRef = useRef(null);
  const focusNext = useRef(null);

  useEffect(() => {
    const target = { question: questionRef, open: openRef, status: statusRef }[focusNext.current];
    focusNext.current = null;

    if (target && target.current) {
      target.current.focus();
    }
  }, [confirming, gig.isActive]);

  const ask = (open) => {
    focusNext.current = open ? 'question' : 'open';
    setConfirming(open);
  };

  const deactivate = async () => {
    setWorking(true);
    setProblem(null);

    try {
      const data = await api.deleteGig(gig.id);
      focusNext.current = 'status';
      setConfirming(false);
      onChange(data && data.gig ? data.gig : { ...gig, isActive: false });
    } catch (error) {
      setProblem(messageFor(error));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card className={PANEL}>
      <p className={EYEBROW}>Fixed price</p>
      <Money cents={gig.priceCents} size="lg" className="self-start" />
      <Alert role="note">
        <Info aria-hidden="true" className="size-5" />
        <AlertDescription className="text-[15px]">Only clients can book gigs.</AlertDescription>
      </Alert>

      {isAdmin && problem && <ErrorBanner message={problem} />}

      {isAdmin && !gig.isActive && (
        <Badge ref={statusRef} tabIndex={-1} variant="off" className="self-start">
          Inactive listing
        </Badge>
      )}

      {isAdmin && gig.isActive && !confirming && (
        <Button type="button" ref={openRef} variant="destructive" className="w-full" onClick={() => ask(true)}>
          Deactivate listing
        </Button>
      )}

      {isAdmin && gig.isActive && confirming && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-destructive bg-danger-tint p-3.5">
          <p ref={questionRef} tabIndex={-1}>
            Deactivate this listing? Clients will no longer see it. Past bookings stay on record.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="danger" size="sm" onClick={deactivate} disabled={working} focusableWhenDisabled>
              {working && <Spinner aria-hidden="true" role={undefined} />}
              {working ? 'Deactivating…' : 'Deactivate'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => ask(false)} disabled={working}>
              Keep listing
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

//-----------------------------------------------------\\
//                     BOOKING PANEL
//-----------------------------------------------------\\

//which panel a person sees depends on their role, the book button exists for
//clients only, and the api refuses a booking from anyone else regardless
const BookingPanel = ({ gig, onChange }) => {
  const { user } = useAuth();
  const ownerId = gig.freelancer && gig.freelancer.id;

  if (user && user.role === 'client') {
    return <ClientBooking gig={gig} />;
  }

  if (user && user.role === 'freelancer' && ownerId === user.id) {
    return <OwnerPanel gig={gig} />;
  }

  return <ViewerPanel gig={gig} isAdmin={Boolean(user && user.role === 'admin')} onChange={onChange} />;
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default BookingPanel;
