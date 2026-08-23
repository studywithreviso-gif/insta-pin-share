// Firebase Realtime Database used by this GitHub Pages site.
//
// This URL is not a secret. Do NOT put Firebase service-account keys,
// Gmail passwords, Instagram passwords, or other private credentials here.
window.APP_CONFIG = {
  databaseURL: "https://insta-pin-share-default-rtdb.asia-southeast1.firebasedatabase.app",

  // A live Instagram code remains readable for this long.
  // The included Firebase rules allow a maximum of 10 minutes.
  ttlMinutes: 5,

  // Viewer/sender live-status refresh interval.
  pollMs: 2000
};
