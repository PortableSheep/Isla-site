/**
 * Accessibility utilities for Isla.site
 * 
 * This module provides helpers for:
 * - Keyboard navigation management
 * - Screen reader announcements
 * - Motion preference detection
 * - Focus management
 */

'use client';

import React from 'react';

/**
 * Check if user prefers reduced motion
 * Respects prefers-reduced-motion media query
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Set up listener for motion preference changes
 */
export function onMotionPreferenceChange(
  callback: (prefersReduced: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches);

  mediaQuery.addEventListener('change', handler);

  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Announce message to screen readers using aria-live
 * 
 * @param message - The message to announce
 * @param priority - 'polite' for non-urgent, 'assertive' for urgent
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof window === 'undefined') return;

  // Create or reuse announcement element
  let announcement = document.getElementById('a11y-announcement');
  if (!announcement) {
    announcement = document.createElement('div');
    announcement.id = 'a11y-announcement';
    announcement.className = 'sr-only';
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    document.body.appendChild(announcement);
  }

  // Update the announcement
  announcement.setAttribute('aria-live', priority);
  announcement.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    announcement!.textContent = '';
  }, 1000);
}

/**
 * Manage focus trap for modals/dialogs
 * 
 * @param element - The container to trap focus in
 * @param initialFocus - Element to focus initially
 * @returns Function to release the trap
 */
export function trapFocus(
  element: HTMLElement,
  initialFocus?: HTMLElement
): () => void {
  if (typeof window === 'undefined') return () => {};

  const previouslyFocused = document.activeElement as HTMLElement;
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;

  const firstFocusable = initialFocus || focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (firstFocusable) {
    firstFocusable.focus();
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift+Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
  };
}

/**
 * Check if element is visible (not display:none or visibility:hidden)
 */
export function isElementVisible(element: HTMLElement): boolean {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  );
}

/**
 * Check keyboard event for specific keys
 */
export const KeyboardShortcuts = {
  isEscape: (event: KeyboardEvent) => event.key === 'Escape',
  isEnter: (event: KeyboardEvent) =>
    event.key === 'Enter' || event.code === 'Space',
  isArrowUp: (event: KeyboardEvent) => event.key === 'ArrowUp',
  isArrowDown: (event: KeyboardEvent) => event.key === 'ArrowDown',
  isArrowLeft: (event: KeyboardEvent) => event.key === 'ArrowLeft',
  isArrowRight: (event: KeyboardEvent) => event.key === 'ArrowRight',
  isTab: (event: KeyboardEvent) => event.key === 'Tab',
};

/**
 * Get skip-to-main link for bypassing navigation
 * Add this to your layout
 */
export function SkipToMainLink() {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '0',
        background: 'var(--color-primary)',
        color: 'white',
        padding: '8px',
        textDecoration: 'none',
        zIndex: 100,
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      Skip to main content
    </a>
  );
}

/**
 * Get accessible label for icon-only button
 */
export function getIconButtonLabel(action: string): string {
  const labels: Record<string, string> = {
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    menu: 'Menu',
    settings: 'Settings',
    search: 'Search',
    filter: 'Filter',
    share: 'Share',
    more: 'More options',
    like: 'Like',
    reply: 'Reply',
    approve: 'Approve',
    reject: 'Reject',
  };
  return labels[action] || action;
}

/**
 * Create accessible date/time string
 */
export function formatDateForAnnouncement(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Validate color contrast ratio
 * Returns true if contrast is at least 4.5:1 (AA standard)
 * Simplified check - use proper tool for production
 */
export function checkContrast(color1: string, color2: string): boolean {
  // This is a simplified check
  // For production, use a proper WCAG contrast checker
  const getLuminance = (rgb: string) => {
    const values = rgb.match(/\d+/g);
    if (!values || values.length < 3) return 0;
    const [r, g, b] = values.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.179 ? luminance + 0.05 : 0.05 + luminance;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

  return contrast >= 4.5;
}

export default {
  prefersReducedMotion,
  onMotionPreferenceChange,
  announceToScreenReader,
  trapFocus,
  isElementVisible,
  KeyboardShortcuts,
  SkipToMainLink,
  getIconButtonLabel,
  formatDateForAnnouncement,
  checkContrast,
};
