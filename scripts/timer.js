// Global variables so they’re accessible in both functions
window.secondsElapsed = 0; // Make it globally accessible
let timerInterval;

document.addEventListener('DOMContentLoaded', () => {
  console.log("Timer script loaded and running!");

  // Try to get the timer element
  let timerElement = document.getElementById('timer');
  if (!timerElement) {
    console.log("Timer element not found. Creating a new timer element.");
    timerElement = document.createElement('div');
    timerElement.id = 'timer';
    timerElement.className = 'timer';
    timerElement.textContent = '00:00'; // Initial timer value
    document.body.appendChild(timerElement);
  }

  // Set up a MutationObserver to watch if the timer is removed
  const observer = new MutationObserver((mutations) => {
    // If the timer element is no longer in the DOM, re-append it.
    if (!document.getElementById('timer')) {
      console.warn("Timer element was removed. Re-adding it to the body.");
      document.body.appendChild(timerElement);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Start the timer
  startTimer();
});

function ensureTimerExists() {
  let timerElement = document.getElementById('timer');
  if (!timerElement) {
      console.warn("Timer element missing. Re-adding it.");
      timerElement = document.createElement('div');
      timerElement.id = 'timer';
      timerElement.className = 'timer';
      timerElement.textContent = '00:00';
      document.body.appendChild(timerElement);
  }
  return timerElement;
}

function startTimer() {
  console.log("Starting timer...");
  const timerElement = ensureTimerExists();

  if (!timerElement) {
      console.error("Timer element still not found after creation.");
      return;
  }

  timerInterval = setInterval(() => {
      window.secondsElapsed++;
      const minutes = String(Math.floor(window.secondsElapsed / 60)).padStart(2, '0');
      const seconds = String(window.secondsElapsed % 60).padStart(2, '0');

      // Ensure the timer element exists before updating
      const timerElement = ensureTimerExists();
      timerElement.textContent = `${minutes}:${seconds}`;
      console.log(`Timer content updated to: ${timerElement.textContent}`);
  }, 1000);
}