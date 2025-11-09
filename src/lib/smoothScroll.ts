const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

export const smoothScrollTo = (targetId: string) => {
  const element = document.getElementById(targetId);
  if (!element) return;

  const header = document.querySelector("header");
  const headerHeight = header?.offsetHeight || 0;
  const targetPosition = element.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  const duration = 600; // Faster, snappier scroll duration
  let startTime: number | null = null;
  let animationFrame: number;

  const animation = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeInOutQuart(progress);
    
    window.scrollTo(0, startPosition + distance * ease);

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animation);
    }
  };

  animationFrame = requestAnimationFrame(animation);

  // Cancel on user scroll
  const cancelScroll = () => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("wheel", cancelScroll);
    window.removeEventListener("touchmove", cancelScroll);
  };

  window.addEventListener("wheel", cancelScroll, { once: true });
  window.addEventListener("touchmove", cancelScroll, { once: true });
};
