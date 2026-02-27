// assets/js/find-submission-id.js — upgraded (better UX + safer rendering + responsive table)
// Requires from app-common.js: qs(), cleanText(), escapeHtml(), setToast()
// Firebase v8 initialized via firebase-config.js

(function () {
  const form = qs("#findForm");
  const btn = qs("#btnFind");
  const hint = qs("#hint");
  const resultBox = qs("#resultBox");
  const listEl = qs("#list");

  const regIdEl = qs("#regId");
  const emailEl = qs("#email");
  const phoneEl = qs("#phone");
  const problemEl = qs("#problemId");

  const countPill = document.getElementById("countPill");

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
    if (!hint) return;
    hint.textContent = text || "";
    hint.classList.remove("sx-pill-ok", "sx-pill-bad", "sx-pill-load");
    if (mode === "loading") hint.classList.add("sx-pill-load");
    if (mode === "success") hint.classList.add("sx-pill-ok");
    if (mode === "error") hint.classList.add("sx-pill-bad");
  }

  function lockUI(locked) {
    btn.disabled = !!locked;
    if (regIdEl) regIdEl.disabled = !!locked;
    if (emailEl) emailEl.disabled = !!locked;
    if (phoneEl) phoneEl.disabled = !!locked;
    if (problemEl) problemEl.disabled = !!locked;

    btn.dataset._label = btn.dataset._label || btn.textContent;
    btn.textContent = locked
      ? "Searching…"
      : btn.dataset._label || "Find Submission IDs";
  }

  // Live input polish
  if (phoneEl) {
    phoneEl.addEventListener("input", () => {
      phoneEl.value = normalizePhone(phoneEl.value);
    });
  }
  if (emailEl) {
    emailEl.addEventListener("input", () => {
      emailEl.value = emailEl.value.replace(/\s+/g, "");
    });
  }

  async function verifyRegistration(regId, email, phone) {
    // Exact lookup: registrations/{regId}
    const snap = await firebase
      .database()
      .ref("registrations/" + regId)
      .once("value");
    const reg = snap.val();
    if (!reg) return { ok: false, reason: "Registration ID not found." };

    if (normalizeEmail(reg.email) !== email)
      return { ok: false, reason: "Email does not match registration." };

    if (normalizePhone(reg.phone) !== phone)
      return { ok: false, reason: "Phone does not match registration." };

    return { ok: true, reg };
  }

  function safeLink(url) {
    const u = String(url || "").trim();
    if (!u) return "";
    // Allow only http/https links
    if (!/^https?:\/\//i.test(u)) return "";
    return u;
  }

  function render(subs) {
    if (!subs.length) {
      listEl.innerHTML = `<p class="sx-muted">No submissions found.</p>`;
      if (countPill) countPill.textContent = "0";
      return;
    }

    if (countPill) countPill.textContent = String(subs.length);

    // Responsive rendering:
    // - Desktop/tablet: table
    // - Mobile: stacked cards (using CSS helpers if present)
    const rows = subs
      .map((s) => {
        const sid = escapeHtml(s.submissionId || "");
        const pid = escapeHtml(s.problemId || "");
        const lang = escapeHtml(s.lang || "");
        const created = escapeHtml(s.createdAt || "");
        const codeUrl = safeLink(s.codeUrl);

        const codeCell = codeUrl
          ? `<a class="sx-a" href="${escapeHtml(codeUrl)}" target="_blank" rel="noreferrer">Open Code URL</a>`
          : `<span class="sx-muted">No code URL</span>`;

        return `
          <tr>
            <td class="sx-break">
              <a class="sx-a" href="./confirmation.html?sid=${encodeURIComponent(s.submissionId || "")}">
                <b>${sid}</b>
              </a>
              <div class="sx-muted">${pid} • ${lang}</div>
              <div class="sx-muted">${created}</div>
            </td>
            <td class="sx-break">
              ${codeCell}
            </td>
          </tr>
        `;
      })
      .join("");

    // Mobile cards (no CSS? still ok)
    const cards = subs
      .map((s) => {
        const sid = escapeHtml(s.submissionId || "");
        const pid = escapeHtml(s.problemId || "");
        const lang = escapeHtml(s.lang || "");
        const created = escapeHtml(s.createdAt || "");
        const codeUrl = safeLink(s.codeUrl);

        return `
          <div class="sx-sub-card">
            <div class="sx-sub-top">
              <a class="sx-a sx-break" href="./confirmation.html?sid=${encodeURIComponent(s.submissionId || "")}">
                <b>${sid}</b>
              </a>
              <span class="sx-pill-mini">${pid || "—"}</span>
            </div>
            <div class="sx-sub-meta sx-muted">${lang || "—"} • ${created || ""}</div>
            <div class="sx-sub-link sx-break">
              ${
                codeUrl
                  ? `<a class="sx-a" href="${escapeHtml(codeUrl)}" target="_blank" rel="noreferrer">Open Code URL</a>`
                  : `<span class="sx-muted">No code URL</span>`
              }
            </div>
          </div>
        `;
      })
      .join("");

    listEl.innerHTML = `
      <div class="sx-only-mobile">
        ${cards}
      </div>

      <div class="sx-only-desktop">
        <table class="sx-table">
          <thead>
            <tr><th>Submission</th><th>Code URL</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const regId = cleanText(regIdEl?.value || "");
    const email = normalizeEmail(emailEl?.value || "");
    const phone = normalizePhone(phoneEl?.value || "");
    const problemFilter = problemEl?.value || "";

    resultBox.style.display = "none";
    listEl.innerHTML = "";
    if (countPill) countPill.textContent = "—";

    if (!regId) return setToast("Registration ID required.", "error");
    if (!email) return setToast("Email required.", "error");
    if (phone.length !== 10)
      return setToast("Phone must be 10 digits.", "error");

    try {
      lockUI(true);
      setHint("Verifying registration…", "loading");

      const v = await verifyRegistration(regId, email, phone);
      if (!v.ok) {
        setHint(v.reason, "error");
        setToast(v.reason, "error");
        return;
      }

      setHint("Searching submissions…", "loading");

      // Assignment-friendly scan (last 1000). Production: index by regId.
      const snap = await firebase
        .database()
        .ref("submissions")
        .limitToLast(1000)
        .once("value");
      const val = snap.val() || {};

      const subs = Object.values(val)
        .filter((s) => cleanText(s?.regId) === regId)
        .filter((s) => !problemFilter || s?.problemId === problemFilter)
        .sort((a, b) =>
          String(b?.createdAt || "").localeCompare(String(a?.createdAt || "")),
        );

      render(subs);
      resultBox.style.display = "block";

      const msg = subs.length
        ? `Found ${subs.length} submission(s).`
        : "No submissions found.";
      setHint(msg, subs.length ? "success" : "error");
      setToast("Search complete.", "success");

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
