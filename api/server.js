//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const fs = require('fs');
const http = require('http');
const https = require('https');

const app = require('./app');
const env = require('./config/env');

//-----------------------------------------------------\\
//                       TRANSPORT
//-----------------------------------------------------\\

//https is used whenever the certificate bundle can be read and opened, the
//bundle holds a private key so it is never committed, which means a fresh clone
//has no file here and would otherwise fail to start
//reading the file and opening it are attempted together because they fail at
//different moments, a missing file throws on the read while a wrong passphrase
//throws later inside the constructor, and only one of those was caught before
//falling back to http keeps a clone runnable while making the downgrade loud,
//role 2 supplies the certificate for the https demonstration
const createSecureServer = () => {
  try {
    return https.createServer(
      { pfx: fs.readFileSync(env.sslPfxPath), passphrase: env.sslPfxPassword },
      app
    );
  } catch (error) {
    //the short reason is named so the cause is obvious without a stack trace,
    //a code or a library message rather than the path it was looking in
    console.warn(
      '[server] certificate unavailable (' +
        (error.code || error.message) +
        '), starting over http instead of https'
    );

    return null;
  }
};

const secureServer = createSecureServer();
const server = secureServer || http.createServer(app);

//-----------------------------------------------------\\
//                   SERVER BOOTSTRAP
//-----------------------------------------------------\\

//binding the listener here keeps app.js free of process level concerns and
//lets the same app be served over either transport without being rebuilt
server.listen(env.port, () => {
  const scheme = secureServer ? 'https' : 'http';

  console.log('hustlehub+ api listening at ' + scheme + '://localhost:' + env.port);
});
