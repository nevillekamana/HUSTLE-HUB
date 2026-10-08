//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const fs = require('fs');
const http = require('http');
const https = require('https');

const app = require('./app');
const env = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/db');

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

//the database is connected before the port is bound, so the api never
//accepts a request it cannot actually serve
const start = async () => {
  try {
    await connectDatabase();
  } catch (error) {
    //the reason is already logged by connectDatabase without the connection
    //string, nothing more to add here, the process just cannot continue
    process.exit(1);
  }

  //binding the listener here keeps app.js free of process level concerns and
  //lets the same app be served over either transport without being rebuilt
  server.listen(env.port, () => {
    const scheme = secureServer ? 'https' : 'http';

    console.log('hustlehub+ api listening at ' + scheme + '://localhost:' + env.port);
  });
};

start();

//-----------------------------------------------------\\
//                  GRACEFUL SHUTDOWN
//-----------------------------------------------------\\

//a container or a dev server restart sends one of these, closing the
//listener first means no new request is accepted while the database
//connection underneath existing ones is torn down
const shutdown = (signal) => {
  console.log('[server] received ' + signal + ', shutting down');

  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
