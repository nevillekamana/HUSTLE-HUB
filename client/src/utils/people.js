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

//the api populates a gig's freelancer as { id, fullName }, a bare id or a
//missing record still reads as something sensible
const freelancerName = (gig) =>
  gig && gig.freelancer && typeof gig.freelancer.fullName === 'string' ? gig.freelancer.fullName : 'Freelancer';

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { freelancerName, initials };
