# Firebase setup — US vs Them

Everything here is **free** (Firebase "Spark" plan). This gets you login +
cloud sync so you and your wife each have your own account, and your data
follows you across your phone, iPad, etc. ~15 minutes.

If you skip all of this, the app still works in **local mode** (no login,
data saved on the device only). Firebase just adds accounts + sync.

---

## 1. Create the project

1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Add project**.
3. Name it something like `us-vs-them` → **Continue**.
4. Google Analytics: **turn it off** (not needed) → **Create project**.
5. Wait for it to finish, then **Continue**.

## 2. Register the web app (this gives you the 6 keys)

1. On the project home, click the **web icon** `</>` ("Add app").
2. App nickname: `Us vs Them` → **Register app**.
   (Leave "Firebase Hosting" unchecked for now — we do hosting in step 6.)
3. It shows a `firebaseConfig = { … }` block. **Copy those 6 values** — you'll
   paste them into your `.env` in step 5. They map like this:

   | firebaseConfig key   | your .env variable              |
   |----------------------|---------------------------------|
   | `apiKey`             | `VITE_FB_API_KEY`               |
   | `authDomain`         | `VITE_FB_AUTH_DOMAIN`           |
   | `projectId`          | `VITE_FB_PROJECT_ID`            |
   | `storageBucket`      | `VITE_FB_STORAGE_BUCKET`        |
   | `messagingSenderId`  | `VITE_FB_MESSAGING_SENDER_ID`   |
   | `appId`              | `VITE_FB_APP_ID`                |

   (These keys are safe to ship in a web app — access is controlled by the
   security rules in step 4, not by hiding the keys.)

## 3. Turn on sign-in methods

1. Left menu → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → enable these:
   - **Email/Password** → toggle **Enable** → **Save**. *(free)*
   - **Google** → **Enable**, pick a support email → **Save**. *(free)*
   - **Apple** → *optional, skip for now.* Apple sign-in needs a paid Apple
     Developer account ($99/yr). The app just won't use that button until you
     enable it. Google + Email is all you need to launch.

## 4. Create the database + lock it down

1. Left menu → **Build → Firestore Database** → **Create database**.
2. Choose a location close to you (e.g. `us-west` for California) → **Next**.
3. Start in **production mode** → **Enable**.
4. Open the **Rules** tab and replace everything with the rules already in this
   repo (`firestore.rules`) — each person can only read/write their own data:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. Click **Publish**.

## 5. Put the keys in the app

1. In the project folder, copy the example file:
   ```
   cp .env.example .env
   ```
2. Open `.env` and paste your 6 values from step 2. Example:
   ```
   VITE_FB_API_KEY=AIzaSy...your-key
   VITE_FB_AUTH_DOMAIN=us-vs-them.firebaseapp.com
   VITE_FB_PROJECT_ID=us-vs-them
   VITE_FB_STORAGE_BUCKET=us-vs-them.appspot.com
   VITE_FB_MESSAGING_SENDER_ID=1234567890
   VITE_FB_APP_ID=1:1234567890:web:abcdef123456
   ```
3. (Optional, better food search) add your free USDA key:
   ```
   VITE_USDA_KEY=your-usda-key      # https://fdc.nal.usda.gov/api-key-signup.html
   ```
4. (Optional, Spotify now-playing) add your Spotify Client ID — see
   `SPOTIFY_SETUP` notes in `.env.example`.

Test locally:
```
npm install
npm run dev
```
Open the local URL — you should now see the login screen with Google + Email.

## 6. Deploy it (free hosting on Firebase)

1. One-time install of the CLI:
   ```
   npm install -g firebase-tools
   firebase login
   ```
2. In the project folder:
   ```
   firebase init hosting
   ```
   - "Use an existing project" → pick `us-vs-them`.
   - Public directory: **`dist`**
   - Single-page app (rewrite all to /index.html): **Yes**
   - Set up automatic builds with GitHub: **No** (for now)
   - Overwrite `dist/index.html`: **No**
3. Build and deploy:
   ```
   npm run build
   firebase deploy --only hosting
   ```
4. It prints your live URL, e.g. `https://us-vs-them.web.app`. That's your app —
   add it to your iPhone home screen (Share → **Add to Home Screen**) and it runs
   like a real app.

## 7. Allow your live domain to log in

1. Back in **Authentication → Settings → Authorized domains**.
2. Confirm your hosting domains are listed (Firebase usually adds
   `us-vs-them.web.app` and `.firebaseapp.com` automatically). If you use a
   custom domain later, add it here too, or Google/email login will be blocked.

## 8. Make the two accounts

- Open the live app, **Continue with Google** (or sign up with email) — that's
  your account.
- Have your wife open it on **her** phone and sign in with **her own** Google or
  email — she gets a separate account with her own plan, meals, and weight.
- Each account is fully isolated by the security rules from step 4.

---

### Quick reference — what needs which account

| Feature                     | Cost | Needs                                             |
|-----------------------------|------|---------------------------------------------------|
| Login + cloud sync          | Free | Firebase (this doc)                               |
| Free hosting                | Free | Firebase Hosting (step 6)                         |
| Accurate food search        | Free | USDA API key (optional)                           |
| Spotify now-playing         | Free | Spotify Client ID (optional)                      |
| Apple sign-in button        | Paid | Apple Developer account ($99/yr) — optional       |

Everything required to launch is free. Apple sign-in is the only paid extra,
and it's optional — Google + Email covers you both.
