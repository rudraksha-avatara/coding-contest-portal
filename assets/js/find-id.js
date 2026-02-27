// assets/js/find-id.js — upgraded (responsive UI friendly + safer + better UX)
// Requires from app-common.js: qs(), cleanText(), escapeHtml(), setToast()
// Firebase v8 initialized via firebase-config.js

(function () {
  const form = qs("#findForm");
  const btn = qs("#btnFind");
  const hint = qs("#hint"); // on the new page this is a "pill"; still works as text container
  const resultBox = qs("#resultBox");
  const resultKv = qs("#resultKv");
  const copyBtn = qs("#copyBtn");

  // Optional UI elements (present in updated HTML; safe if missing)
  const emailEl = qs("#email");
  const phoneEl = qs("#phone");

  let lastFoundId = "";

  // ---------- helpers ----------
  function normalizePhone(p) {
    return String(p || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  function normalizeEmail(e) {
    return cleanText(e || "")
      .toLowerCase()
      .trim();
  }

  function setHint(text, mode) {
    // mode: "ready" | "loading" | "success" | "error"
    if (!hint) return;
    hint.textContent = text || "";
    // Keep it simple: if your hint is styled as a pill, add light class toggles
    // (won't break if classes don't exist)
    hint.classList.remove(
      "sx-pill-ok",
      "sx-pill-warn",
      "sx-pill-bad",
      "sx-pill-load",
    );
    if (mode === "loading") hint.classList.add("sx-pill-load");
    if (mode === "success") hint.classList.add("sx-pill-ok");
    if (mode === "error") hint.classList.add("sx-pill-bad");
  }

  function lockUI(locked) {
    if (btn) btn.disabled = !!locked;
    if (emailEl) emailEl.disabled = !!locked;
    if (phoneEl) phoneEl.disabled = !!locked;

    if (btn) {
      btn.dataset._label = btn.dataset._label || btn.textContent;
      btn.textContent = locked
        ? "Searching…"
        : btn.dataset._label || "Find Registration ID";
    }
  }

  function showFound(d) {
    lastFoundId = d?.id || "";
    const safe = (x) => escapeHtml(String(x ?? ""));

    // Render using the new CSS classes if available (sx-kv-row/sx-k/sx-v).
    // Falls back fine even if CSS doesn't exist.
    resultKv.innerHTML = `
      <div class="sx-kv-row row">
        <div class="sx-k k">Registration ID</div>
        <div class="sx-v v sx-break">${safe(d.id)}</div>
      </div>
      <div class="sx-kv-row row">
        <div class="sx-k k">Name</div>
        <div class="sx-v v sx-break">${safe(d.name)}</div>
      </div>
      <div class="sx-kv-row row">
        <div class="sx-k k">Email</div>
        <div class="sx-v v sx-break">${safe(d.email)}</div>
      </div>
      <div class="sx-kv-row row">
        <div class="sx-k k">Phone</div>
        <div class="sx-v v sx-break">${safe(d.phone)}</div>
      </div>
      <div class="sx-kv-row row">
        <div class="sx-k k">College</div>
        <div class="sx-v v sx-break">${safe(d.college)}</div>
      </div>
      <div class="sx-kv-row row">
        <div class="sx-k k">Type</div>
        <div class="sx-v v sx-break">${safe(d.type)}</div>
      </div>
    `;
    resultBox.style.display = "block";
  }

  async function copyText(text) {
    const value = String(text || "");
    if (!value) return false;

    // Clipboard API
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_) {
      // Fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
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

  // ---------- live input polish ----------
  if (phoneEl) {
    phoneEl.addEventListener("input", () => {
      const cleaned = normalizePhone(phoneEl.value);
      phoneEl.value = cleaned;
    });
  }

  if (emailEl) {
    emailEl.addEventListener("input", () => {
      // don’t aggressively rewrite user input; just trim spaces
      emailEl.value = emailEl.value.replace(/\s+/g, "");
    });
  }

  // ---------- copy button ----------
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      if (!lastFoundId) return;
      const ok = await copyText(lastFoundId);
      if (ok) {
        // Button micro-feedback
        const old = copyBtn.textContent;
        copyBtn.textContent = "Copied ✅";
        setToast("Copied: " + lastFoundId, "success");
        setTimeout(() => (copyBtn.textContent = old), 1200);
      } else {
        setToast("Copy failed. Please copy manually.", "error");
      }
    });
  }

  // ---------- main submit ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = normalizeEmail(emailEl?.value || "");
    const phone = normalizePhone(phoneEl?.value || "");

    resultBox.style.display = "none";
    resultKv.innerHTML = "";
    lastFoundId = "";

    if (!email) return setToast("Email required.", "error");
    if (phone.length !== 10)
      return setToast("Phone must be 10 digits.", "error");

    try {
      lockUI(true);
      setHint("Searching…", "loading");

      // Assignment approach: scan last N
      const snap = await firebase
        .database()
        .ref("registrations")
        .limitToLast(800) // slightly higher for safety
        .once("value");

      const val = snap.val() || {};
      const list = Object.values(val);

      // Fast match
      const found = list.find((r) => {
        return (
          normalizeEmail(r?.email) === email &&
          normalizePhone(r?.phone) === phone
        );
      });

      if (!found) {
        setHint("No matching registration found.", "error");
        setToast("Not found.", "error");
        return;
      }

      setHint("Found ✅", "success");
      setToast("Registration found.", "success");
      showFound(found);

      // Smooth scroll to results (nice on mobile)
      try {
        resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {}
    } catch (err) {
      console.error(err);
      setHint("Search failed.", "error");
      setToast("Failed to search. Check database rules/network.", "error");
    } finally {
      lockUI(false);
    }
  });
})();
