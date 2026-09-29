//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

//-----------------------------------------------------\\
//                     ERROR BANNER
//-----------------------------------------------------\\

//the one place a failed request is shown, it only ever receives the safe
//message an ApiError carries, never the error itself, so nothing raw can
//reach the screen
const ErrorBanner = ({ message, className }) => (
  <Alert variant="destructive" className={className}>
    <CircleAlert aria-hidden="true" className="size-5" />
    <AlertDescription className="text-[15px]">{message}</AlertDescription>
  </Alert>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default ErrorBanner;
