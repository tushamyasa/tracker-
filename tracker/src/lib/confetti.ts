/** Короткие конфетти (до ~1.5 с). Не запускаются при prefers-reduced-motion. */
export async function fireConfetti() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 38,
    ticks: 90,
    origin: { y: 0.65 },
    disableForReducedMotion: true,
  });
}
