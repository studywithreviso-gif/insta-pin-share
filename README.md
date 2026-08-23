# Insta PIN Share v2

Static GitHub Pages + Firebase Realtime Database code relay.

## v2 flow

### Receiver

1. Open receiver link at any time.
2. Enter the permanent shared password.
3. The room password is checked immediately, even if no verification code exists.
4. If correct, the page shows `Waiting for code...`.
5. Leave the tab open.
6. When the sender posts a code, it appears automatically.
7. If the sender deletes the code, the receiver goes back to waiting.

### Sender

1. Enter the Instagram verification code.
2. Enter the permanent shared password.
3. Press `Check password & send code`.
4. Wrong password => nothing is sent.
5. Correct password => code is encrypted locally and uploaded.
6. Sender can see which code is currently live.
7. Sender has a `Delete live code` button.

## Permanent room vs temporary code

- Room ID: permanent
- Permanent password verifier: permanent
- Verification code: 5 minutes by default

The password itself is never stored. `config` contains an AES-GCM encrypted known verifier.
Both sender and receiver verify the password by decrypting that verifier.

---

# IMPORTANT: update Firebase Rules first

Open:

Firebase Console -> Realtime Database -> Rules

Replace the current rules with the entire contents of:

`database.rules.json`

Then click **Publish**.

The old v1 rules will not work with this v2 folder structure.

---

# Deploy to GitHub Pages

Replace the old repository files with the files from this folder and push/commit them.

Your configured Firebase URL is already in:

`firebase-config.js`

Current URL:

`https://insta-pin-share-default-rtdb.asia-southeast1.firebasedatabase.app`

---

# Initialize the permanent password

After GitHub Pages finishes redeploying, open:

`https://studywithreviso-gif.github.io/insta-pin-share/setup.html`

You have two choices.

## Keep your existing long links

Your existing room ID was:

`8WFaKVp2oItJniSi5MJh7kVKIZ1A8Xsa`

Paste only that room ID into **Existing room ID**.

Choose a permanent shared password (minimum 10 characters), confirm it, then click:

`Create / initialize room`

This will create the permanent encrypted verifier under:

`rooms/<room-id>/config`

Your existing sender/receiver URL format can continue to use the same room ID.

## Create a fresh room

Leave the Existing room ID field empty.

Choose the permanent shared password and click `Create / initialize room`.

The page generates a fresh random room ID and gives you sender + receiver links.

---

# Recommended final setup

Because the earlier room ID has been shared during setup/testing, use it for testing if you want.

When everything works, create one new private room for long-term use and keep that room ID private.

---

# Firebase data structure

The new structure is:

```text
rooms/
  ROOM_ID/
    config/
      version
      verifierCiphertext
      verifierIv
      verifierSalt
      createdAt

    message/
      version
      ciphertext
      iv
      salt
      createdAt
      expiresAt
```

`config` stays permanently.

`message` is replaced whenever a new code is sent.

---

# Password security

Use a password with at least 10 characters.

Better:

`mango-river-lamp-47`

Avoid using:

- Instagram password
- Gmail password
- phone PIN
- birthday
- simple numeric PIN like 1234

This is a fully static Option A design, so the encrypted verifier can be obtained by anyone who somehow learns the secret room ID. A weak password could then be guessed offline.

---

# Testing

Use a fake code first:

`123456`

Receiver:

1. Open receiver link.
2. Enter permanent shared password.
3. Confirm it immediately says `Waiting for code...`.

Sender:

1. Enter `123456`.
2. Enter the same shared password.
3. Send.

Expected:

- sender says code sent
- sender Current live code shows `123456`
- receiver automatically changes from waiting to `123456`
- countdown appears
- press Delete live code on sender
- receiver goes back to Waiting for code

---

# Security limitations

This design encrypts codes and never uploads the permanent shared password.

However, because it uses only GitHub Pages + Firebase and no authentication backend, Firebase rules cannot cryptographically verify the shared password for writes.

Someone who somehow learns the secret room ID may be able to overwrite or delete the temporary encrypted message.

They still cannot decrypt the real code without the permanent password.

If stronger write authorization/rate limiting is needed later, move the password check to a backend such as Cloudflare Workers.

---

# What this does not do

It does not:

- disable Instagram verification
- log into Instagram
- automatically read Gmail
- store Instagram passwords
- store Gmail passwords

It only relays a manually entered verification code.
