//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Link } from 'react-router-dom';
import { HOME } from '@/auth/ProtectedRoute';
import { useAuth } from '@/auth/useAuth';
import { PrintEmblem } from '@/components/EmptyState';
import { Sticker } from '@/components/PageHeader';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription } from '@/components/ui/empty';

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
        <PrintEmblem />
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
