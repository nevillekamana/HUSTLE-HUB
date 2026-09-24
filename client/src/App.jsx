//-----------------------------------------------------\\
//                     APP COMPONENT
//-----------------------------------------------------\\

//placeholder until the router and app shell arrive, it shows the theme so a
//broken token or font is obvious straight away
const App = () => (
  <main className="mx-auto flex max-w-3xl flex-col gap-3 p-6">
    <h1 className="text-5xl font-extrabold">
      HustleHub<span className="sticker">+</span>
    </h1>
    <p className="text-muted-foreground">Local talent, fixed prices.</p>
  </main>
);

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export default App;
