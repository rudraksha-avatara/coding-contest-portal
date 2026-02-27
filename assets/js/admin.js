// assets/js/admin.js
(function () {
  // =========================
  // BASIC UI LOCK (LOGIN OVERLAY)
  // =========================
  // ⚠️ Frontend-only lock. Not real security.
  // Change these credentials:
  const ADMIN_LOGIN = {
    username: "admin",
    password: "123456"
  };

  const SESSION_KEY = "sx_admin_authed_v1";

  function ensureLoginOverlay() {
    // If already logged in this session, skip overlay
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    // Build overlay
    const overlay = document.createElement("div");
    overlay.id = "sxAdminLock";
    overlay.innerHTML = `
      <div class="sx-lock-card" role="dialog" aria-modal="true" aria-labelledby="sxLockTitle">
        <div class="sx-lock-head">
          <div class="sx-lock-badge" aria-hidden="true">🔒</div>
          <div>
            <h2 id="sxLockTitle" class="sx-lock-title">Admin Login</h2>
            <p class="sx-lock-sub">Enter your username and password to access the admin panel.</p>
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

          <button class="sx-lock-btn sx-lock-btn-ghost" type="button" id="sxLockClear">
            Reset
          </button>
        </form>

        <div class="sx-lock-foot">
          <span class="sx-muted">Tip:</span> This is a basic lock. Use Firebase Auth for real protection.
        </div>
      </div>
    `;

    // Minimal CSS (self-contained, won’t break your site)
    const style = document.createElement("style");
    style.id = "sxAdminLockStyle";
    style.textContent = `
      #sxAdminLock{
        position:fixed; inset:0; z-index:99999;
        display:flex; align-items:center; justify-content:center;
        padding:16px;
        background: rgba(15, 23, 42, .75);
        backdrop-filter: blur(6px);
      }
      .sx-lock-card{
        width:min(520px, 100%);
        background:#fff;
        border:1px solid #e5e7eb;
        border-radius:16px;
        padding:18px;
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
      .sx-lock-label{font-size:13px; color:#374151;}
      .sx-lock-input{
        width:100%;
        padding:10px 12px;
        border:1px solid #e5e7eb;
        border-radius:12px;
        outline:none;
        font-size:14px;
      }
      .sx-lock-input:focus{border-color:#111827;}
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
        font-weight:600;
      }
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

    // UX: focus username
    setTimeout(() => $user.focus(), 10);

    $toggle.addEventListener("click", () => {
      const isPass = $pass.type === "password";
      $pass.type = isPass ? "text" : "password";
      $toggle.textContent = isPass ? "Hide" : "Show";
      $toggle.setAttribute("aria-label", isPass ? "Hide password" : "Show password");
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
        // remove overlay + style
        overlay.remove();
        const st = document.getElementById("sxAdminLockStyle");
        if (st) st.remove();

        // Now load the admin data
        bootAdmin();
      } else {
        $err.textContent = "Invalid credentials. Try again.";
      }
    });
  }

  // Optional: logout helper (call from a button if you add one)
  window.sxAdminLogout = function () {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  };

  // =========================
  // ORIGINAL ADMIN LOGIC (BOOT AFTER LOGIN)
  // =========================
  function bootAdmin() {
    const regList = qs("#regList");
    const subList = qs("#subList");

    skeletonFill(regList, 5);
    skeletonFill(subList, 5);

    function renderRegs(items) {
      if (!items.length) {
        regList.innerHTML = `<p class="sx-muted">No registrations yet.</p>`;
        return;
      }
      const rows = items.map(d => `
        <tr>
          <td><b>${escapeHtml(d.id)}</b><br><span class="sx-muted">${escapeHtml(d.type)}</span></td>
          <td>${escapeHtml(d.name)}<br><span class="sx-muted">${escapeHtml(d.email)}</span></td>
          <td>${escapeHtml(d.college)}<br><span class="sx-muted">${escapeHtml(d.phone)}</span></td>
        </tr>
      `).join("");

      regList.innerHTML = `
        <table class="sx-table">
          <thead><tr><th>ID</th><th>Participant</th><th>College</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    function renderSubs(items) {
      if (!items.length) {
        subList.innerHTML = `<p class="sx-muted">No submissions yet.</p>`;
        return;
      }
      const rows = items.map(d => `
        <tr>
          <td><b>${escapeHtml(d.submissionId)}</b><br><span class="sx-muted">${escapeHtml(d.problemId)} • ${escapeHtml(d.lang)}</span></td>
          <td>${escapeHtml(d.regId)}<br><a href="./confirmation.html?sid=${encodeURIComponent(d.submissionId)}">Open</a></td>
          <td><a href="${escapeHtml(d.fileURL || "#")}" target="_blank" rel="noreferrer">File</a><br><span class="sx-muted">${escapeHtml(d.createdAt || "")}</span></td>
        </tr>
      `).join("");

      subList.innerHTML = `
        <table class="sx-table">
          <thead><tr><th>Submission</th><th>Reg ID</th><th>File</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    // Latest 25 regs
    firebase.database().ref("registrations").limitToLast(25).once("value")
      .then(snap => {
        const val = snap.val() || {};
        const items = Object.values(val).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        renderRegs(items);
      })
      .catch(err => {
        console.error(err);
        regList.innerHTML = `<p class="sx-muted">Failed to load registrations.</p>`;
      });

    // Latest 25 subs
    firebase.database().ref("submissions").limitToLast(25).once("value")
      .then(snap => {
        const val = snap.val() || {};
        const items = Object.values(val).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        renderSubs(items);
      })
      .catch(err => {
        console.error(err);
        subList.innerHTML = `<p class="sx-muted">Failed to load submissions.</p>`;
      });
  }

  // =========================
  // START
  // =========================
  // If already authed, boot immediately. Otherwise show lock then boot on success.
  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    bootAdmin();
  } else {
    ensureLoginOverlay();
  }
})();