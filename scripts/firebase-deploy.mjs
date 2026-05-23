import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadFirebaseProjectId } from './firebase-project.mjs';

const only = process.argv[2];
if (!only) {
  console.error('Usage: node scripts/firebase-deploy.mjs <firebase --only target>');
  process.exit(1);
}

const project = loadFirebaseProjectId();
console.log(`Deploying to project: ${project}`);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const localFirebase = join(root, 'node_modules', '.bin', 'firebase');
const firebaseCmd = existsSync(localFirebase) ? localFirebase : 'firebase';
const firebaseArgs = existsSync(localFirebase)
  ? ['deploy', `--only=${only}`, `--project=${project}`]
  : [
      '--yes',
      '--package=firebase-tools@14.11.0',
      'firebase',
      'deploy',
      `--only=${only}`,
      `--project=${project}`,
    ];

const result = spawnSync(firebaseCmd, firebaseArgs, {
  stdio: 'inherit',
  cwd: root,
});

process.exit(result.status ?? 1);
