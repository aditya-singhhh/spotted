// One-off seed script — adds three sample verified listings so Discover
// isn't empty while you're testing.
//
// Usage:
//   1. Add FIREBASE_SERVICE_ACCOUNT_KEY as a one-line JSON value in .env.local
//   2. node scripts/seed.js

const admin = require('firebase-admin');
const { initializeFirestore } = require('firebase-admin/firestore');
const { JWT } = require('google-auth-library');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Node does not load Next.js' .env.local automatically. Read only the one
// value this script needs; the file remains gitignored.
const envPath = path.join(__dirname, '..', '.env.local');
const envLines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
const serviceAccountLine = envLines.find((line) => line.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
const localKeyPath = path.join(__dirname, 'serviceAccountKey.json');
const rawServiceAccount = fs.existsSync(localKeyPath)
  ? fs.readFileSync(localKeyPath, 'utf8')
  : process.env.FIREBASE_SERVICE_ACCOUNT_KEY || serviceAccountLine?.slice('FIREBASE_SERVICE_ACCOUNT_KEY='.length);
if (!rawServiceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing from .env.local');
const serviceAccount = JSON.parse(rawServiceAccount);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = initializeFirestore(admin.app(), {
  preferRest: true,
  customHeaders: { 'Accept-Encoding': 'identity' }
});

async function seed() {
  const now = new Date().toISOString();
  const demoScoutId = 'starter-scout-bengaluru';

  const listings = [
    {
      id: 'starter-hsr-bda-complex',
      property: { lat: 12.9121, lng: 77.6446, landmark: 'HSR BDA Complex' },
      ro: { bhk: 2, rent: 24000, deposit: 120000, furnishing: 'semi furnished', bachelorAllowed: 'yes' },
      contact: { ownerName: 'Ramesh Gowda', ownerPhone: '+919845000000' }
    },
    {
      id: 'starter-btm-2nd-stage',
      property: { lat: 12.9166, lng: 77.6101, landmark: 'BTM 2nd Stage' },
      ro: { bhk: 1, rent: 17000, deposit: 60000, furnishing: 'fully furnished', bachelorAllowed: 'yes' },
      contact: { ownerName: 'Lakshmi N.', ownerPhone: '+919900100000' }
    },
    {
      id: 'starter-koramangala-5th-block',
      property: { lat: 12.9352, lng: 77.6245, landmark: 'Koramangala 5th Block' },
      ro: { bhk: 2, rent: 32000, deposit: 128000, furnishing: 'semi furnished', bachelorAllowed: 'yes' },
      contact: { ownerName: 'Naveen Kumar', ownerPhone: '+919886144320' }
    }
  ];

  const documents = [
    ['users', demoScoutId, { fullName: 'Bengaluru Scout Team', role: 'scout', email: null, phone: null, createdAt: now }],
    ['scouts', demoScoutId, { trustScore: 88, totalEarned: 0, availableEarnings: 0, pendingEarnings: 0, createdAt: now }]
  ];
  for (const item of listings) {
    documents.push(['properties', item.id, {
      lat: item.property.lat,
      lng: item.property.lng,
      landmark: item.property.landmark,
      addressExact: item.property.landmark,
      createdAt: now
    }]);

    const round = (n) => Math.round(n * 1000) / 1000;

    documents.push(['rentalOpportunities', item.id, {
      propertyId: item.id,
      scoutId: demoScoutId,
      bhk: item.ro.bhk,
      rent: item.ro.rent,
      deposit: item.ro.deposit,
      furnishing: item.ro.furnishing,
      bachelorAllowed: item.ro.bachelorAllowed,
      landmark: item.property.landmark,
      approxLat: round(item.property.lat),
      approxLng: round(item.property.lng),
      status: 'verified',
      trustScore: 90,
      spottedAt: now,
      lastVerifiedAt: now,
      createdAt: now
    }]);

    documents.push(['rentalOpportunities/' + item.id + '/private', 'contact', {
      ownerName: item.contact.ownerName,
      ownerPhone: item.contact.ownerPhone,
      exactLat: item.property.lat,
      exactLng: item.property.lng,
      addressExact: item.property.landmark,
      notes: null
    }]);

    console.log('Prepared', item.property.landmark, '→', item.id);
  }

  await commitWithNativeRest(documents);

  console.log('Done. Three Firestore listings are ready.');
  process.exit(0);
}

function toFields(value) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (item === null) return [key, { nullValue: null }];
    if (typeof item === 'string') return [key, { stringValue: item }];
    if (typeof item === 'number') return [key, Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item }];
    if (typeof item === 'boolean') return [key, { booleanValue: item }];
    throw new Error(`Unsupported seed field: ${key}`);
  }));
}

async function commitWithNativeRest(documents) {
  const auth = new JWT({ email: serviceAccount.client_email, key: serviceAccount.private_key, scopes: ['https://www.googleapis.com/auth/datastore'] });
  const token = (await auth.getAccessToken()).token;
  const project = serviceAccount.project_id;
  const payload = JSON.stringify({ writes: documents.map(([collection, id, data]) => ({ update: { name: `projects/${project}/databases/(default)/documents/${collection}/${id}`, fields: toFields(data) } })) });
  await new Promise((resolve, reject) => {
    const req = https.request({ hostname: 'firestore.googleapis.com', path: `/v1/projects/${project}/databases/(default)/documents:commit`, method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'Accept-Encoding': 'identity' } }, (res) => {
      let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk); res.on('end', () => res.statusCode && res.statusCode < 300 ? resolve() : reject(new Error(`Firestore commit failed (${res.statusCode}): ${body}`)));
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
