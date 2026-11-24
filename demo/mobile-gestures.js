(() => {
  let lastY = 0;
  // Safari gesture events supplement the viewport hint. Some browsers retain
  // zoom deliberately as an accessibility setting and may ignore these hints.
  for (const type of ['gesturestart', 'gesturechange']) {
    document.addEventListener(type, event => event.preventDefault(), { passive:false });
  }
  document.addEventListener('touchstart', event => {
    if (event.touches.length === 1) lastY = event.touches[0].clientY;
  }, { passive:true });
  document.addEventListener('touchmove', event => {
    if (event.touches.length > 1) { event.preventDefault(); return; }
    if (event.touches.length !== 1) return;
    const y = event.touches[0].clientY, delta = y - lastY;
    lastY = y;
    const dialog = document.querySelector('dialog[open]');
    if (dialog) {
      if (!dialog.contains(event.target)) { event.preventDefault(); return; }
      // Allow normal scrolling inside the modal, but absorb outward movement
      // at either boundary so it cannot become a browser refresh gesture.
      let canScroll = false;
      for (let el = event.target; el; el = el.parentElement) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) {
          if ((delta > 0 && el.scrollTop > 0) ||
              (delta < 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) canScroll = true;
        }
        if (el === dialog) break;
      }
      if (!canScroll && delta !== 0) event.preventDefault();
    }
  }, { passive:false });
})();
