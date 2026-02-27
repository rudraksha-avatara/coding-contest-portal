// assets/js/confirmation.js — FULL UPDATED
// Requires: qs(), escapeHtml(), setToast() from app-common.js
// Firebase initialized via firebase-config.js

(function () {
  const box = qs("#box");
  const copyBtn = qs("#copyBtn");

  const params = new URLSearchParams(location.search);
  const sid = params.get("sid");

  // -----------------------------
  // Helpers
  // -----------------------------
  function safeHttpUrl(url) {
    try {
      const u = new URL(url);
      if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    } catch {}
    return "";
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      } catch {
        return false;
      }
    }
  }

  function renderSkeleton() {
    box.innerHTML = `
      <div class="sx-skel">
        <div class="sx-skel-line"></div>
        <div class="sx-skel-line w-70"></div>
        <div class="sx-skel-line w-40"></div>
      </div>
    `;
  }

  function renderError(msg) {
    box.innerHTML = `<p class="sx-muted">${escapeHtml(msg)}</p>`;
    if (copyBtn) copyBtn.disabled = true;
  }

  // -----------------------------
  // No SID
  // -----------------------------
  if (!sid) {
    renderError("No Submission ID found in URL. Example: confirmation.html?sid=12345");
    return;
  }

  // -----------------------------
  // Copy Button
  // -----------------------------
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const ok = await copyText(sid);
      if (ok) {
        const old = copyBtn.textContent;
        copyBtn.textContent = "Copied ✅";
        setToast("Copied: " + sid, "success");
        setTimeout(() => (copyBtn.textContent = old), 1200);
      } else {
        setToast("Copy failed. Please copy manually.", "error");
      }
    });
  }

  // -----------------------------
  // Load Data
  // -----------------------------
  renderSkeleton();

  firebase
    .database()
    .ref("submissions/" + sid)
    .once("value")
    .then((snap) => {
      const d = snap.val();

      if (!d) {
        renderError("Submission not found for ID: " + sid);
        return;
      }

      const safeUrl = safeHttpUrl(d.codeUrl || "");

      box.innerHTML = `
        <div class="sx-kv">
          <div class="sx-kv-row row">
            <div class="sx-k k">Submission ID</div>
            <div class="sx-v v sx-break">${escapeHtml(d.submissionId || sid)}</div>
          </div>

          <div class="sx-kv-row row">
            <div class="sx-k k">Registration ID</div>
            <div class="sx-v v sx-break">${escapeHtml(d.regId || "")}</div>
          </div>

          <div class="sx-kv-row row">
            <div class="sx-k k">Problem ID</div>
            <div class="sx-v v">${escapeHtml(d.problemId || "")}</div>
          </div>

          <div class="sx-kv-row row">
            <div class="sx-k k">Language</div>
            <div class="sx-v v">${escapeHtml(d.lang || "")}</div>
          </div>

          <div class="sx-kv-row row">
            <div class="sx-k k">Code URL</div>
            <div class="sx-v v sx-break">
              ${
                safeUrl
                  ? `<a class="sx-a" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">Open code link</a>`
                  : `<span class="sx-muted">No valid URL</span>`
              }
            </div>
          </div>

          <div class="sx-kv-row row">
            <div class="sx-k k">Notes</div>
            <div class="sx-v v sx-break">${escapeHtml(d.note || "")}</div>
          </div>

          <div class="sx-kv-row row">
            <div class="sx-k k">Submitted At</div>
            <div class="sx-v v">${escapeHtml(d.createdAt || "")}</div>
          </div>
        </div>
      `;

      setToast("Submission loaded.", "success");
    })
    .catch((err) => {
      console.error(err);
      renderError("Failed to load submission. Check database rules/network.");
      setToast("Failed to load submission.", "error");
    });
})();
