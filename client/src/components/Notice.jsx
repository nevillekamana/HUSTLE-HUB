//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

//-----------------------------------------------------\\
//                     PAGE NOTICE
//-----------------------------------------------------\\

const TONES = {
  info: { variant: 'default', Icon: Info },
  success: { variant: 'success', Icon: CircleCheck },
  error: { variant: 'destructive', Icon: CircleAlert }
};

//says what the last action on a page did, such as a gig saved or deleted
//the status box stays on the page even when empty, so a screen reader
//announces each new message without focus having to move to it
//notice is { tone, text } with plain text only, never an error object
const Notice = ({ notice }) => {
  const tone = notice && TONES[notice.tone] ? TONES[notice.tone] : TONES.info;
  const { Icon } = tone;

  return (
    <div role="status">
      {notice && (
        <Alert variant={tone.variant} role={undefined} className="mb-5">
          <Icon aria-hidden="true" className="size-5" />
          <AlertDescription className="text-[15px]">{notice.text}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default Notice;
