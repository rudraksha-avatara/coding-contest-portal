// assets/js/submit.js — FULL UPDATED (better UX + strict URL validation + duplicate prevention per regId+problemId)
// Requires from app-common.js: qs(), cleanText(), escapeHtml(), setToast(), deadlineMs(), fmtTimeLeft()
// Firebase v8 initialized via firebase-config.js

(function () {
  const timerEl = qs("#timer");
  const btn = qs("#btnSub");
  const hintPill = qs("#subHint"); // in updated submit.html this is a pill
  const hintTop = qs("#subHintTop"); // helper line under timer
  const form = qs("#subForm");

  const regIdEl = qs("#regId");
  const problemEl = qs("#problemId");
  const langEl = qs("#lang");
  const urlEl = qs("#codeUrl");
  const noteEl = qs("#note");

  let isSubmitting = false;

  function setHint(text, mode) {
    if (hintPill) {
      hintPill.textContent = text || "";
      hintPill.classList.remove("sx-pill-ok", "sx-pill-bad", "sx-pill-load");
      if (mode === "loading") hintPill.classList.add("sx-pill-load");
      if (mode === "success") hintPill.classList.add("sx-pill-ok");
      if (mode === "error") hintPill.classList.add("sx-pill-bad");
    }
    if (hintTop) hintTop.textContent = text || "";
  }

  function gateByDeadline() {
    const ms = deadlineMs() - Date.now();
    const t = fmtTimeLeft(ms);
    timerEl.textContent = t.text;

    // Optional styling: if you have .closed in CSS, it'll apply
    timerEl.classList.toggle("closed", t.done);

    btn.disabled = t.done || isSubmitting;
    if (t.done) setHint("Submissions are closed.", "error");
  }

  gateByDeadline();
  setInterval(gateByDeadline, 1000);

  function normalizePhoneLikeId(v) {
    // regId can be alphanumeric sometimes, so don't digit-only it.
    return cleanText(v || "").trim();
  }

  function normalizeNote(v) {
    return cleanText(v || "").trim();
  }

  function normalizeUrl(v) {
    return cleanText(v || "").trim();
  }

  function isValidHttpUrl(value) {
    try {
      const u = new URL(value);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      // basic host check
      return !!u.hostname;
    } catch {
      return false;
    }
  }

  function makeUniqueKey(regId, problemId) {
    // Safe RTDB key: replace non-word with "_"
    return `${regId}_${problemId}`.replace(/[^\w]/g, "_");
  }

  function makeSubmissionId(regId) {
    // keep "traceable-ish" but stable: regId + timestamp + random digit
    // no digit-only enforcement because regId may contain letters; store as string
    const stamp = Date.now();
    const rand = Math.floor(Math.random() * 10);
    return `${regId}_${stamp}_${rand}`.replace(/[^\w]/g, "_");
  }

  async function ensureRegistrationExists(regId) {
    // Optional check: ensures regId exists before allowing submission.
    // (If your project doesn't want this check, you can remove it.)
    const snap = await firebase
      .database()
      .ref("registrations/" + regId)
      .once("value");
    return snap.exists();
  }

  async function releaseIndexIfOwned(idxRef, submissionId) {
    // Best-effort cleanup if submission save fails after lock acquired.
    try {
      const cur = (await idxRef.once("value")).val();
      if (cur === submissionId) await idxRef.remove();
    } catch {
      // ignore
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const ms = deadlineMs() - Date.now();
    if (ms <= 0)
      return setToast("Deadline passed. Submissions closed.", "error");

    isSubmitting = true;
    gateByDeadline();
    setHint("Validating…", "loading");

    const regId = normalizePhoneLikeId(regIdEl.value);
    const problemId = problemEl.value;
    const lang = langEl.value;
    const note = normalizeNote(noteEl.value);
    const codeUrl = normalizeUrl(urlEl.value);

    if (!regId) {
      isSubmitting = false;
      gateByDeadline();
      return setToast("Registration ID required.", "error");
    }
    if (!note || note.length < 7) {
      isSubmitting = false;
      gateByDeadline();
      return setToast("Notes must be at least 7 characters.", "error");
    }
    if (!codeUrl) {
      isSubmitting = false;
      gateByDeadline();
      return setToast("Code URL required.", "error");
    }
    if (!isValidHttpUrl(codeUrl)) {
      isSubmitting = false;
      gateByDeadline();
      return setToast("Please enter a valid URL (https://...)", "error");
    }

    const submissionId = makeSubmissionId(regId);

    // Unique index key => prevents duplicates per regId+problemId
    const uniqueKey = makeUniqueKey(regId, problemId);
    const idxRef = firebase.database().ref("submissionIndex/" + uniqueKey);

    try {
      btn.disabled = true;
      setHint("Checking registration…", "loading");

      // ✅ Optional: verify regId exists (helps reduce spam)
      const regOk = await ensureRegistrationExists(regId);
      if (!regOk) {
        setHint("Registration ID not found.", "error");
        isSubmitting = false;
        gateByDeadline();
        return setToast(
          "Registration ID not found. Please register first or check your ID.",
          "error",
        );
      }

      setHint("Checking duplicates…", "loading");

      // ✅ Atomic lock: if already exists, transaction won't commit
      const tx = await idxRef.transaction((current) => {
        if (current) return; // abort
        return submissionId; // lock with this submissionId
      });

      // If not committed => duplicate
      if (!tx.committed) {
        const existingId = tx.snapshot.val();
        setToast("Duplicate: already submitted for this problem.", "error");
        setHint("Already submitted. Opening existing submission…", "error");

        // best UX: open existing submission confirmation
        if (existingId) {
          location.href = `./confirmation.html?sid=${encodeURIComponent(existingId)}`;
        } else {
          isSubmitting = false;
          gateByDeadline();
        }
        return;
      }

      setHint("Saving submission…", "loading");

      const payload = {
        submissionId,
        regId,
        problemId,
        lang,
        note,
        codeUrl,
        createdAt: new Date().toISOString(),
        mode: "url",
      };

      // Save main submission
      await firebase
        .database()
        .ref("submissions/" + submissionId)
        .set(payload);

      setToast("Submitted successfully!", "success");
      setHint("Submitted ✅ Redirecting…", "success");

      // Redirect to confirmation
      location.href = `./confirmation.html?sid=${encodeURIComponent(submissionId)}`;
    } catch (err) {
      console.error(err);

      // Cleanup index lock if owned
      await releaseIndexIfOwned(idxRef, submissionId);

      setToast("Failed to submit. Check rules/network.", "error");
      setHint("Submit failed.", "error");
    } finally {
      isSubmitting = false;
      gateByDeadline();
    }
  });
})();
