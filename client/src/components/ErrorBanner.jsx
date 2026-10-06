//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { CircleAlert, RotateCw } from 'lucide-react';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

//-----------------------------------------------------\\
//                     ERROR BANNER
//-----------------------------------------------------\\

//the one place a failed request is shown, it only ever receives the safe
//message an ApiError carries, never the error itself, so nothing raw can
//reach the screen
//when the page can ask again a try again button sits under the message,
//placed in the flow rather than pinned to the corner so a long sentence
//never runs underneath it
const ErrorBanner = ({ message, onRetry, className }) => (
  <Alert variant="destructive" className={cn('has-data-[slot=alert-action]:pr-4', className)}>
    <CircleAlert aria-hidden="true" className="size-5" />
    <AlertDescription className="text-[15px]">{message}</AlertDescription>
    {onRetry && (
      <AlertAction className="static col-start-2 mt-2.5">
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      </AlertAction>
    )}
  </Alert>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default ErrorBanner;
