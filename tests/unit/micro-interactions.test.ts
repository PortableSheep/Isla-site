/**
 * Micro-interactions test suite
 *
 * Tests to verify:
 * - Animation functions work correctly
 * - Motion preferences are respected
 * - Animation classes are applied/removed properly
 * - No console errors or memory leaks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAnimationDuration,
  respectMotionPreference,
  getAnimationClass,
  triggerCelebration,
  animateNotification,
  addBoundingBox,
  handleLoadingState,
  triggerErrorReaction,
  triggerApprovalCelebration,
  triggerButtonHover,
  removeButtonHover,
  triggerInputFocus,
  removeInputFocus,
  triggerEmptyStateAnimation,
  triggerBadgePulse,
  triggerPageTransition,
  cleanPageTransition,
  triggerModalTransition,
  triggerScrollFeedback,
  triggerHapticFeedback,
  triggerProgressAnimation,
  triggerCreatureBlink,
  triggerConfettiEffect,
  triggerCreatureNotification,
  triggerBreathingAnimation,
  playNotificationSound,
  disableAnimations,
  enableAnimations,
  getElementAnimationDuration,
  waitForAnimationComplete,
  batchAnimations,
  ANIMATION_DURATIONS
} from '@/lib/micro-interactions';

describe('Micro-interactions', () => {
  let mockElement: HTMLElement;
  let mockWindow: { matchMedia: (query: string) => { matches: boolean } };

  beforeEach(() => {
    // Create mock element
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);

    // Mock window.matchMedia
    mockWindow = {
      matchMedia: vi.fn().mockReturnValue({
        matches: false
      })
    };
    global.window.matchMedia = mockWindow.matchMedia as any;
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(mockElement);
    vi.clearAllMocks();
  });

  describe('Animation Durations', () => {
    it('should return correct duration presets', () => {
      expect(getAnimationDuration('quick')).toBe(200);
      expect(getAnimationDuration('normal')).toBe(600);
      expect(getAnimationDuration('slow')).toBe(2000);
    });

    it('should have ANIMATION_DURATIONS constant', () => {
      expect(ANIMATION_DURATIONS.quick).toBe(200);
      expect(ANIMATION_DURATIONS.normal).toBe(600);
      expect(ANIMATION_DURATIONS.slow).toBe(2000);
    });
  });

  describe('Motion Preference', () => {
    it('should detect when prefers-reduced-motion is enabled', () => {
      (mockWindow.matchMedia as unknown as { mockReturnValue: (obj: { matches: boolean }) => void }).mockReturnValue({
        matches: true
      });

      expect(respectMotionPreference()).toBe(true);
    });

    it('should return false when prefers-reduced-motion is disabled', () => {
      (mockWindow.matchMedia as any).mockReturnValue({
        matches: false
      });

      expect(respectMotionPreference()).toBe(false);
    });

    it('should get correct animation class based on motion preference', () => {
      (mockWindow.matchMedia as any).mockReturnValue({
        matches: false
      });

      expect(getAnimationClass('my-animation', 'my-animation-reduced')).toBe(
        'my-animation'
      );

      (mockWindow.matchMedia as any).mockReturnValue({
        matches: true
      });

      expect(getAnimationClass('my-animation', 'my-animation-reduced')).toBe(
        'my-animation-reduced'
      );
    });
  });

  describe('Celebration Animations', () => {
    it('should trigger celebration animation', () => {
      triggerCelebration(mockElement, 'cheery');

      expect(mockElement.classList.contains('celebration-active')).toBe(true);
    });

    it('should remove celebration animation after timeout', (done) => {
      triggerCelebration(mockElement, 'cheery');
      expect(mockElement.classList.contains('celebration-active')).toBe(true);

      setTimeout(() => {
        expect(mockElement.classList.contains('celebration-active')).toBe(
          false
        );
        done();
      }, 2100);
    });

    it('should apply reduced animation when motion preference is enabled', () => {
      (mockWindow.matchMedia as any).mockReturnValue({
        matches: true
      });

      triggerCelebration(mockElement, 'cheery');

      expect(mockElement.classList.contains('celebration-reduced')).toBe(true);
    });
  });

  describe('Notification Animations', () => {
    it('should animate notification pop-in', () => {
      animateNotification(mockElement);

      expect(mockElement.classList.contains('notification-slide-in')).toBe(
        true
      );
    });

    it('should trigger creature notification', (done) => {
      triggerCreatureNotification(mockElement, 'zing', 500);

      expect(mockElement.classList.contains('notification-appear')).toBe(true);

      setTimeout(() => {
        expect(mockElement.classList.contains('notification-appear')).toBe(
          false
        );
        done();
      }, 600);
    });

    it('should trigger badge pulse', () => {
      triggerBadgePulse(mockElement, true);

      expect(mockElement.classList.contains('badge-pulse')).toBe(true);
    });

    it('should remove badge pulse', () => {
      mockElement.classList.add('badge-pulse');
      triggerBadgePulse(mockElement, false);

      expect(mockElement.classList.contains('badge-pulse')).toBe(false);
    });
  });

  describe('Bounce Animations', () => {
    it('should add bounce animation', () => {
      addBoundingBox(mockElement, 'creatures');

      expect(mockElement.classList.contains('bounce-once')).toBe(true);
    });

    it('should apply reduced animation when motion preference is enabled', () => {
      (mockWindow.matchMedia as any).mockReturnValue({
        matches: true
      });

      addBoundingBox(mockElement, 'creatures');

      expect(mockElement.classList.contains('bounce-reduced')).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should add loading skeleton animation', () => {
      handleLoadingState(mockElement, true);

      expect(mockElement.classList.contains('loading-skeleton')).toBe(true);
    });

    it('should remove loading skeleton animation', () => {
      mockElement.classList.add('loading-skeleton');
      handleLoadingState(mockElement, false);

      expect(mockElement.classList.contains('loading-skeleton')).toBe(false);
    });

    it('should trigger breathing animation', () => {
      const removeAnimation = triggerBreathingAnimation(mockElement);

      expect(mockElement.classList.contains('breathing-animation')).toBe(true);
      expect(typeof removeAnimation).toBe('function');

      removeAnimation();
      expect(mockElement.classList.contains('breathing-animation')).toBe(false);
    });
  });

  describe('Error Animations', () => {
    it('should trigger error shake animation', () => {
      triggerErrorReaction(mockElement);

      expect(mockElement.classList.contains('error-shake')).toBe(true);
    });

    it('should remove error animation after timeout', (done) => {
      triggerErrorReaction(mockElement);
      expect(mockElement.classList.contains('error-shake')).toBe(true);

      setTimeout(() => {
        expect(mockElement.classList.contains('error-shake')).toBe(false);
        done();
      }, 900);
    });
  });

  describe('Approval Celebrations', () => {
    it('should trigger approval celebration for child', () => {
      triggerApprovalCelebration(mockElement, false);

      expect(mockElement.classList.contains('approval-dance')).toBe(true);
    });

    it('should trigger approval celebration for parent', () => {
      triggerApprovalCelebration(mockElement, true);

      expect(mockElement.classList.contains('approval-dance-parent')).toBe(
        true
      );
    });

    it('should remove approval animation after timeout', (done) => {
      triggerApprovalCelebration(mockElement, false);
      expect(mockElement.classList.contains('approval-dance')).toBe(true);

      setTimeout(() => {
        expect(mockElement.classList.contains('approval-dance')).toBe(false);
        done();
      }, 3100);
    });
  });

  describe('Button Hover Effects', () => {
    it('should trigger button hover', () => {
      triggerButtonHover(mockElement);

      expect(mockElement.classList.contains('button-hover-scale')).toBe(true);
    });

    it('should remove button hover', () => {
      mockElement.classList.add('button-hover-scale');
      removeButtonHover(mockElement);

      expect(mockElement.classList.contains('button-hover-scale')).toBe(false);
    });
  });

  describe('Input Focus Effects', () => {
    it('should trigger input focus glow', () => {
      triggerInputFocus(mockElement);

      expect(mockElement.classList.contains('input-focus-glow')).toBe(true);
    });

    it('should trigger creature pop with input focus', () => {
      const creatureEl = document.createElement('div');
      triggerInputFocus(mockElement, creatureEl);

      expect(mockElement.classList.contains('input-focus-glow')).toBe(true);
      expect(creatureEl.classList.contains('creature-pop')).toBe(true);

      creatureEl.remove();
    });

    it('should remove input focus effects', () => {
      const creatureEl = document.createElement('div');
      mockElement.classList.add('input-focus-glow');
      creatureEl.classList.add('creature-pop');

      removeInputFocus(mockElement, creatureEl);

      expect(mockElement.classList.contains('input-focus-glow')).toBe(false);
      expect(creatureEl.classList.contains('creature-pop')).toBe(false);

      creatureEl.remove();
    });
  });

  describe('Empty State Animation', () => {
    it('should trigger empty state wake animation', () => {
      triggerEmptyStateAnimation(mockElement, true);

      expect(mockElement.classList.contains('empty-state-wake')).toBe(true);
    });

    it('should remove empty state animation', () => {
      mockElement.classList.add('empty-state-wake');
      triggerEmptyStateAnimation(mockElement, false);

      expect(mockElement.classList.contains('empty-state-wake')).toBe(false);
    });
  });

  describe('Page Transitions', () => {
    it('should trigger page transition in', () => {
      triggerPageTransition(mockElement, 'in');

      expect(mockElement.classList.contains('page-transition-in')).toBe(true);
    });

    it('should trigger page transition out', () => {
      triggerPageTransition(mockElement, 'out');

      expect(mockElement.classList.contains('page-transition-out')).toBe(true);
    });

    it('should clean page transition', () => {
      mockElement.classList.add('page-transition-in');
      cleanPageTransition(mockElement);

      expect(mockElement.classList.contains('page-transition-in')).toBe(false);
    });
  });

  describe('Modal Transitions', () => {
    it('should trigger modal fade in on desktop', () => {
      triggerModalTransition(mockElement, true, false);

      expect(mockElement.classList.contains('modal-fade-in')).toBe(true);
    });

    it('should trigger modal slide up on mobile', () => {
      triggerModalTransition(mockElement, true, true);

      expect(mockElement.classList.contains('modal-slide-up')).toBe(true);
    });

    it('should trigger modal fade out on desktop', () => {
      triggerModalTransition(mockElement, false, false);

      expect(mockElement.classList.contains('modal-fade-out')).toBe(true);
    });

    it('should trigger modal slide down on mobile', () => {
      triggerModalTransition(mockElement, false, true);

      expect(mockElement.classList.contains('modal-slide-down')).toBe(true);
    });
  });

  describe('Scroll Feedback', () => {
    it('should trigger scroll feedback up', () => {
      triggerScrollFeedback(mockElement, 'up');

      expect(mockElement.classList.contains('scroll-feedback-up')).toBe(true);
    });

    it('should trigger scroll feedback down', () => {
      triggerScrollFeedback(mockElement, 'down');

      expect(mockElement.classList.contains('scroll-feedback-down')).toBe(true);
    });

    it('should trigger scroll feedback left', () => {
      triggerScrollFeedback(mockElement, 'left');

      expect(mockElement.classList.contains('scroll-feedback-left')).toBe(true);
    });

    it('should trigger scroll feedback right', () => {
      triggerScrollFeedback(mockElement, 'right');

      expect(mockElement.classList.contains('scroll-feedback-right')).toBe(true);
    });

    it('should remove scroll feedback animation after timeout', (done) => {
      triggerScrollFeedback(mockElement, 'up');
      expect(mockElement.classList.contains('scroll-feedback-up')).toBe(true);

      setTimeout(() => {
        expect(mockElement.classList.contains('scroll-feedback-up')).toBe(
          false
        );
        done();
      }, 400);
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback', () => {
      // Mock navigator.vibrate
      const vibrateSpy = vi.fn();
      (navigator as any).vibrate = vibrateSpy;

      triggerHapticFeedback('light');
      expect(vibrateSpy).toHaveBeenCalledWith(10);

      triggerHapticFeedback('medium');
      expect(vibrateSpy).toHaveBeenCalledWith(20);

      triggerHapticFeedback('heavy');
      expect(vibrateSpy).toHaveBeenCalledWith([50, 10, 50]);

      vibrateSpy.mockRestore();
    });
  });

  describe('Progress Animation', () => {
    it('should trigger progress animation', () => {
      triggerProgressAnimation(mockElement, 1, 3);

      expect(mockElement.classList.contains('progress-step')).toBe(true);
      expect(mockElement.getAttribute('data-progress-step')).toBe('1');
      expect(mockElement.getAttribute('data-progress-total')).toBe('3');
    });
  });

  describe('Creature Blink', () => {
    it('should create blink interval', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const removeFn = triggerCreatureBlink(mockElement, 3000);

      expect(mockElement.classList.contains('creature-blink')).toBe(true);

      removeFn();
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe('Confetti Effect', () => {
    it('should create confetti particles', () => {
      triggerConfettiEffect(mockElement, 5);

      const particles = mockElement.querySelectorAll('.confetti-particle');
      expect(particles.length).toBe(5);

      // Clean up
      particles.forEach((p) => p.remove());
    });

    it('should remove confetti particles after animation', (done) => {
      triggerConfettiEffect(mockElement, 2);

      setTimeout(() => {
        const particles = mockElement.querySelectorAll('.confetti-particle');
        expect(particles.length).toBe(0);
        done();
      }, 2500);
    });
  });

  describe('Animation Utilities', () => {
    it('should disable animations globally', () => {
      disableAnimations();

      const style = document.getElementById('disable-animations');
      expect(style).toBeTruthy();
      expect(style?.innerHTML).toContain('animation: none');

      // Clean up
      style?.remove();
    });

    it('should enable animations after being disabled', () => {
      disableAnimations();
      enableAnimations();

      const style = document.getElementById('disable-animations');
      expect(style).toBeFalsy();
    });

    it('should get element animation duration', () => {
      mockElement.style.animationDuration = '600ms';
      const duration = getElementAnimationDuration(mockElement);

      expect(duration).toBeGreaterThan(0);
    });

    it('should wait for animation complete', async () => {
      mockElement.style.animationDuration = '100ms';

      const promise = waitForAnimationComplete(mockElement);
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should batch animations', () => {
      const op1 = vi.fn();
      const op2 = vi.fn();
      const op3 = vi.fn();

      batchAnimations([op1, op2, op3]);

      // Operations should be called within requestAnimationFrame
      expect(op1).toHaveBeenCalled();
      expect(op2).toHaveBeenCalled();
      expect(op3).toHaveBeenCalled();
    });
  });

  describe('Notification Sound', () => {
    it('should play notification sound', async () => {
      // Set up localStorage mock
      localStorage.setItem('audio-notifications-enabled', 'true');

      // Mock AudioContext
      const mockOscillator = {
        connect: vi.fn(),
        frequency: { value: 0 },
        type: '',
        start: vi.fn(),
        stop: vi.fn()
      };

      const mockGainNode = {
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        }
      };

      const mockAudioContext = {
        createOscillator: vi.fn().mockReturnValue(mockOscillator),
        createGain: vi.fn().mockReturnValue(mockGainNode),
        destination: {},
        currentTime: 0
      };

      (window as any).AudioContext = vi.fn().mockReturnValue(mockAudioContext);

      await playNotificationSound('success');

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();

      localStorage.removeItem('audio-notifications-enabled');
    });
  });
});
