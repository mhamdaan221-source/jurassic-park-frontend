(() => {
  'use strict';
  const habitat = document.getElementById('pet-habitat');
  const pet = document.getElementById('dino-pet');
  const hint = document.getElementById('pet-hint');
  const pauseButton = document.getElementById('pet-pause');
  const wheelDetails = document.querySelector('.wheel-disclosure');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!habitat || !pet || !hint || !pauseButton) return;

  const captions = {
    hatching: 'Someone is ready to meet you…',
    idle: 'FERN / your little long-neck · tap to pet',
    walking: 'Tiny feet. Big adventure.',
    curious: 'Ooh… what is that?',
    happy: 'Fern likes you! ♥',
    sleeping: 'Growing dinosaurs need little naps…',
    stretching: 'A biiig stretch for a little dinosaur.'
  };
  let state = 'waiting';
  let x = 0;
  let target = 0;
  let deadline = 0;
  let lastFrame = 0;
  let frame = 0;
  let visible = false;
  let paused = false;
  let initialized = false;
  let lastCursorAction = 0;
  const limit = () => Math.max(0, habitat.clientWidth - pet.offsetWidth - 26);
  const clamp = value => Math.max(0, Math.min(limit(), value));
  const renderPosition = () => { pet.style.left = `${x.toFixed(1)}px`; };

  function setState(next, duration = 3500) {
    state = next;
    pet.dataset.state = next;
    hint.textContent = captions[next];
    deadline = performance.now() + duration;
  }

  function wander(destination) {
    target = clamp(destination);
    pet.style.setProperty('--pet-direction', target < x ? '-1' : '1');
    if (Math.abs(target - x) < 5) { setState('curious', 2000); return; }
    setState('walking', 12000);
  }

  function chooseAction() {
    const choice = Math.random();
    if (choice < .48) wander(Math.random() * limit());
    else if (choice < .69) setState('sleeping', 6000);
    else if (choice < .83) setState('stretching', 2300);
    else if (choice < .93) setState('curious', 3000);
    else setState('happy', 2200);
  }

  function tick(now) {
    frame = 0;
    if (!visible || paused || document.hidden || motionPreference.matches) return;
    const elapsed = Math.min((now - lastFrame) / 1000, .05);
    lastFrame = now;
    if (state === 'walking') {
      const distance = target - x;
      const step = 24 * elapsed;
      if (Math.abs(distance) <= step) { x = target; setState('idle', 1800); }
      else x += Math.sign(distance) * step;
      x = clamp(x);
      renderPosition();
    }
    if (now >= deadline) {
      if (state === 'hatching' || state === 'happy' || state === 'stretching') setState('idle', 2500);
      else if (state === 'sleeping') setState('stretching', 2300);
      else chooseAction();
    }
    frame = requestAnimationFrame(tick);
  }

  function syncActivity() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    const stopped = !visible || paused || document.hidden;
    habitat.classList.toggle('is-paused', stopped);
    if (stopped) return;
    if (!initialized) {
      initialized = true;
      x = clamp(limit() * .4);
      renderPosition();
      setState(motionPreference.matches ? 'idle' : 'hatching', 2900);
    }
    if (motionPreference.matches) {
      if (state === 'hatching' || state === 'walking') setState('idle');
      return;
    }
    lastFrame = performance.now();
    deadline = lastFrame + (state === 'hatching' ? 2900 : 2500);
    frame = requestAnimationFrame(tick);
  }

  pet.addEventListener('click', () => {
    if (state === 'hatching' || state === 'waiting') return;
    setState('happy', 2200);
  });

  // Track the cursor only in this card; never move the user's cursor or steal clicks.
  document.getElementById('wheel').addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || paused || motionPreference.matches || !visible) return;
    if (['hatching', 'waiting', 'happy'].includes(state)) return;
    const bounds = habitat.getBoundingClientRect();
    if (event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    const pointerX = event.clientX - bounds.left;
    if (pointerX < 0 || pointerX > bounds.width) return;
    const petCenter = x + pet.offsetWidth / 2;
    const now = performance.now();
    if (now - lastCursorAction < 1200) return;
    lastCursorAction = now;
    if (Math.abs(pointerX - petCenter) > 80) wander(pointerX - pet.offsetWidth / 2);
    else if (state !== 'walking') setState('curious', 2400);
  });

  pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Resume dinosaur animations' : 'Pause dinosaur animations');
    pauseButton.textContent = paused ? '▶' : 'Ⅱ';
    syncActivity();
  });
  wheelDetails.addEventListener('toggle', () => {
    if (wheelDetails.open && initialized && !paused && state !== 'hatching') setState('happy', 2200);
  });
  document.addEventListener('visibilitychange', syncActivity);
  motionPreference.addEventListener('change', syncActivity);
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { x = clamp(x); target = clamp(target); renderPosition(); }).observe(habitat);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncActivity();
    }, { threshold: .15 }).observe(habitat);
  } else { visible = true; syncActivity(); }
})();
