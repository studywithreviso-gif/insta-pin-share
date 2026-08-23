function getConfig() {
  const cfg = window.APP_CONFIG || {};
  const url = String(cfg.databaseURL || "").trim().replace(/\/+$/, "");

  if (!url || url.includes("PASTE_YOUR_FIREBASE")) {
    throw new Error(
      "Firebase is not configured. Open firebase-config.js and paste your Realtime Database URL."
    );
  }

  return {
    databaseURL: url,
    ttlMinutes: Math.min(Math.max(Number(cfg.ttlMinutes) || 5, 1), 10),
    pollMs: Math.max(Number(cfg.pollMs) || 2000, 1000)
  };
}

function getRoomId() {
  const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
  const params = new URLSearchParams(hash);
  const room = (params.get("room") || "").trim();

  if (!/^[A-Za-z0-9_-]{20,80}$/.test(room)) {
    return null;
  }
  return room;
}

function roomEndpoint(databaseURL, roomId) {
  return `${databaseURL}/rooms/${encodeURIComponent(roomId)}.json`;
}

async function firebaseGet(databaseURL, roomId) {
  const response = await fetch(roomEndpoint(databaseURL, roomId), {
    method: "GET",
    cache: "no-store"
  });

  // With the included rules, a missing/expired room may return 401/403
  // because reads are only allowed while a valid unexpired item exists.
  if (response.status === 401 || response.status === 403 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Firebase read failed (${response.status}).`);
  }

  return response.json();
}

async function firebasePut(databaseURL, roomId, payload) {
  const response = await fetch(roomEndpoint(databaseURL, roomId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Firebase write failed (${response.status}). Check database URL and security rules. ${details}`.trim()
    );
  }

  return response.json();
}

async function firebaseDelete(databaseURL, roomId) {
  const response = await fetch(roomEndpoint(databaseURL, roomId), {
    method: "DELETE"
  });

  if (!response.ok && response.status !== 404) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Firebase delete failed (${response.status}). ${details}`.trim()
    );
  }
}

function setStatus(el, text) {
  el.textContent = text;
}

function formatRemaining(ms) {
  if (ms <= 0) return "expired";
  const total = Math.ceil(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}
