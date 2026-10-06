//------------------------------------------------\\
//               SECURITY HEADERS
//------------------------------------------------\\

const helmet = require('helmet');
const {
  CONTENT_SECURITY_POLICY,
  PERMISSIONS_POLICY,
  HSTS
} = require('../config/security');

//helmet sets the standard protective headers, the options below
//tighten its defaults for an api that only returns json
const helmetHeaders = helmet({
  //no defaults are merged in: the policy is exactly what is listed
  contentSecurityPolicy: {
    useDefaults: false,
    directives: CONTENT_SECURITY_POLICY
  },
  //the api may never be shown inside a frame (clickjacking)
  frameguard: { action: 'deny' },
  //the address of a page is never passed on to another site
  referrerPolicy: { policy: 'no-referrer' },
  //other sites may not embed api responses as images, scripts or media
  crossOriginResourcePolicy: { policy: 'same-site' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  hsts: HSTS
});

//two headers helmet does not set
const extraHeaders = (req, res, next) => {
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
  //responses can hold personal data, so nothing is kept by the
  //browser or by a proxy in between
  res.setHeader('Cache-Control', 'no-store');
  return next();
};

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = [helmetHeaders, extraHeaders];
