//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const app = require('./app');
const env = require('./config/env');

//-----------------------------------------------------\\
//                   SERVER BOOTSTRAP
//-----------------------------------------------------\\

//binding the listener here keeps app.js free of process level concerns and
//lets role 2 wrap the same app in an https server without touching it
app.listen(env.port, () => {
  console.log('hustlehub+ api listening on port ' + env.port);
});
