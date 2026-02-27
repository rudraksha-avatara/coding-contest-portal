// assets/js/index.js — FULL UPDATED (better UX + safer selectors + reduced repaint + accessibility)
// Requires from app-common.js: qs(), deadlineMs(), fmtTimeLeft()

(function () {
  // Year (safe)
  const yr = qs("#yr");
  if (yr) yr.textContent = String(new Date().getFullYear());

  const timerEl = qs("#timer");
  const statusEl = qs("#statusLine");

  if (!timerEl || !statusEl) return;

  let lastText = "";
  let lastDone = null;

  function render(t) {
    // Avoid unnecessary DOM updates (better performance)
    if (t.text !== lastText) {
      timerEl.textContent = t.text;
      lastText = t.text;
    }

    if (t.done !== lastDone) {
      timerEl.classList.toggle("closed", !!t.done);
      statusEl.textContent = t.done
        ? "Submissions are closed."
        : "Submissions are open.";
      statusEl.setAttribute("aria-live", "polite");
      lastDone = t.done;
    }
  }

  function tick() {
    const ms = deadlineMs() - Date.now();
    const t = fmtTimeLeft(ms);
    render(t);
  }

  // Initial paint immediately
  tick();

  // Update every second (aligned)
  const interval = setInterval(tick, 1000);

  // Cleanup when tab goes hidden (optional micro-optimization)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(interval);
    } else {
      tick();
      setInterval(tick, 1000);
    }
  });
})();
