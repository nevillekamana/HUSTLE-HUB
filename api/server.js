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

//https is used whenever the certificate bundle is readable, the bundle holds a
//private key so it is never committed, which means a fresh clone has no file
//here and would otherwise fail to start
//falling back to http keeps a clone runnable while making the downgrade loud,
//role 2 supplies the certificate for the https demonstration
const readCertificate = () => {
  try {
    return fs.readFileSync(env.sslPfxPath);
  } catch (error) {
    return null;
  }
};

const certificate = readCertificate();

const server = certificate
  ? https.createServer({ pfx: certificate, passphrase: env.sslPfxPassword }, app)
  : http.createServer(app);

//-----------------------------------------------------\\
//                   SERVER BOOTSTRAP
//-----------------------------------------------------\\

//binding the listener here keeps app.js free of process level concerns and
//lets the same app be served over either transport without being rebuilt
if (!certificate) {
  console.warn('[server] no certificate found, starting over http instead of https');
}

server.listen(env.port, () => {
  const scheme = certificate ? 'https' : 'http';

  console.log('hustlehub+ api listening at ' + scheme + '://localhost:' + env.port);
});
