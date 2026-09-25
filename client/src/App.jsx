//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { Logo } from '@/components/Logo';
import { BrandPrint, PrintDefs } from '@/components/Prints';

//-----------------------------------------------------\\
//                     APP COMPONENT
//-----------------------------------------------------\\

//placeholder until the router and app shell arrive, it already carries the
//print definitions and the header band so the brand can be checked in place
const App = () => (
  <>
    <PrintDefs />
    <header className="bg-primary">
      <div className="mx-auto flex min-h-17 max-w-300 items-center px-6">
        <Logo onDark />
      </div>
    </header>
    <BrandPrint />
    <main className="mx-auto flex max-w-300 flex-col gap-3 px-6 py-8">
      <h1 className="text-5xl font-extrabold">
        Local talent, <span className="sticker">fixed</span> prices.
      </h1>
    </main>
  </>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default App;
