// =============================================================
// The Rule of Thumb - Coding Session Stopwatch & Time Tracker
// =============================================================

let timerRunning = false;
let timerSeconds = 0;
let timerInterval = null;

function formatTime(s) {
  const hrs = Math.floor(s / 3600).toString().padStart(2, '0');
  const mins = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const secs = (s % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function toggleTimer() {
  const btn = document.getElementById('timer-toggle-btn');
  const display = document.getElementById('timer-display');
  if (!timerRunning) {
    timerRunning = true;
    if (btn) {
      btn.textContent = "⏸ Pause Session";
      btn.style.background = "var(--accent-amber)";
    }
    timerInterval = setInterval(() => {
      timerSeconds++;
      if (display) display.textContent = formatTime(timerSeconds);
    }, 1000);
  } else {
    timerRunning = false;
    if (btn) {
      btn.textContent = "▶ Resume Session";
      btn.style.background = "var(--accent)";
    }
    clearInterval(timerInterval);
  }
}

function resetTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  timerSeconds = 0;
  const display = document.getElementById('timer-display');
  if (display) display.textContent = "00:00:00";
  const btn = document.getElementById('timer-toggle-btn');
  if (btn) {
    btn.textContent = "▶ Start Session";
    btn.style.background = "var(--accent)";
  }
}
