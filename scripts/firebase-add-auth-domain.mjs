import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadFirebaseProjectId } from './firebase-project.mjs';

const input = process.argv[2];
if (!input) {
  console.error(
    'Usage: node scripts/firebase-add-auth-domain.mjs <hostname-or-url>\n' +
      'Example: node scripts/firebase-add-auth-domain.mjs https://germany-trip-p4k7rbmtd-ori-assias-projects.vercel.app',
  );
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const project = loadFirebaseProjectId();
const url = input.startsWith('http') ? input : `https://${input}`;

const { requireAuth } = await import('firebase-tools/lib/requireAuth.js');
const { getProjectDefaultAccount } = await import('firebase-tools/lib/auth.js');
const { addAuthDomains } = await import('firebase-tools/lib/hosting/api.js');

const options = { project, cwd: root };
const account = getProjectDefaultAccount(root);
if (account) {
  options.user = account.user;
  options.tokens = account.tokens;
}

try {
  await requireAuth(options);
} catch {
  console.error(
    'Firebase CLI is not logged in.\n\n' +
      '  npx firebase-tools login\n\n' +
      'Then run this command again.',
  );
  process.exit(1);
}

const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

try {
  const updated = await addAuthDomains(project, [url]);
  if (updated.includes(domain)) {
    console.log(`Authorized domain added: ${domain}\n`);
    console.log('All authorized domains:');
    for (const d of updated) console.log(`  - ${d}`);
  }
} catch (err) {
  console.error(`Failed to add domain: ${err.message ?? err}`);
  console.error(
    `\nAdd it manually: Firebase Console → Authentication → Settings → Authorized domains\n` +
      `  https://console.firebase.google.com/project/${project}/authentication/settings`,
  );
  process.exit(1);
}
