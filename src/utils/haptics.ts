export function haptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (!('vibrate' in navigator)) return;

  // iOS Safari PWA supports this via the Taptic Engine
  try {
    if (style === 'light') navigator.vibrate(10);
    else if (style === 'medium') navigator.vibrate(20);
    else if (style === 'heavy') navigator.vibrate(30);
    else if (style === 'success') navigator.vibrate([10, 50, 10]);
    else if (style === 'warning') navigator.vibrate([20, 40, 20]);
    else if (style === 'error') navigator.vibrate([30, 30, 30, 30, 30]);
  } catch {}
}