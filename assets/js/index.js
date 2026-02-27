// assets/js/index.js
(function () {
  qs("#yr").textContent = new Date().getFullYear();

  const timerEl = qs("#timer");
  const statusEl = qs("#statusLine");

  function tick() {
    const ms = deadlineMs() - Date.now();
    const t = fmtTimeLeft(ms);
    timerEl.textContent = t.text;
    timerEl.classList.toggle("closed", t.done);
    statusEl.textContent = t.done ? "Submissions are closed." : "Submissions are open.";
  }
  tick();
  setInterval(tick, 1000);
})();