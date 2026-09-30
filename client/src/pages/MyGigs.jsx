//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { messageFor } from '@/api/client';
import * as api from '@/api/endpoints';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import GigForm from '@/components/GigForm';
import { MyGigList, MyGigRow, MyGigRowsSkeleton } from '@/components/MyGigRow';
import Notice from '@/components/Notice';
import { PageHeader, Sticker } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useRequest from '@/hooks/useRequest';

//-----------------------------------------------------\\
//                       MESSAGES
//-----------------------------------------------------\\

const quoted = (gig) => '“' + gig.title + '”';

const GONE = 'That gig no longer exists, so it was taken off your list.';

//the edit link on a gig's own page arrives with the gig's id in the route
//state, anything else there is ignored
const editRequest = (state) =>
  state && typeof state.edit === 'string' ? { mode: 'edit', id: state.edit } : null;

//the top of the list card, shown while loading too so the rows do not jump
//when they arrive, the heading takes focus when a row is removed
const ListHeader = ({ headingRef, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-2 border-tint px-4.5 py-3.5 max-sm:px-3.5">
    <h2 ref={headingRef} tabIndex={-1} className="text-[19px] font-bold">
      Your listings
    </h2>
    {children}
  </div>
);

//-----------------------------------------------------\\
//                       MY GIGS
//-----------------------------------------------------\\

//a freelancer's own gigs, paused ones included, with the form for a new gig
//or an edit above the list
//changes made here are applied to the loaded list rather than fetching it
//again, so the rows stay put and focus is not lost
//focus goes back to whatever opened the form when it closes, and to the
//list heading when a row disappears
const MyGigs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, slow, data, error, retry } = useRequest(api.getMyGigs);
  const [edits, setEdits] = useState({ source: null, gigs: [] });
  const [form, setForm] = useState(() => editRequest(location.state));
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(null);
  const [problem, setProblem] = useState(null);
  const [notice, setNotice] = useState(null);
  const newRef = useRef(null);
  const listRef = useRef(null);
  const listHeadingRef = useRef(null);
  const focusNext = useRef(null);

  const loaded = (data && Array.isArray(data.gigs) && data.gigs) || [];
  const gigs = edits.source === data ? edits.gigs : loaded;
  const editing = form && form.mode === 'edit' ? gigs.find((gig) => gig.id === form.id) : null;
  const formOpen = Boolean(form && (form.mode === 'new' || editing));
  const editPending = Boolean(form && form.mode === 'edit' && state === 'loading');

  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;

    if (!target) {
      return;
    }

    let element = null;

    if (target === 'new') {
      element = newRef.current;
    } else if (target === 'list') {
      element = listHeadingRef.current || document.querySelector('main h1');
    } else if (listRef.current) {
      element = listRef.current.querySelector('[data-edit="' + CSS.escape(target) + '"]');
    }

    if (element) {
      element.focus();
    }
  }, [form, gigs]);

  const updateGigs = (change) =>
    setEdits((current) => ({ source: data, gigs: change(current.source === data ? current.gigs : loaded) }));

  const replaceGig = (next) => updateGigs((list) => list.map((gig) => (gig.id === next.id ? next : gig)));

  const clearMessages = () => {
    setNotice(null);
    setProblem(null);
  };

  const openForm = (next) => {
    clearMessages();
    setConfirmId(null);
    setForm(next);
  };

  //the edit request is taken out of the route state once used, so going
  //back to this page later does not open the form again
  const closeForm = (focusTarget) => {
    focusNext.current = focusTarget;
    setForm(null);

    if (editRequest(location.state)) {
      navigate(location.pathname, { replace: true, state: null });
    }
  };

  //a gig leaving the list takes its open form with it
  const dropGig = (id) => {
    updateGigs((list) => list.filter((gig) => gig.id !== id));
    setConfirmId(null);

    if (form && form.id === id) {
      closeForm('list');
    }

    focusNext.current = 'list';
  };

  const saved = (gig, changed) => {
    const creating = form.mode === 'new';

    if (!gig) {
      setNotice({ tone: 'success', text: 'Gig saved.' });
      closeForm(creating ? 'new' : form.id);
      retry();
      return;
    }

    if (creating) {
      updateGigs((list) => [gig, ...list]);
      setNotice({ tone: 'success', text: 'Gig published. ' + quoted(gig) + ' is now in Browse.' });
    } else if (changed) {
      replaceGig(gig);
      setNotice({ tone: 'success', text: 'Changes to ' + quoted(gig) + ' saved.' });
    } else {
      setNotice({ tone: 'info', text: 'Nothing changed, so there was nothing to save.' });
    }

    closeForm(creating ? 'new' : gig.id);
  };

  const missing = (gig) => {
    dropGig(gig.id);
    setNotice({ tone: 'error', text: GONE });
  };

  //a gig that vanished in the meantime comes off the list, anything else is
  //explained on the row it happened to
  const failed = (gig, failure) => {
    if (failure && failure.status === 404) {
      dropGig(gig.id);
      setNotice({ tone: 'error', text: GONE });
      return;
    }

    setProblem({ id: gig.id, text: messageFor(failure) });
  };

  //pausing hides a gig from clients without deleting it, resuming shows it
  //again, both are an update of isActive
  const toggle = async (gig) => {
    if (busy) {
      return;
    }

    clearMessages();
    setConfirmId(null);
    setBusy({ id: gig.id, action: 'toggle' });

    try {
      const result = await api.updateGig(gig.id, { isActive: !gig.isActive });
      const next = result && result.gig ? result.gig : { ...gig, isActive: !gig.isActive };
      replaceGig(next);
      setNotice({
        tone: 'success',
        text: next.isActive
          ? quoted(next) + ' is live in Browse again.'
          : quoted(next) + ' is paused. Clients can’t see or book it until you resume it.'
      });
    } catch (failure) {
      failed(gig, failure);
    } finally {
      setBusy(null);
    }
  };

  const askDelete = (id) => {
    clearMessages();
    setConfirmId(id);
  };

  //a soft delete on the api, the gig leaves browse and this list but its
  //bookings and payments keep pointing at it
  const remove = async (gig) => {
    if (busy) {
      return;
    }

    setProblem(null);
    setBusy({ id: gig.id, action: 'delete' });

    try {
      await api.deleteGig(gig.id);
      dropGig(gig.id);
      setNotice({
        tone: 'success',
        text: quoted(gig) + ' deleted. Bookings and payments already made stay on record.'
      });
    } catch (failure) {
      failed(gig, failure);
    } finally {
      setBusy(null);
    }
  };

  let body;

  //the ghost rows only appear for a real wait, a quick answer shows no loading
  if (state === 'loading') {
    body = slow && (
      <Card className="gap-0 py-0">
        <p role="status" className="sr-only">
          Loading your gigs
        </p>
        <ListHeader>
          <Skeleton aria-hidden="true" className="h-4 w-28" />
        </ListHeader>
        <MyGigRowsSkeleton />
      </Card>
    );
  } else if (state === 'error') {
    body = <ErrorBanner message={error} onRetry={retry} />;
  } else if (gigs.length === 0) {
    body = (
      <EmptyState
        mark="+"
        title="You have no gigs yet"
        text="Create your first gig with New gig, then clients can find and book you."
      />
    );
  } else {
    const active = gigs.filter((gig) => gig.isActive).length;
    const paused = gigs.length - active;

    body = (
      <Card className="gap-0 py-0">
        <ListHeader headingRef={listHeadingRef}>
          <p className="text-sm text-muted-foreground">
            {active + ' active' + (paused > 0 ? ', ' + paused + ' paused' : '')}
          </p>
        </ListHeader>
        <MyGigList ref={listRef}>
          {gigs.map((gig) => (
            <MyGigRow
              key={gig.id}
              gig={gig}
              busy={busy && busy.id === gig.id ? busy.action : null}
              problem={problem && problem.id === gig.id ? problem.text : null}
              confirming={confirmId === gig.id}
              onEdit={(chosen) => openForm({ mode: 'edit', id: chosen.id })}
              onToggle={toggle}
              onAskDelete={askDelete}
              onDelete={remove}
            />
          ))}
        </MyGigList>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={
          <>
            My <Sticker>gigs</Sticker>
          </>
        }
        pageTitle="My gigs"
        lede="Create, edit and pause your listings. Past bookings stay on record whatever you change."
      >
        {!formOpen && !editPending && (
          <Button type="button" ref={newRef} onClick={() => openForm({ mode: 'new' })}>
            <Plus aria-hidden="true" />
            New gig
          </Button>
        )}
      </PageHeader>

      <Notice notice={notice} />

      {formOpen && (
        <GigForm
          key={editing ? editing.id : 'new'}
          gig={editing}
          onSaved={saved}
          onCancel={() => closeForm(editing ? editing.id : 'new')}
          onMissing={missing}
        />
      )}

      {body}
    </>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default MyGigs;
