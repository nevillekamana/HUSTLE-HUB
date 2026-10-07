//-----------------------------------------------------\\
//                   BOOKED GIG DETAILS
//-----------------------------------------------------\\

//bookings and payments carry their gig populated as { id, title, category },
//a bare id still gives a link and a missing one reads as a plain title
//a booking's own title snapshot wins, it shows the gig as it was when booked
const bookedGig = (record) => {
  const gig = record && record.gig;
  const populated = Boolean(gig) && typeof gig === 'object';
  const id = populated ? gig.id : gig;

  let title = 'Gig';

  if (record && typeof record.gigTitle === 'string' && record.gigTitle.trim() !== '') {
    title = record.gigTitle;
  } else if (populated && typeof gig.title === 'string' && gig.title.trim() !== '') {
    title = gig.title;
  }

  return {
    id: typeof id === 'string' && id !== '' ? id : null,
    title,
    category: populated ? gig.category : undefined
  };
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { bookedGig };
