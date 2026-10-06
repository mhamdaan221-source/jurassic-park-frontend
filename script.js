// Frontend preview state. Replace with backend competition timestamps and status.
// Team names and IDs are separate values; use the authenticated team here later.
const previewTeam = { name: 'Umbrella', id: '08' };
document.querySelectorAll('[data-team-name]').forEach(node => {
  node.textContent = previewTeam.name.toUpperCase();
});
document.querySelectorAll('[data-team-id]').forEach(node => {
  node.textContent = previewTeam.id;
});
const minutes = document.getElementById('minutes');
const seconds = document.getElementById('seconds');
const timer = document.getElementById('timer');
const timerProgress = document.getElementById('timer-progress');
const buzzer = document.getElementById('buzzer');
const buzzerText = document.getElementById('buzzer-text');
const buzzerHelp = document.getElementById('buzzer-help');
const previewDuration = 18 * 60 + 42;
const previewEndsAt = Date.now() + previewDuration * 1000;

function renderTimer() {
  const remaining = Math.max(0, Math.ceil((previewEndsAt - Date.now()) / 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  minutes.textContent = mm;
  seconds.textContent = ss;
  timer.setAttribute('aria-label', `${mm} minutes ${ss} seconds remaining`);
  timerProgress.style.width = `${(remaining / previewDuration) * 100}%`;
  if (remaining === 0) {
    buzzer.disabled = true;
    buzzerText.textContent = 'TIME EXPIRED';
    buzzerHelp.textContent = 'Preview timer ended';
  }
}

renderTimer();
setInterval(renderTimer, 1000);

let buzzerFeedbackTimeout;
buzzer.addEventListener('click', () => {
  if (buzzer.disabled) return;
  window.clearTimeout(buzzerFeedbackTimeout);
  buzzer.classList.add('is-pressed');
  buzzerFeedbackTimeout = window.setTimeout(() => {
    buzzer.classList.remove('is-pressed');
  }, 650);
  buzzerHelp.textContent = 'Backend unavailable. No verification request was created.';
});

const wheel = document.querySelector('.challenge-wheel');
const wheelWrap = document.querySelector('.wheel-wrap');
const spinButton = document.getElementById('spin-wheel');
const spinButtonText = document.getElementById('spin-wheel-text');
const spinResult = document.getElementById('spin-result');
let wheelRotation = 0;
let wheelSpinning = false;
const wheelOptions = ['QUESTION 1', 'QUESTION 2', 'QUESTION 3'];

spinButton.addEventListener('click', () => {
  if (wheelSpinning) return;
  wheelSpinning = true;
  spinButton.disabled = true;
  spinButtonText.textContent = 'SPINNING...';
  spinResult.textContent = 'The wheel is spinning…';
  wheelWrap.classList.add('spinning');
  wheel.classList.add('is-spinning');

  // Randomize the visual demo only; the real competition state is unchanged.
  const selectedIndex = Math.floor(Math.random() * wheelOptions.length);
  const segmentSize = 360 / wheelOptions.length;
  const targetAngle = (360 - (selectedIndex + 0.5) * segmentSize) % 360;
  const currentAngle = ((wheelRotation % 360) + 360) % 360;
  const alignment = (targetAngle - currentAngle + 360) % 360;
  wheelRotation += 6 * 360 + alignment;
  requestAnimationFrame(() => {
    wheel.style.transform = `rotate(${wheelRotation}deg)`;
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.setTimeout(() => {
    wheelSpinning = false;
    spinButton.disabled = false;
    spinButtonText.textContent = 'SPIN AGAIN';
    spinResult.textContent = `PREVIEW: ${wheelOptions[selectedIndex]}`;
    wheelWrap.classList.remove('spinning');
  }, reducedMotion ? 50 : 4300);
});
