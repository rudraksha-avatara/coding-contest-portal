// assets/js/app-common.js — FULL UPDATED (safer + more helpers + better uid + better toast + url helpers)
// Works with your existing pages. Backward-compatible with qs/qsa/escapeHtml/cleanText/slugify/uid/setToast/fmtTimeLeft/deadlineMs/skeletonFill

(function initFirebase() {
  try {
    if (!window.firebase) return;

    // Support multiple config names (your old + common patterns)
    const cfg =
      window.FIREBASE_CONFIG ||
      window.firebaseConfig ||
      window.FIREBASE ||
      null;

    if (!cfg) return;

    // Prevent double init
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
  } catch (e) {
    console.warn("Firebase init skipped:", e);
  }
})();

// -------------------------
// DOM Helpers
// -------------------------
function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

// -------------------------
// Text / Security Helpers
// -------------------------
function escapeHtml(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[m],
  );
}

function cleanText(s = "") {
  return String(s).trim().replace(/\s+/g, " ");
}

function slugify(s = "") {
  // stable, short slug; keeps it safe for urls/ids
  return cleanText(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// Stronger uid: time + random + perf counter (still string)
function uid(prefix = "") {
  const t = Date.now();
  const r = Math.floor(Math.random() * 1e6);
  const p =
    typeof performance !== "undefined"
      ? Math.floor(performance.now() * 1000)
      : 0;
  const base = `${prefix}${t}${p}${r}`;
  // Keep it RTDB-safe and compact
  return base.replace(/[^\w]/g, "");
}

// -------------------------
// URL Helpers
// -------------------------
function isValidHttpUrl(value) {
  try {
    const u = new URL(String(value || ""));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function safeHttpUrl(value) {
  // returns "" if invalid
  const v = cleanText(value || "");
  if (!v) return "";
  try {
    const u = new URL(v);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    return "";
  } catch {
    return "";
  }
}

// -------------------------
// Clipboard Helper (fallback)
// -------------------------
async function copyText(text) {
  const v = String(text || "");
  if (!v) return false;

  try {
    await navigator.clipboard.writeText(v);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = v;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch {
      return false;
    }
  }
}

// -------------------------
// Toast (Better UX)
// -------------------------
function setToast(msg = "Done", type = "info") {
  const t = qs(".sx-toast");

  // Fallback if toast element not present
  if (!t) {
    try {
      alert(msg);
    } catch {}
    return;
  }

  // Types you can use: info | success | error | warn
  t.dataset.type = type;
  t.textContent = ""; // prevent HTML injection
  t.textContent = String(msg);

  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    t.classList.remove("show");
  }, 2600);
}

// -------------------------
// Time / Deadline Helpers
// -------------------------
function fmtTimeLeft(ms) {
  if (ms <= 0) return { done: true, text: "Submission Closed" };

  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const parts = [];
  if (d) parts.push(`${d}d`);
  parts.push(`${h}h`, `${m}m`, `${s}s`);

  return { done: false, text: parts.join(" ") };
}

// ✅ Set your contest submission deadline here (IST ok)
const CONTEST_DEADLINE_ISO = "2026-03-10T23:59:59+05:30";
function deadlineMs() {
  return new Date(CONTEST_DEADLINE_ISO).getTime();
}

// -------------------------
// Skeleton Loader Helpers
// -------------------------
function skeletonFill(el, count = 6) {
  if (!el) return;
  el.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "sx-skel";
    div.innerHTML = `
      <div class="sx-skel-line"></div>
      <div class="sx-skel-line w-70"></div>
    `;
    el.appendChild(div);
  }
}

// Optional: tiny utility to show a single skeleton card
function skeletonOne(el) {
  if (!el) return;
  el.innerHTML = `
    <div class="sx-skel">
      <div class="sx-skel-line"></div>
      <div class="sx-skel-line w-70"></div>
      <div class="sx-skel-line w-40"></div>
    </div>
  `;
}

// -------------------------
// Safe JSON fetch helper (optional)
// -------------------------
async function fetchJson(url, timeoutMs = 12000) {
  const u = String(url || "");
  if (!u) throw new Error("Missing URL");

  const ctrl =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;

  try {
    const res = await fetch(u, {
      method: "GET",
      cache: "no-store",
      signal: ctrl ? ctrl.signal : undefined,
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
