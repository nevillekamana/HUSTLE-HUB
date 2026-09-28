//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Link } from 'react-router-dom';
import { HOME } from '@/auth/ProtectedRoute';
import { useAuth } from '@/auth/useAuth';
import { Sticker } from '@/components/PageHeader';
import { BrandPrint } from '@/components/Prints';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia } from '@/components/ui/empty';

//-----------------------------------------------------\\
//                      NOT FOUND
//-----------------------------------------------------\\

//any address the app does not know, the way back depends on whether the
//person is signed in
const NotFound = () => {
  const { user } = useAuth();

  return (
    <Card className="py-0">
      <title>Page not found · HustleHub+</title>
      <Empty>
        <EmptyMedia className="relative size-19 overflow-hidden rounded-full border-2 border-primary shadow-[3px_3px_0_var(--primary)]">
          <BrandPrint className="absolute inset-0 h-full" />
          <span aria-hidden="true" className="relative font-heading text-[48px] leading-none font-extrabold text-white">
            ?
          </span>
        </EmptyMedia>
        <h1 tabIndex={-1} className="text-4xl leading-tight font-extrabold">
          We couldn’t find <Sticker>that page</Sticker>
        </h1>
        <EmptyDescription>The link may be old, or the page may have moved.</EmptyDescription>
        <Link to={user ? HOME : '/login'} className={buttonVariants()}>
          {user ? 'Back to gigs' : 'Go to sign in'}
        </Link>
      </Empty>
    </Card>
  );
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default NotFound;
