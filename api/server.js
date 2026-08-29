//-----------------------------------------------------\\
//              HUSTLEHUB PLUS - ROLE 2
//              SECURITY SPECIALIST
//
//              Student Number: ST10257779
//-----------------------------------------------------\\


//-----------------------------------------------------\\
//                      IMPORTS
//-----------------------------------------------------\\

const https = require('https');
const fs = require('fs');
const path = require('path');

const app = require('./app');
const env = require('./config/env');


//-----------------------------------------------------\\
//                 SSL CERTIFICATE SETUP
//-----------------------------------------------------\\

// Path to the local self-signed SSL certificate.
// The certificate folder is ignored by Git so the
// private certificate data is never pushed publicly.
const certificatePath = path.join(
  __dirname,
  'certs',
  'localhost.pfx'
);

// Read the local PFX certificate from disk.
const certificate = fs.readFileSync(certificatePath);


//-----------------------------------------------------\\
//                    HTTPS OPTIONS
//-----------------------------------------------------\\

const httpsOptions = {

  // Local SSL certificate containing the public
  // certificate and private key.
  pfx: certificate,

  // Certificate password is loaded from the .env file
  // rather than being hard-coded into source control.
  passphrase: env.sslPfxPassword
};


//-----------------------------------------------------\\
//                   HTTPS SERVER
//-----------------------------------------------------\\

const server = https.createServer(
  httpsOptions,
  app
);


//-----------------------------------------------------\\
//                   SERVER BOOTSTRAP
//-----------------------------------------------------\\

// Start HustleHub Plus over HTTPS.
//
// Example:
// https://localhost:5000/api/health
server.listen(env.port, () => {
  console.log(
    'hustlehub+ secure api listening at https://localhost:' +
    env.port
  );
});