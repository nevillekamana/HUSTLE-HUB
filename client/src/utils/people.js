//-----------------------------------------------------\\
//                     NAMES ON SCREEN
//-----------------------------------------------------\\

//first and last initial, so a long name still fits the round badge
const initials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (parts[0][0] + last).toUpperCase();
};

//the api populates people as { id, fullName }, a bare id or a missing record
//still reads as something sensible
const personName = (person, fallback = 'Someone') =>
  person && typeof person.fullName === 'string' && person.fullName.trim() !== '' ? person.fullName : fallback;

const freelancerName = (gig) => personName(gig && gig.freelancer, 'Freelancer');

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { freelancerName, initials, personName };
