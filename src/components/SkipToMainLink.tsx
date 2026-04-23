'use client';

import React from 'react';

export function SkipToMainLink() {
  return (
    <a
      href="#main-content"
      className="skip-to-main-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '0',
        background: 'var(--color-primary)',
        color: 'white',
        padding: '8px 16px',
        textDecoration: 'none',
        zIndex: 9999,
        borderRadius: '0 0 4px 0',
        fontSize: '16px',
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLElement).style.top = '0';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLElement).style.top = '-40px';
      }}
    >
      Skip to main content
    </a>
  );
}
