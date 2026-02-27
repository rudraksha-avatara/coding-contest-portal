// assets/js/register.js — upgraded (better validation + cleaner data + better UX + copy ID)
// Requires from app-common.js: qs(), cleanText(), escapeHtml(), setToast(), uid(), deadlineMs()
// Firebase v8 initialized via firebase-config.js

(function () {
  const form = qs("#regForm");
  const typeEl = qs("#type");
  const teamBox = qs("#teamBox");
  const teamName = qs("#teamName");
  const btn = qs("#btnReg");
  const hint = qs("#regHint");

  const nameEl = qs("#name");
  const emailEl = qs("#email");
  const phoneEl = qs("#phone");
  const collegeEl = qs("#college");
  const m1El = qs("#m1");
  const m2El = qs("#m2");
  const m3El = qs("#m3");
  const noteEl = qs("#note");

  let lastSavedId = "";

  // ---------- helpers ----------
  function normalizeEmail(e) {
    return cleanText(e || "")
      .toLowerCase()
      .trim();
  }

  function normalizePhone(p) {
    // keep only digits, max 10
    return String(p || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  function validateEmail(email) {
    // simple + robust enough for assignment (avoid overly strict patterns)
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
  }

  function setHint(text, mode) {
    // mode: "ready" | "loading" | "success" | "error"
    if (!hint) return;
    hint.textContent = text || "";
    hint.classList.remove("sx-pill-ok", "sx-pill-bad", "sx-pill-load");
    if (mode === "loading") hint.classList.add("sx-pill-load");
    if (mode === "success") hint.classList.add("sx-pill-ok");
    if (mode === "error") hint.classList.add("sx-pill-bad");
  }

  function lockUI(locked) {
    btn.disabled = !!locked;
    if (nameEl) nameEl.disabled = !!locked;
    if (emailEl) emailEl.disabled = !!locked;
    if (phoneEl) phoneEl.disabled = !!locked;
    if (collegeEl) collegeEl.disabled = !!locked;
    if (typeEl) typeEl.disabled = !!locked;
    if (teamName) teamName.disabled = !!locked || typeEl.value !== "team";
    if (m1El) m1El.disabled = !!locked;
    if (m2El) m2El.disabled = !!locked;
    if (m3El) m3El.disabled = !!locked;
    if (noteEl) noteEl.disabled = !!locked;

    btn.dataset._label = btn.dataset._label || btn.textContent;
    btn.textContent = locked
      ? "Saving…"
      : btn.dataset._label || "Submit Registration";
  }

  async function copyText(value) {
    const v = String(value || "");
    if (!v) return false;
    try {
      await navigator.clipboard.writeText(v);
      return true;
    } catch (_) {
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

  function syncType() {
    const isTeam = typeEl.value === "team";
    if (teamBox) teamBox.style.display = isTeam ? "block" : "none";
    if (teamName) {
      teamName.disabled = !isTeam;
      teamName.required = isTeam;
      if (!isTeam) teamName.value = "";
    }
    // optional: clear members if switching to individual
    if (!isTeam) {
      if (m1El) m1El.value = "";
      if (m2El) m2El.value = "";
      if (m3El) m3El.value = "";
      if (noteEl) noteEl.value = "";
    }
  }

  // ---------- init ----------
  syncType();
  typeEl.addEventListener("change", syncType);

  // live input polish
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

  // ---------- submit ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // deadline gate: your message says registration allowed, but submissions closed.
    // We'll keep your exact behavior but improve wording a bit.
    const ms = deadlineMs() - Date.now();
    if (ms <= 0) {
      setToast(
        "Registration is allowed, but contest deadline is over (submissions closed).",
        "error",
      );
      return;
    }

    const data = {
      id: uid(),
      name: cleanText(nameEl?.value || ""),
      email: normalizeEmail(emailEl?.value || ""),
      phone: normalizePhone(phoneEl?.value || ""),
      college: cleanText(collegeEl?.value || ""),
      type: typeEl.value,
      teamName: cleanText(teamName?.value || ""),
      members: [
        cleanText(m1El?.value || ""),
        cleanText(m2El?.value || ""),
        cleanText(m3El?.value || ""),
      ].filter(Boolean),
      note: cleanText(noteEl?.value || ""),
      createdAt: new Date().toISOString(),
    };

    // validations
    if (!data.name || data.name.length < 2)
      return setToast("Name is too short.", "error");
    if (!data.email || !validateEmail(data.email))
      return setToast("Email is invalid.", "error");
    if (data.phone.length !== 10)
      return setToast("Phone must be 10 digits.", "error");
    if (!data.college || data.college.length < 2)
      return setToast("College/Institute is required.", "error");
    if (data.type === "team" && (!data.teamName || data.teamName.length < 2))
      return setToast("Team name is required for Team type.", "error");

    try {
      lockUI(true);
      setHint("Saving…", "loading");
      lastSavedId = "";

      // ✅ Prevent overwrite (one registration per ID). uid() should already be unique,
      // but this makes it safer if someone re-submits.
      const ref = firebase.database().ref("registrations/" + data.id);
      const existing = await ref.once("value");
      if (existing.exists()) {
        // rare collision
        data.id = uid();
      }

      await firebase
        .database()
        .ref("registrations/" + data.id)
        .set(data);

      lastSavedId = data.id;

      setToast(
        "Registration saved. Your Registration ID: " + data.id,
        "success",
      );
      setHint("Saved ✅", "success");

      // Rich hint with copy button
      if (hint) {
        hint.innerHTML = `
          ✅ Saved. Registration ID:
          <b class="sx-break">${escapeHtml(data.id)}</b>
          <button id="sxCopyRid" type="button" class="sx-btn sx-btn-ghost" style="margin-left:10px;padding:8px 10px">
            Copy ID
          </button>
        `;

        const copyInline = document.getElementById("sxCopyRid");
        if (copyInline) {
          copyInline.addEventListener("click", async () => {
            const ok = await copyText(lastSavedId);
            if (ok) {
              const old = copyInline.textContent;
              copyInline.textContent = "Copied ✅";
              setToast("Copied: " + lastSavedId, "success");
              setTimeout(() => (copyInline.textContent = old), 1000);
            } else {
              setToast("Copy failed. Please copy manually.", "error");
            }
          });
        }
      }

      // reset form but keep type default
      form.reset();
      typeEl.value = "individual";
      syncType();

      // Scroll to top so user sees ID
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}
    } catch (err) {
      console.error(err);
      setHint("Save failed.", "error");
      setToast(
        "Failed to save registration. Check database rules/network.",
        "error",
      );
      if (hint) hint.textContent = "Error: " + (err?.message || "unknown");
    } finally {
      lockUI(false);
    }
  });
})();