function getConfig() {
  const cfg = window.APP_CONFIG || {};
  const url = String(cfg.databaseURL || "").trim().replace(/\/+$/, "");

  if (!url || url.includes("PASTE_YOUR_FIREBASE")) {
    throw new Error(
      "Firebase is not configured. Open firebase-config.js and set your Realtime Database URL."
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

function validateRoomId(roomId) {
  return /^[A-Za-z0-9_-]{20,80}$/.test(roomId);
}

function firebasePath(databaseURL, path) {
  const safePath = String(path)
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `${databaseURL}/${safePath}.json`;
}

async function firebaseRequest(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options
  });

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    return { ok: false, missingOrDenied: true, status: response.status, value: null };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Firebase request failed (${response.status}). ${text}`.trim());
  }

  const value = await response.json();
  return { ok: true, missingOrDenied: false, status: response.status, value };
}

async function getRoomConfig(databaseURL, roomId) {
  const result = await firebaseRequest(
    firebasePath(databaseURL, `rooms/${roomId}/config`)
  );

  if (!result.ok) return null;
  return result.value;
}

async function createRoomConfig(databaseURL, roomId, configPayload) {
  const result = await firebaseRequest(
    firebasePath(databaseURL, `rooms/${roomId}/config`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configPayload)
    }
  );

  if (!result.ok) {
    throw new Error(
      "Could not initialize this room. It may already have a permanent password, or Firebase rules may not be updated."
    );
  }

  return result.value;
}

async function getLiveMessage(databaseURL, roomId) {
  const result = await firebaseRequest(
    firebasePath(databaseURL, `rooms/${roomId}/message`)
  );

  if (!result.ok) return null;
  return result.value;
}

async function putLiveMessage(databaseURL, roomId, payload) {
  const result = await firebaseRequest(
    firebasePath(databaseURL, `rooms/${roomId}/message`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  if (!result.ok) {
    throw new Error(
      "Could not send the code. Check the Firebase rules and database URL."
    );
  }

  return result.value;
}

async function deleteLiveMessage(databaseURL, roomId) {
  const url = firebasePath(databaseURL, `rooms/${roomId}/message`);
  const response = await fetch(url, {
    method: "DELETE",
    cache: "no-store"
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text().catch(() => "");
    throw new Error(`Could not delete the live code (${response.status}). ${text}`.trim());
  }
}

function setStatus(el, text, type = "") {
  el.textContent = text;
  el.classList.remove("good", "bad");
  if (type) el.classList.add(type);
}

function formatRemaining(ms) {
  if (ms <= 0) return "expired";
  const total = Math.ceil(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function validVerificationCode(value) {
  return /^\d{4,8}$/.test(value);
}

function validSharedPassword(value) {
  return typeof value === "string" && value.length > 0;
}
