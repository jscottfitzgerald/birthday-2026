/* ============================================
   Puzzle 1 - Countdown
   She must figure out WHAT this is counting down
   to, then type the exact date & time to unlock.
   ============================================ */

/* ---- EDIT ME ----
   Set the real target date & time this puzzle counts
   down to. Use 24-hour local time, format:
   "YYYY-MM-DDTHH:MM:00"
*/
const TARGET_DATETIME = "2026-10-24T10:30:00";

/* Accepted answer format shown to her: DD/MM/YYYY HH:MM (24-hour) */

const target = new Date(TARGET_DATETIME);

function updateCountdown() {
  const now = new Date();
  const diff = target - now;

  const els = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    minutes: document.getElementById("cd-minutes"),
    seconds: document.getElementById("cd-seconds"),
  };

  if (diff <= 0) {
    els.days.textContent = "00";
    els.hours.textContent = "00";
    els.minutes.textContent = "00";
    els.seconds.textContent = "00";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  els.days.textContent = String(days).padStart(2, "0");
  els.hours.textContent = String(hours).padStart(2, "0");
  els.minutes.textContent = String(minutes).padStart(2, "0");
  els.seconds.textContent = String(seconds).padStart(2, "0");
}

/**
 * Parses her typed answer "DD/MM/YYYY HH:MM" into a Date, or null if invalid.
 */
function parseAnswer(raw) {
  const match = raw
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hour, minute, 0);
  return parsed;
}

function checkAnswer(event) {
  event.preventDefault();
  const input = document.getElementById("answerInput");
  const feedback = document.getElementById("feedback");
  const unlockLink = document.getElementById("unlockLink");
  const form = document.getElementById("answerForm");

  const parsed = parseAnswer(input.value);

  if (!parsed) {
    showError(feedback, form, "Hmm, that doesn't look like DD/MM/YYYY HH:MM 🤔");
    return;
  }

  // Compare to the minute (ignore seconds)
  const matches =
    parsed.getFullYear() === target.getFullYear() &&
    parsed.getMonth() === target.getMonth() &&
    parsed.getDate() === target.getDate() &&
    parsed.getHours() === target.getHours() &&
    parsed.getMinutes() === target.getMinutes();

  if (matches) {
    feedback.textContent = "🎉 Correct! You unlocked the next clue!";
    feedback.className = "feedback success";
    markSolved("puzzle1");
    unlockLink.style.display = "inline-block";
    form.querySelector("button").disabled = true;
    input.disabled = true;
  } else {
    showError(feedback, form, "Not quite... keep thinking! 💭");
  }
}

function showError(feedback, form, message) {
  feedback.textContent = message;
  feedback.className = "feedback error";
  form.classList.remove("shake");
  // force reflow to restart animation
  void form.offsetWidth;
  form.classList.add("shake");
}

document.addEventListener("DOMContentLoaded", () => {
  spawnHearts();
  updateCountdown();
  setInterval(updateCountdown, 1000);

  const form = document.getElementById("answerForm");
  form.addEventListener("submit", checkAnswer);

  // If already solved previously, show the unlock link immediately
  if (isSolved("puzzle1")) {
    document.getElementById("feedback").textContent = "🎉 Already solved! You can go to the next clue.";
    document.getElementById("feedback").className = "feedback success";
    document.getElementById("unlockLink").style.display = "inline-block";
  }
});
