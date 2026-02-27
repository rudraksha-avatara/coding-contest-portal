// assets/js/app-common.js
(function initFirebase() {
  if (!window.firebase) return;
  const cfg = window.FIREBASE_CONFIG || window.firebaseConfig || null;
  if (!cfg) return;
  if (!firebase.apps.length) firebase.initializeApp(cfg);
})();

// --- Helpers ---
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

function cleanText(s = "") {
  return String(s).trim().replace(/\s+/g, " ");
}

function slugify(s = "") {
  return cleanText(s).toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function uid() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/\D/g, "");
}

function setToast(msg = "Done", type = "info") {
  const t = qs(".sx-toast");
  if (!t) return alert(msg);
  t.dataset.type = type;
  t.innerHTML = escapeHtml(msg);
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

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

// --- Skeleton ---
function skeletonFill(el, count = 6) {
  el.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = "sx-skel";
    div.innerHTML = `<div class="sx-skel-line"></div><div class="sx-skel-line w-70"></div>`;
    el.appendChild(div);
  }
}