'use strict';
const {createHmac}=require('node:crypto');
// Google Calendar event IDs permit lowercase base32hex characters (a-v, 0-9).
// Derive a stable non-guessable ID from the database claim and a server-only secret.
function googleEventId({claimId,site='molfetta',secret=process.env.BOOKING_EVENT_ID_SECRET}){
 if(!Number.isSafeInteger(claimId)||claimId<1||site!=='molfetta')throw new TypeError('Invalid booking claim');
 if(typeof secret!=='string'||secret.length<32)throw new Error('BOOKING_EVENT_ID_SECRET must contain 32+ characters');
 const digest=createHmac('sha256',secret).update('punto-cittadino:v1:'+site+':'+claimId).digest('hex');
 // Hexadecimal is a permitted subset of Google's base32hex alphabet.
 return 'pc'+digest.slice(0,48);
}
module.exports={googleEventId};
