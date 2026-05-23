# מדריך טיולים (Trip Planner)

SPA לתכנון מסלולי טיול משותפים — React + Vite + Firebase (Auth + Firestore בלבד).

## Setup

1. Create a Firebase project and enable **Google Authentication** and **Cloud Firestore**.
2. Copy `.env.example` to `.env.local` and fill in your web app config from Firebase Console.
3. Install dependencies:

```bash
npm install
```

4. Deploy Firestore rules and indexes (required — without this you get "Missing or insufficient permissions"):

```bash
npx firebase-tools login
npm run firebase:deploy:rules
```

Deploy scripts read `VITE_FIREBASE_PROJECT_ID` from `.env.local` or `.env` and pass it to the CLI as `--project`. No `.firebaserc` file is required.

If the CLI is logged into a different Google account, either switch accounts or paste [`firestore.rules`](firestore.rules) into **Firebase Console → Firestore → Rules → Publish**.

5. Run locally:

```bash
npm run dev
```

## Deploy hosting

```bash
npm run build
npm run firebase:deploy:hosting
```

## Architecture

- Trip list: `users/{uid}/memberships`
- Trip data: `trips/{tripId}` with `members` and `invites` subcollections
- Sharing (invite, accept, remove, delete): **direct Firestore writes from the client** + [`firestore.rules`](firestore.rules)
- Invite flow: owner creates `invites` → guest signs in with same email → client accepts pending invites

Roles: **owner** | **editor** | **viewer**

No Cloud Functions or Blaze plan required.
