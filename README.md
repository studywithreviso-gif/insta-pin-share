# Private verification-code relay

A small static website for sending a short verification code from one browser to another.

- Frontend hosting: GitHub Pages
- Temporary storage: Firebase Realtime Database
- Encryption: AES-256-GCM in the browser
- Password-derived key: PBKDF2-SHA-256, 250,000 iterations
- Shared password is never sent to Firebase
- Verification code expires after 5 minutes by default
- No Instagram password or login credentials are stored

## Files

- `setup.html` — generates a private random room link
- `send.html` — sender enters the code + shared password
- `index.html` — viewer enters the shared password and waits for the code
- `firebase-config.js` — put your Firebase Realtime Database URL here
- `database.rules.json` — security rules to paste into Firebase
- `crypto.js` — browser-side encryption/decryption
- `common.js` — Firebase REST helper functions
- `styles.css` — minimal styling

---

# Setup

## 1. Create a GitHub repository

Create a new repository, for example:

`private-code-relay`

Upload all files from this folder to the repository.

Do **not** add any Instagram password, Gmail password, Firebase service-account JSON, private API key, or other secret to the repository.

The Firebase Realtime Database URL and web API configuration are not server secrets. This project only needs the database URL.

---

## 2. Create a Firebase project

Go to Firebase Console and create a project.

Then:

1. Open **Build → Realtime Database**
2. Click **Create Database**
3. Choose a region
4. Create the database
5. Open the **Rules** tab
6. Replace the rules with the contents of `database.rules.json`
7. Publish the rules

Important: do not use permanent test-mode rules such as:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Use the supplied rules instead.

---

## 3. Copy the database URL

In Firebase Realtime Database, copy the database URL.

It will look similar to one of these:

```text
https://PROJECT-ID-default-rtdb.asia-southeast1.firebasedatabase.app
```

or:

```text
https://PROJECT-ID-default-rtdb.firebaseio.com
```

Open `firebase-config.js` and replace:

```js
databaseURL: "PASTE_YOUR_FIREBASE_REALTIME_DATABASE_URL_HERE"
```

with the exact URL.

Example:

```js
window.APP_CONFIG = {
  databaseURL: "https://my-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  ttlMinutes: 5,
  pollMs: 2000
};
```

Do not add `/rooms` or `.json` to the URL. The app does that itself.

---

## 4. Enable GitHub Pages

In the GitHub repository:

1. Open **Settings**
2. Open **Pages**
3. Under **Build and deployment**, choose **Deploy from a branch**
4. Choose branch `main`
5. Choose folder `/ (root)`
6. Save

After GitHub deploys it, your site will be something like:

```text
https://YOUR-USERNAME.github.io/private-code-relay/
```

---

# First use

Open:

```text
https://YOUR-USERNAME.github.io/private-code-relay/setup.html
```

Press **Generate new room**.

You will receive two links.

### Viewer link

Example:

```text
https://YOUR-USERNAME.github.io/private-code-relay/index.html#room=LONG_RANDOM_VALUE
```

This is the link the viewer opens in Incognito.

### Sender link

Example:

```text
https://YOUR-USERNAME.github.io/private-code-relay/send.html#room=LONG_RANDOM_VALUE
```

Keep this link for yourself.

The `room` value is stored after `#`, so GitHub Pages does not receive it as part of the HTTP request.

---

# Choose a shared password

Choose a strong shared password, preferably 4+ random words or at least 14-16 characters.

Example format:

```text
river-lamp-mango-planet-47
```

Do not use:

- Instagram password
- Gmail password
- phone PIN
- birthday
- a short common password

Both sender and viewer type this same password.

The password is used locally to derive the AES encryption key and is not uploaded.

---

# Normal workflow

## Viewer

1. Open the viewer URL in Incognito.
2. Enter the shared password.
3. Press **Unlock & wait for code**.
4. Leave that tab open.

The page checks Firebase every 2 seconds.

## Sender

1. Open the sender URL.
2. Enter the new verification code.
3. Enter the same shared password.
4. Press **Encrypt & send**.

The browser:

1. derives an encryption key from the password,
2. encrypts the verification code using AES-GCM,
3. uploads only ciphertext + salt + IV + timestamps to Firebase.

The viewer downloads the encrypted payload and decrypts it locally.

---

# Delete a code

On the sender page press:

**Delete current code**

This removes the current payload from Firebase.

The supplied Firebase rules also prevent clients from reading a code after its expiry timestamp.

Expired data may physically remain in Realtime Database until overwritten or deleted, but it is encrypted and the rules refuse reads after expiry.

---

# Security model

This is designed for convenience, not as a replacement for Instagram security.

### Protected

If Firebase data is viewed directly, the verification code is encrypted.

The shared password is never uploaded.

The room ID is long and randomly generated.

### Important limitation

Because GitHub Pages is static and this version intentionally does not require a backend login, anyone who somehow obtains the exact random room ID could overwrite the encrypted payload.

They still cannot decrypt a real code without the shared password, but they could cause nuisance by replacing/deleting data.

For a two-person private relay, a strong random room link plus encryption is a reasonable simple setup. If you need stronger authorization against writes, use a backend/Cloudflare Worker or Firebase Authentication.

---

# Testing before using a real code

Test with a fake code first.

1. Viewer opens their link.
2. Viewer enters the shared password.
3. Sender opens the sender link.
4. Sender enters:

```text
123456
```

5. Sender enters the same password.
6. Press **Encrypt & send**.
7. Within about 2 seconds the viewer should see `123456`.

Then press **Delete current code**.

---

# Troubleshooting

## "Firebase is not configured"

You did not update `firebase-config.js`, or GitHub Pages is serving an older version.

Check that `databaseURL` contains your exact Firebase Realtime Database URL.

## "Firebase write failed (401/403)"

Usually the database rules were not published or the URL points to a different Firebase project.

Paste `database.rules.json` into Realtime Database → Rules and publish it.

## Viewer always says "Waiting for a code"

Possible reasons:

- sender has not sent a code yet
- code expired
- sender and viewer links use different room IDs
- database URL is wrong

## "Wrong shared password"

The viewer password does not match the password used to encrypt that code.

Enter the password again and wait for the next code.

## GitHub Pages gives 404

Make sure Pages is enabled for the repository and the files are in the branch/folder selected for Pages.

---

# Recommended settings

Keep:

```js
ttlMinutes: 5
pollMs: 2000
```

Do not increase `ttlMinutes` above 10 unless you also intentionally change the Firebase rules.

For verification codes, shorter expiry is better.

---

# What this project does NOT do

It does not:

- log into Instagram
- read Gmail
- automatically intercept emails
- store Instagram passwords
- bypass Instagram's verification system
- disable Instagram's security checks

It only relays a code that the sender manually enters.
