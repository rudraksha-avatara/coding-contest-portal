// assets/js/confirmation.js  (only the updated file row part shown as full file below)
(function () {
  const box = qs("#box");
  const copyBtn = qs("#copyBtn");

  const params = new URLSearchParams(location.search);
  const sid = params.get("sid");

  if (!sid) {
    box.innerHTML = `<p class="sx-muted">No Submission ID found in URL. Example: confirmation.html?sid=12345</p>`;
    copyBtn.disabled = true;
    return;
  }

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(sid);
      setToast("Copied: " + sid, "success");
    } catch {
      setToast("Copy failed. Please copy manually.", "error");
    }
  });

  firebase.database().ref("submissions/" + sid).once("value")
    .then((snap) => {
      const d = snap.val();
      if (!d) {
        box.innerHTML = `<p class="sx-muted">Submission not found for ID: <b>${escapeHtml(sid)}</b></p>`;
        return;
      }

      box.innerHTML = `
        <div class="sx-kv">
          <div class="row"><div class="k">Submission ID</div><div class="v">${escapeHtml(d.submissionId)}</div></div>
          <div class="row"><div class="k">Registration ID</div><div class="v">${escapeHtml(d.regId)}</div></div>
          <div class="row"><div class="k">Problem ID</div><div class="v">${escapeHtml(d.problemId)}</div></div>
          <div class="row"><div class="k">Language</div><div class="v">${escapeHtml(d.lang)}</div></div>
          <div class="row"><div class="k">Code URL</div><div class="v"><a href="${escapeHtml(d.codeUrl || "#")}" target="_blank" rel="noreferrer">Open code link</a></div></div>
          <div class="row"><div class="k">Notes</div><div class="v">${escapeHtml(d.note)}</div></div>
          <div class="row"><div class="k">Submitted At</div><div class="v">${escapeHtml(d.createdAt || "")}</div></div>
        </div>
      `;
    })
    .catch((err) => {
      console.error(err);
      box.innerHTML = `<p class="sx-muted">Failed to load submission. Check database rules/network.</p>`;
    });
})();