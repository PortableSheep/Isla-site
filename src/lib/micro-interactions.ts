/**
 * Micro-interactions and animation utilities for Isla's creature-themed UI.
 *
 * Provides functions for triggering context-aware animations, managing
 * animation states, and respecting user preferences (prefers-reduced-motion).
 */

/**
 * Animation duration presets in milliseconds
 */
export const ANIMATION_DURATIONS = {
  quick: 200,
  normal: 600,
  slow: 2000
} as const;

/**
 * Get animation duration based on type
 */
export function getAnimationDuration(
  type: 'quick' | 'normal' | 'slow'
): number {
  return ANIMATION_DURATIONS[type];
}

/**
 * Check if user prefers reduced motion
 */
export function respectMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation class name based on motion preference
 */
export function getAnimationClass(
  animationClass: string,
  reducedMotionClass?: string
): string {
  return respectMotionPreference() && reducedMotionClass
    ? reducedMotionClass
    : animationClass;
}

/**
 * Trigger celebration animation when post is created
 */
export function triggerCelebration(
  element: HTMLElement,
  creatureId: string
): void {
  if (respectMotionPreference()) {
    element.classList.add('celebration-reduced');
    return;
  }

  element.classList.remove(
    'celebration-start',
    'celebration-reduced',
    'celebration-active'
  );

  // Force reflow to restart animation
  void element.offsetWidth;

  element.classList.add('celebration-active');

  // Auto-remove animation class after 2 seconds (main celebration)
  setTimeout(() => {
    element.classList.remove('celebration-active');
  }, 2000);
}

/**
 * Animate notification pop-in from right
 */
export function animateNotification(notification: HTMLElement): void {
  if (respectMotionPreference()) {
    notification.classList.add('notification-reduced');
    return;
  }

  notification.classList.remove(
    'notification-slide-in',
    'notification-reduced'
  );

  // Force reflow
  void notification.offsetWidth;

  notification.classList.add('notification-slide-in');
}

/**
 * Add bounding box animation for creature hover
 */
export function addBoundingBox(
  element: HTMLElement,
  creatureId: string
): void {
  if (respectMotionPreference()) {
    element.classList.add('bounce-reduced');
    return;
  }

  element.classList.remove('bounce-once', 'bounce-reduced');

  // Force reflow
  void element.offsetWidth;

  element.classList.add('bounce-once');
}

/**
 * Handle loading state animation
 */
export function handleLoadingState(
  container: HTMLElement,
  show: boolean
): void {
  if (show) {
    if (respectMotionPreference()) {
      container.classList.add('loading-reduced');
      return;
    }

    container.classList.remove('loading-skeleton', 'loading-reduced');

    // Force reflow
    void container.offsetWidth;

    container.classList.add('loading-skeleton');
  } else {
    container.classList.remove('loading-skeleton', 'loading-reduced');
  }
}

/**
 * Animate error state with shake and confusion
 */
export function triggerErrorReaction(element: HTMLElement): void {
  if (respectMotionPreference()) {
    element.classList.add('error-shake-reduced');
    return;
  }

  element.classList.remove('error-shake', 'error-shake-reduced');

  // Force reflow
  void element.offsetWidth;

  element.classList.add('error-shake');

  // Auto-remove after shake completes (800ms)
  setTimeout(() => {
    element.classList.remove('error-shake');
  }, 800);
}

/**
 * Trigger approval celebration with multiple creatures
 */
export function triggerApprovalCelebration(
  element: HTMLElement,
  isParentView: boolean = false
): void {
  if (respectMotionPreference()) {
    element.classList.add('approval-reduced');
    return;
  }

  element.classList.remove('approval-dance', 'approval-reduced');

  // Force reflow
  void element.offsetWidth;

  const animationClass = isParentView
    ? 'approval-dance-parent'
    : 'approval-dance';

  element.classList.add(animationClass);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, 3000);
}

/**
 * Trigger button hover effect (grow and color change)
 */
export function triggerButtonHover(element: HTMLElement): void {
  if (respectMotionPreference()) {
    element.style.transform = 'scale(1.05)';
    return;
  }

  element.classList.add('button-hover-scale');
}

/**
 * Remove button hover effect
 */
export function removeButtonHover(element: HTMLElement): void {
  element.classList.remove('button-hover-scale');
  element.style.transform = '';
}

/**
 * Animate form input focus with glow and creature pop
 */
export function triggerInputFocus(
  input: HTMLElement,
  creatureElement?: HTMLElement
): void {
  if (respectMotionPreference()) {
    input.classList.add('input-focus-reduced');
    if (creatureElement) {
      creatureElement.classList.add('creature-pop-reduced');
    }
    return;
  }

  input.classList.remove('input-focus-glow', 'input-focus-reduced');
  void input.offsetWidth;
  input.classList.add('input-focus-glow');

  if (creatureElement) {
    creatureElement.classList.remove('creature-pop', 'creature-pop-reduced');
    void creatureElement.offsetWidth;
    creatureElement.classList.add('creature-pop');
  }
}

/**
 * Remove input focus animation
 */
export function removeInputFocus(
  input: HTMLElement,
  creatureElement?: HTMLElement
): void {
  input.classList.remove('input-focus-glow', 'input-focus-reduced');

  if (creatureElement) {
    creatureElement.classList.remove('creature-pop', 'creature-pop-reduced');
  }
}

/**
 * Animate empty state (creature wakes and waves)
 */
export function triggerEmptyStateAnimation(
  element: HTMLElement,
  show: boolean
): void {
  if (show) {
    if (respectMotionPreference()) {
      element.classList.add('empty-state-reduced');
      return;
    }

    element.classList.remove('empty-state-wake', 'empty-state-reduced');
    void element.offsetWidth;
    element.classList.add('empty-state-wake');
  } else {
    element.classList.remove('empty-state-wake', 'empty-state-reduced');
  }
}

/**
 * Animate notification badge pulse
 */
export function triggerBadgePulse(badge: HTMLElement, show: boolean): void {
  if (show) {
    if (respectMotionPreference()) {
      badge.classList.add('badge-pulse-reduced');
      return;
    }

    badge.classList.remove('badge-pulse', 'badge-pulse-reduced');
    void badge.offsetWidth;
    badge.classList.add('badge-pulse');
  } else {
    badge.classList.remove('badge-pulse', 'badge-pulse-reduced');
  }
}

/**
 * Animate page transition (fade in/out with creature wave)
 */
export function triggerPageTransition(
  element: HTMLElement,
  direction: 'in' | 'out' = 'in'
): void {
  if (respectMotionPreference()) {
    element.classList.add(
      direction === 'in'
        ? 'page-transition-in-reduced'
        : 'page-transition-out-reduced'
    );
    return;
  }

  const animationClass =
    direction === 'in' ? 'page-transition-in' : 'page-transition-out';

  element.classList.remove(
    'page-transition-in',
    'page-transition-out',
    'page-transition-in-reduced',
    'page-transition-out-reduced'
  );

  void element.offsetWidth;
  element.classList.add(animationClass);
}

/**
 * Clean page transition animation
 */
export function cleanPageTransition(element: HTMLElement): void {
  element.classList.remove(
    'page-transition-in',
    'page-transition-out',
    'page-transition-in-reduced',
    'page-transition-out-reduced'
  );
}

/**
 * Animate modal open/close
 */
export function triggerModalTransition(
  modal: HTMLElement,
  isOpen: boolean,
  isMobile: boolean = false
): void {
  if (respectMotionPreference()) {
    modal.classList.add(
      isOpen ? 'modal-open-reduced' : 'modal-close-reduced'
    );
    return;
  }

  const openClass = isMobile ? 'modal-slide-up' : 'modal-fade-in';
  const closeClass = isMobile ? 'modal-slide-down' : 'modal-fade-out';

  modal.classList.remove(
    'modal-slide-up',
    'modal-slide-down',
    'modal-fade-in',
    'modal-fade-out',
    'modal-open-reduced',
    'modal-close-reduced'
  );

  void modal.offsetWidth;

  modal.classList.add(isOpen ? openClass : closeClass);
}

/**
 * Trigger scroll/swipe feedback
 */
export function triggerScrollFeedback(
  element: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right'
): void {
  if (respectMotionPreference()) {
    element.classList.add('scroll-feedback-reduced');
    return;
  }

  const animationClass = `scroll-feedback-${direction}`;

  element.classList.remove(
    'scroll-feedback-up',
    'scroll-feedback-down',
    'scroll-feedback-left',
    'scroll-feedback-right',
    'scroll-feedback-reduced'
  );

  void element.offsetWidth;
  element.classList.add(animationClass);

  // Auto-remove after animation
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, 300);
}

/**
 * Provide haptic feedback on mobile if available
 */
export function triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (!('vibrate' in navigator)) return;

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: [50, 10, 50]
  };

  try {
    navigator.vibrate(patterns[intensity]);
  } catch {
    // Haptic not supported on this device
  }
}

/**
 * Trigger progress animation with creature states
 */
export function triggerProgressAnimation(
  element: HTMLElement,
  step: number,
  totalSteps: number
): void {
  if (respectMotionPreference()) {
    element.classList.add('progress-reduced');
    return;
  }

  element.classList.remove('progress-step', 'progress-reduced');

  void element.offsetWidth;

  // Apply data attribute for step styling
  element.setAttribute('data-progress-step', String(step));
  element.setAttribute('data-progress-total', String(totalSteps));

  element.classList.add('progress-step');
}

/**
 * Blink animation trigger for creature eyes
 */
export function triggerCreatureBlink(
  element: HTMLElement,
  interval: number = 3000
): () => void {
  if (respectMotionPreference()) {
    return () => {};
  }

  const performBlink = () => {
    element.classList.remove('creature-blink');
    void element.offsetWidth;
    element.classList.add('creature-blink');
  };

  const blinkInterval = setInterval(performBlink, interval);

  return () => clearInterval(blinkInterval);
}

/**
 * Confetti effect simulation (scales and fades particles)
 */
export function triggerConfettiEffect(
  container: HTMLElement,
  particleCount: number = 10
): void {
  if (respectMotionPreference()) {
    return;
  }

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';

    // Random position
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const duration = 0.8 + Math.random() * 0.4;
    const delay = Math.random() * 0.2;

    particle.style.left = `${startX}%`;
    particle.style.top = `${startY}%`;
    particle.style.setProperty('--duration', `${duration}s`);
    particle.style.setProperty('--delay', `${delay}s`);

    container.appendChild(particle);

    // Remove particle after animation
    setTimeout(() => {
      particle.remove();
    }, (duration + delay) * 1000);
  }
}

/**
 * Trigger creature notification appearance
 */
export function triggerCreatureNotification(
  element: HTMLElement,
  creatureId: string,
  duration: number = 5000
): void {
  if (respectMotionPreference()) {
    element.classList.add('notification-reduced');
    return;
  }

  element.classList.remove('notification-appear', 'notification-reduced');

  void element.offsetWidth;

  element.classList.add('notification-appear');

  // Auto-dismiss
  setTimeout(() => {
    element.classList.remove('notification-appear');
  }, duration);
}

/**
 * Trigger loading skeleton breathing animation
 */
export function triggerBreathingAnimation(element: HTMLElement): () => void {
  if (respectMotionPreference()) {
    return () => {};
  }

  element.classList.remove('breathing-animation');
  void element.offsetWidth;
  element.classList.add('breathing-animation');

  return () => {
    element.classList.remove('breathing-animation');
  };
}

/**
 * Trigger sound notification (accessible, user-controlled)
 */
export async function playNotificationSound(type: 'success' | 'error' | 'notification' = 'notification'): Promise<void> {
  // Check if user has audio notifications enabled
  if (typeof localStorage === 'undefined') return;

  const soundsEnabled = localStorage.getItem('audio-notifications-enabled') !== 'false';
  if (!soundsEnabled) return;

  try {
    // Use Web Audio API to generate simple beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different tones for different notification types
    const frequencies: Record<typeof type, number> = {
      success: 800,
      error: 300,
      notification: 600
    };

    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch {
    // Audio context not available, silently fail
  }
}

/**
 * Disable all animations globally (useful for testing)
 */
export function disableAnimations(): void {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.id = 'disable-animations';
  style.innerHTML = `
    * {
      animation: none !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Enable animations after being disabled
 */
export function enableAnimations(): void {
  if (typeof document === 'undefined') return;

  const style = document.getElementById('disable-animations');
  if (style) {
    style.remove();
  }
}

/**
 * Get computed animation duration for an element
 */
export function getElementAnimationDuration(element: HTMLElement): number {
  const computed = window.getComputedStyle(element);
  const duration = computed.animationDuration;

  if (!duration || duration === '0s') return 0;

  const match = duration.match(/(\d+\.?\d*)([ms]+)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return unit === 'ms' ? value : value * 1000;
}

/**
 * Wait for animation to complete
 */
export function waitForAnimationComplete(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const duration = getElementAnimationDuration(element);

    if (duration === 0) {
      resolve();
      return;
    }

    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };

    element.addEventListener('animationend', handleAnimationEnd);

    // Fallback timeout
    setTimeout(() => {
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    }, duration + 100);
  });
}

/**
 * Batch animation operations to prevent layout thrashing
 */
export function batchAnimations(operations: Array<() => void>): void {
  requestAnimationFrame(() => {
    operations.forEach((op) => op());
  });
}
