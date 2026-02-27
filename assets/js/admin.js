// assets/js/admin.js — FULL UPDATED (login overlay + search/sort + safer links + mobile friendly render)
// Requires from app-common.js: qs(), escapeHtml(), cleanText(), setToast(), skeletonFill()
// Firebase v8 initialized via firebase-config.js
//
// ⚠️ NOTE: Frontend-only lock is NOT real security. For real security use Firebase Auth + DB rules.

(function () {
  // =========================
  // BASIC UI LOCK (LOGIN OVERLAY)
  // =========================
  const ADMIN_LOGIN = {
    username: "admin",
    password: "123456",
  };

  const SESSION_KEY = "sx_admin_authed_v2";

  function ensureLoginOverlay() {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    const overlay = document.createElement("div");
    overlay.id = "sxAdminLock";
    overlay.innerHTML = `
      <div class="sx-lock-card" role="dialog" aria-modal="true" aria-labelledby="sxLockTitle">
        <div class="sx-lock-head">
          <div class="sx-lock-badge" aria-hidden="true">🔒</div>
          <div>
            <h2 id="sxLockTitle" class="sx-lock-title">Admin Login</h2>
            <p class="sx-lock-sub">Enter username and password to access the admin panel.</p>
          </div>
        </div>

        <form id="sxLockForm" class="sx-lock-form" autocomplete="off">
          <label class="sx-lock-label" for="sxLockUser">Username</label>
          <input id="sxLockUser" class="sx-lock-input" type="text" inputmode="text" autocapitalize="none" spellcheck="false" required />

          <label class="sx-lock-label" for="sxLockPass">Password</label>
          <div class="sx-lock-passrow">
            <input id="sxLockPass" class="sx-lock-input" type="password" required />
            <button class="sx-lock-eye" type="button" id="sxTogglePass" aria-label="Show password">Show</button>
          </div>

          <p id="sxLockErr" class="sx-lock-err" aria-live="polite"></p>

          <button class="sx-lock-btn" type="submit">Login</button>
          <button class="sx-lock-btn sx-lock-btn-ghost" type="button" id="sxLockClear">Reset</button>
        </form>

        <div class="sx-lock-foot">
          <span class="sx-muted">Tip:</span> This is a basic lock. Use Firebase Auth for real protection.
        </div>
      </div>
    `;

    // Self-contained CSS (doesn't depend on app.css)
    const style = document.createElement("style");
    style.id = "sxAdminLockStyle";
    style.textContent = `
      #sxAdminLock{
        position:fixed; inset:0; z-index:99999;
        display:flex; align-items:center; justify-content:center;
        padding:16px;
        background: rgba(15, 23, 42, .75);
        backdrop-filter: blur(8px);
      }
      .sx-lock-card{
        width:min(520px, 100%);
        background:#fff;
        border:1px solid #e5e7eb;
        border-radius:16px;
        padding:18px;
        box-shadow: 0 18px 60px rgba(0,0,0,.22);
      }
      .sx-lock-head{display:flex; gap:12px; align-items:flex-start; margin-bottom:14px;}
      .sx-lock-badge{
        width:42px; height:42px; border-radius:12px;
        display:flex; align-items:center; justify-content:center;
        background:#f3f4f6; border:1px solid #e5e7eb;
        flex:0 0 auto;
      }
      .sx-lock-title{margin:0; font-size:18px; color:#111827;}
      .sx-lock-sub{margin:4px 0 0; font-size:13px; color:#6b7280; line-height:1.5;}
      .sx-lock-form{display:grid; gap:10px; margin-top:6px;}
      .sx-lock-label{font-size:13px; color:#374151; font-weight:600;}
      .sx-lock-input{
        width:100%;
        padding:10px 12px;
        border:1px solid #e5e7eb;
        border-radius:12px;
        outline:none;
        font-size:14px;
      }
      .sx-lock-input:focus{border-color:#111827; box-shadow:0 0 0 4px rgba(17,24,39,.08);}
      .sx-lock-passrow{display:flex; gap:8px; align-items:center;}
      .sx-lock-eye{
        padding:10px 12px;
        border:1px solid #e5e7eb;
        border-radius:12px;
        background:#fff;
        cursor:pointer;
        font-size:13px;
        white-space:nowrap;
      }
      .sx-lock-btn{
        width:100%;
        padding:11px 12px;
        border-radius:12px;
        border:1px solid #111827;
        background:#111827;
        color:#fff;
        cursor:pointer;
        font-weight:700;
      }
      .sx-lock-btn:active{transform: translateY(1px);}
      .sx-lock-btn-ghost{
        background:#fff;
        color:#111827;
        border-color:#e5e7eb;
      }
      .sx-lock-err{margin:0; min-height:18px; font-size:13px; color:#b91c1c;}
      .sx-lock-foot{margin-top:10px; font-size:12px; color:#6b7280;}
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    const $user = overlay.querySelector("#sxLockUser");
    const $pass = overlay.querySelector("#sxLockPass");
    const $err = overlay.querySelector("#sxLockErr");
    const $form = overlay.querySelector("#sxLockForm");
    const $toggle = overlay.querySelector("#sxTogglePass");
    const $clear = overlay.querySelector("#sxLockClear");

    setTimeout(() => $user.focus(), 10);

    $toggle.addEventListener("click", () => {
      const isPass = $pass.type === "password";
      $pass.type = isPass ? "text" : "password";
      $toggle.textContent = isPass ? "Hide" : "Show";
      $toggle.setAttribute(
        "aria-label",
        isPass ? "Hide password" : "Show password",
      );
      $pass.focus();
    });

    $clear.addEventListener("click", () => {
      $user.value = "";
      $pass.value = "";
      $err.textContent = "";
      $user.focus();
    });

    $form.addEventListener("submit", (e) => {
      e.preventDefault();
      $err.textContent = "";

      const u = ($user.value || "").trim();
      const p = ($pass.value || "").trim();

      if (!u || !p) {
        $err.textContent = "Please enter username and password.";
        return;
      }

      if (u === ADMIN_LOGIN.username && p === ADMIN_LOGIN.password) {
        sessionStorage.setItem(SESSION_KEY, "1");
        overlay.remove();
        const st = document.getElementById("sxAdminLockStyle");
        if (st) st.remove();
        bootAdmin();
      } else {
        $err.textContent = "Invalid credentials. Try again.";
      }
    });
  }

  window.sxAdminLogout = function () {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  };

  // =========================
  // ADMIN LOGIC
  // =========================
  function safeHttpUrl(url) {
    const u = String(url || "").trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) return "";
    return u;
  }

  function norm(s) {
    return cleanText(String(s || "")).toLowerCase();
  }

  function byIsoDesc(a, b) {
    return String(b?.createdAt || "").localeCompare(String(a?.createdAt || ""));
  }

  function makeToolbar(targetEl, placeholder, onSearch, onRefresh) {
    // toolbar inserted above list tables
    const wrap = document.createElement("div");
    wrap.className = "sx-admin-toolbar";
    wrap.innerHTML = `
      <div class="sx-admin-toolbar-row">
        <div class="sx-admin-search">
          <input class="sx-admin-search-in" type="search" placeholder="${escapeHtml(placeholder)}" />
        </div>
        <div class="sx-admin-actions">
          <button type="button" class="sx-admin-btn" data-act="refresh">Refresh</button>
        </div>
      </div>
      <div class="sx-admin-muted" data-info></div>
    `;

    // minimal CSS injected once
    if (!document.getElementById("sxAdminExtraStyle")) {
      const st = document.createElement("style");
      st.id = "sxAdminExtraStyle";
      st.textContent = `
        .sx-admin-toolbar{display:grid; gap:10px; margin:10px 0 12px;}
        .sx-admin-toolbar-row{display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap;}
        .sx-admin-search{flex: 1 1 260px;}
        .sx-admin-search-in{
          width:100%;
          padding:10px 12px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.03);
          color: rgba(226,232,240,.95);
          outline:none;
        }
        .sx-admin-search-in::placeholder{color: rgba(226,232,240,.45);}
        .sx-admin-search-in:focus{border-color: rgba(59,130,246,.35); box-shadow:0 0 0 4px rgba(59,130,246,.12);}
        .sx-admin-actions{display:flex; gap:10px; flex-wrap:wrap;}
        .sx-admin-btn{
          padding:10px 12px; border-radius:12px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.03);
          color: rgba(226,232,240,.95);
          cursor:pointer; font-weight:800;
        }
        .sx-admin-btn:active{transform: translateY(1px);}
        .sx-admin-muted{font-size:12px; color: rgba(226,232,240,.65);}
        .sx-chip{
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 10px; border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.03);
          font-size:12px; color: rgba(226,232,240,.85);
          margin-right:8px; margin-top:6px;
        }
        /* mobile tables become scrollable */
        .sx-table-wrap{overflow:auto; -webkit-overflow-scrolling:touch; border-radius:14px;}
        .sx-table{min-width: 720px;} /* ensures nice scroll on mobile */
      `;
      document.head.appendChild(st);
    }

    const input = wrap.querySelector(".sx-admin-search-in");
    const info = wrap.querySelector("[data-info]");
    const refreshBtn = wrap.querySelector('[data-act="refresh"]');

    input.addEventListener("input", () => onSearch(input.value, info));
    refreshBtn.addEventListener("click", () => onRefresh(input.value, info));

    // insert toolbar at top of container
    targetEl.parentNode.insertBefore(wrap, targetEl);
    return { input, info, wrap };
  }

  function bootAdmin() {
    const regList = qs("#regList");
    const subList = qs("#subList");

    skeletonFill(regList, 5);
    skeletonFill(subList, 5);

    let regsAll = [];
    let subsAll = [];

    // ---------- renderers ----------
    function renderRegs(items, query = "") {
      const q = norm(query);

      const filtered = !q
        ? items
        : items.filter((d) => {
            const hay = [
              d.id,
              d.type,
              d.name,
              d.email,
              d.phone,
              d.college,
              d.teamName,
              ...(Array.isArray(d.members) ? d.members : []),
            ]
              .map((x) => norm(x))
              .join(" ");
            return hay.includes(q);
          });

      if (!filtered.length) {
        regList.innerHTML = `<p class="sx-muted">No registrations found.</p>`;
        return filtered.length;
      }

      const rows = filtered
        .map(
          (d) => `
        <tr>
          <td class="sx-break">
            <b>${escapeHtml(d.id || "")}</b>
            <div class="sx-muted">${escapeHtml(d.type || "")}${d.teamName ? " • " + escapeHtml(d.teamName) : ""}</div>
          </td>
          <td class="sx-break">
            ${escapeHtml(d.name || "")}
            <div class="sx-muted">${escapeHtml(d.email || "")}</div>
          </td>
          <td class="sx-break">
            ${escapeHtml(d.college || "")}
            <div class="sx-muted">${escapeHtml(d.phone || "")}</div>
          </td>
        </tr>
      `,
        )
        .join("");

      regList.innerHTML = `
        <div class="sx-table-wrap">
          <table class="sx-table">
            <thead><tr><th>ID</th><th>Participant</th><th>College</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;

      return filtered.length;
    }

    function renderSubs(items, query = "") {
      const q = norm(query);

      const filtered = !q
        ? items
        : items.filter((d) => {
            const hay = [
              d.submissionId,
              d.problemId,
              d.lang,
              d.regId,
              d.createdAt,
              d.codeUrl,
              d.fileURL,
            ]
              .map((x) => norm(x))
              .join(" ");
            return hay.includes(q);
          });

      if (!filtered.length) {
        subList.innerHTML = `<p class="sx-muted">No submissions found.</p>`;
        return filtered.length;
      }

      const rows = filtered
        .map((d) => {
          const sid = escapeHtml(d.submissionId || "");
          const regId = escapeHtml(d.regId || "");
          const meta = `${escapeHtml(d.problemId || "")} • ${escapeHtml(d.lang || "")}`;
          const when = escapeHtml(d.createdAt || "");

          const codeUrl = safeHttpUrl(d.codeUrl || d.fileURL);
          const codeCell = codeUrl
            ? `<a class="sx-a" href="${escapeHtml(codeUrl)}" target="_blank" rel="noreferrer">Open URL</a>`
            : `<span class="sx-muted">No URL</span>`;

          return `
          <tr>
            <td class="sx-break">
              <b>${sid}</b>
              <div class="sx-muted">${meta}</div>
            </td>
            <td class="sx-break">
              ${regId}
              <div><a class="sx-a" href="./confirmation.html?sid=${encodeURIComponent(d.submissionId || "")}">Open</a></div>
            </td>
            <td class="sx-break">
              ${codeCell}
              <div class="sx-muted">${when}</div>
            </td>
          </tr>
        `;
        })
        .join("");

      subList.innerHTML = `
        <div class="sx-table-wrap">
          <table class="sx-table">
            <thead><tr><th>Submission</th><th>Reg ID</th><th>URL</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;

      return filtered.length;
    }

    // ---------- toolbars ----------
    const regTb = makeToolbar(
      regList,
      "Search registrations: name, email, phone, college, id…",
      (q, infoEl) => {
        const n = renderRegs(regsAll, q);
        if (infoEl)
          infoEl.innerHTML = `<span class="sx-chip">Showing: <b>${n}</b></span><span class="sx-chip">Total: <b>${regsAll.length}</b></span>`;
      },
      async (q, infoEl) => {
        await loadRegs();
        const n = renderRegs(regsAll, q);
        if (infoEl)
          infoEl.innerHTML = `<span class="sx-chip">Showing: <b>${n}</b></span><span class="sx-chip">Total: <b>${regsAll.length}</b></span>`;
        setToast("Registrations refreshed.", "success");
      },
    );

    const subTb = makeToolbar(
      subList,
      "Search submissions: submissionId, regId, problemId, lang…",
      (q, infoEl) => {
        const n = renderSubs(subsAll, q);
        if (infoEl)
          infoEl.innerHTML = `<span class="sx-chip">Showing: <b>${n}</b></span><span class="sx-chip">Total: <b>${subsAll.length}</b></span>`;
      },
      async (q, infoEl) => {
        await loadSubs();
        const n = renderSubs(subsAll, q);
        if (infoEl)
          infoEl.innerHTML = `<span class="sx-chip">Showing: <b>${n}</b></span><span class="sx-chip">Total: <b>${subsAll.length}</b></span>`;
        setToast("Submissions refreshed.", "success");
      },
    );

    // ---------- loaders ----------
    async function loadRegs() {
      try {
        const snap = await firebase
          .database()
          .ref("registrations")
          .limitToLast(200)
          .once("value");
        const val = snap.val() || {};
        regsAll = Object.values(val).sort(byIsoDesc);
        renderRegs(regsAll, regTb?.input?.value || "");
        if (regTb?.info)
          regTb.info.innerHTML = `<span class="sx-chip">Total: <b>${regsAll.length}</b></span>`;
      } catch (err) {
        console.error(err);
        regList.innerHTML = `<p class="sx-muted">Failed to load registrations.</p>`;
        setToast("Failed to load registrations.", "error");
      }
    }

    async function loadSubs() {
      try {
        const snap = await firebase
          .database()
          .ref("submissions")
          .limitToLast(200)
          .once("value");
        const val = snap.val() || {};
        subsAll = Object.values(val).sort(byIsoDesc);
        renderSubs(subsAll, subTb?.input?.value || "");
        if (subTb?.info)
          subTb.info.innerHTML = `<span class="sx-chip">Total: <b>${subsAll.length}</b></span>`;
      } catch (err) {
        console.error(err);
        subList.innerHTML = `<p class="sx-muted">Failed to load submissions.</p>`;
        setToast("Failed to load submissions.", "error");
      }
    }

    // initial load
    loadRegs();
    loadSubs();
  }

  // =========================
  // START
  // =========================
  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    bootAdmin();
  } else {
    ensureLoginOverlay();
  }
})();
