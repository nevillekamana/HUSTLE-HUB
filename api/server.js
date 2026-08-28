//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const app = require('./app');

//-----------------------------------------------------\\
//                     CONFIGURATION
//-----------------------------------------------------\\

//falls back to 5000 so a fresh clone boots without a .env file present,
//commit 8 moves this behind the environment configuration loader
const PORT = process.env.PORT || 5000;

//-----------------------------------------------------\\
//                   SERVER BOOTSTRAP
//-----------------------------------------------------\\

//binding the listener here keeps app.js free of process level concerns and
//lets role 2 wrap the same app in an https server without touching it
app.listen(PORT, () => {
  console.log('hustlehub+ api listening on port ' + PORT);
});
