import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/** Read VITE_FIREBASE_PROJECT_ID from .env.local or .env (same files Vite uses). */
export function loadFirebaseProjectId() {
  const root = process.cwd();
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf8');
    const match = content.match(/^VITE_FIREBASE_PROJECT_ID=(.+)$/m);
    if (match) {
      const id = match[1].trim().replace(/^["']|["']$/g, '');
      if (id) return id;
    }
  }
  throw new Error(
    'VITE_FIREBASE_PROJECT_ID not found. Add it to .env.local or .env (see .env.example).',
  );
}

if (process.argv[1]?.endsWith('firebase-project.mjs')) {
  console.log(loadFirebaseProjectId());
}
