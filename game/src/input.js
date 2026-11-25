// Mouse and keyboard input, read once per frame. Clicks are reported as canvas
// coordinates (the canvas is scaled to the window, so every click is mapped back
// to the 1280x720 field). Keys are reported as one-shot actions.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SERVE = 4;
export const ACTION_RESTART = 8;

export function createInput(canvas, fieldWidth, fieldHeight) {
  const clicks = [];
  let actions = 0;
  const keys = new Set();

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * fieldWidth,
      y: ((event.clientY - rect.top) / rect.height) * fieldHeight,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    clicks.push(toField(event));
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.key.toLowerCase());
    if (event.key === ' ' || event.key === 'Enter') actions |= ACTION_CONFIRM;
    if (event.key.toLowerCase() === 'p' || event.key === 'Escape') actions |= ACTION_PAUSE;
    if (event.key.toLowerCase() === 's') actions |= ACTION_SERVE;
    if (event.key.toLowerCase() === 'r') actions |= ACTION_RESTART;
  });

  return {
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** One-shot: true only on the frame the key was pressed. */
    takeKey(key) {
      if (!keys.has(key)) return false;
      keys.delete(key);
      return true;
    },
  };
}
