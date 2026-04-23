# Micro-Interactions Integration Examples

Practical examples for implementing micro-interactions in Isla.site components.

## Example 1: Post Creation with Celebration

```typescript
import { triggerCelebration, triggerConfettiEffect } from '@/lib/micro-interactions';

function PostCreateForm() {
  const celebrationRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (formData) => {
    try {
      const post = await createPost(formData);

      // Celebrate!
      if (celebrationRef.current) {
        triggerCelebration(celebrationRef.current, 'cheery');
        triggerConfettiEffect(celebrationRef.current, 20);
      }

      // Show success and redirect after celebration
      setTimeout(() => {
        router.push(`/posts/${post.id}`);
      }, 2000);
    } catch (error) {
      triggerErrorReaction(errorRef.current);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Create your first post!" />
      <button type="submit">Post</button>
      <div ref={celebrationRef} className="celebration-container" />
    </form>
  );
}
```

## Example 2: Notification with Badge Pulse

```typescript
import { animateNotification, triggerBadgePulse } from '@/lib/micro-interactions';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Listen for new notifications
    const unsubscribe = onNotification((notification) => {
      const notifEl = document.querySelector(`[data-notification-id="${notification.id}"]`);
      if (notifEl) {
        animateNotification(notifEl as HTMLElement);
      }

      const badgeEl = document.querySelector('[data-badge="notifications"]');
      if (badgeEl) {
        triggerBadgePulse(badgeEl as HTMLElement, true);
      }

      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <button>
        Notifications
        {unreadCount > 0 && (
          <span
            data-badge="notifications"
            className="badge"
          >
            {unreadCount}
          </span>
        )}
      </button>

      <div className="notification-list">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            data-notification-id={notif.id}
            className="notification-item"
          >
            {notif.message}
          </div>
        ))}
      </div>
    </>
  );
}
```

## Example 3: Input Focus with Creature Pop

```typescript
import { triggerInputFocus, removeInputFocus } from '@/lib/micro-interactions';

function FormField({ label, creatureId = 'friendly' }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const creatureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="form-field">
      <label>{label}</label>
      <input
        ref={inputRef}
        onFocus={() => {
          if (inputRef.current && creatureRef.current) {
            triggerInputFocus(inputRef.current, creatureRef.current);
          }
        }}
        onBlur={() => {
          if (inputRef.current && creatureRef.current) {
            removeInputFocus(inputRef.current, creatureRef.current);
          }
        }}
        type="text"
      />
      <div
        ref={creatureRef}
        className={`form-creature creature-${creatureId}`}
        style={{ fontSize: '2rem' }}
      >
        👀
      </div>
    </div>
  );
}
```

## Example 4: Button Hover with Scaling

```typescript
import { triggerButtonHover, removeButtonHover } from '@/lib/micro-interactions';

function InteractiveButton({ children, onClick }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseEnter={() => {
        if (buttonRef.current) {
          triggerButtonHover(buttonRef.current);
        }
      }}
      onMouseLeave={() => {
        if (buttonRef.current) {
          removeButtonHover(buttonRef.current);
        }
      }}
      className="interactive-button"
    >
      {children}
    </button>
  );
}
```

## Example 5: Error State with Shake

```typescript
import { triggerErrorReaction } from '@/lib/micro-interactions';

function LoginForm() {
  const errorRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
    } catch (error) {
      if (errorRef.current) {
        triggerErrorReaction(errorRef.current);
      }
    }
  };

  return (
    <form>
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button onClick={handleLogin}>Login</button>

      <div ref={errorRef} className="error-container">
        {/* Error message will animate in */}
      </div>
    </form>
  );
}
```

## Example 6: Loading State with Breathing Animation

```typescript
import { handleLoadingState } from '@/lib/micro-interactions';

function DataFetcher() {
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      handleLoadingState(containerRef.current, isLoading);
    }
  }, [isLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchData();
      setData(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="data-container">
      {isLoading ? (
        <div className="skeleton-loader">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      ) : (
        <DataDisplay data={data} />
      )}
    </div>
  );
}
```

## Example 7: Approval Celebration

```typescript
import { triggerApprovalCelebration } from '@/lib/micro-interactions';

function ApprovalButton({ childId, onApprove }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleApprove = async () => {
    try {
      await approveChild(childId);

      // Celebrate!
      if (containerRef.current) {
        triggerApprovalCelebration(containerRef.current, false);
      }

      onApprove?.();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  return (
    <div ref={containerRef}>
      <button onClick={handleApprove}>Approve</button>
    </div>
  );
}
```

## Example 8: Empty State with Creature Wake

```typescript
import { triggerEmptyStateAnimation } from '@/lib/micro-interactions';

function PostList({ posts }) {
  const emptyStateRef = useRef<HTMLDivElement>(null);
  const isEmpty = posts.length === 0;

  useEffect(() => {
    if (emptyStateRef.current) {
      triggerEmptyStateAnimation(emptyStateRef.current, isEmpty);
    }
  }, [isEmpty]);

  return (
    <div>
      {isEmpty ? (
        <div ref={emptyStateRef} className="empty-state">
          <div className="empty-creature">😴</div>
          <p>No posts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Example 9: Page Transition

```typescript
import { triggerPageTransition } from '@/lib/micro-interactions';

function PageWrapper({ children, pageKey }) {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pageRef.current) {
      triggerPageTransition(pageRef.current, 'in');
    }

    return () => {
      if (pageRef.current) {
        triggerPageTransition(pageRef.current, 'out');
      }
    };
  }, [pageKey]);

  return (
    <div ref={pageRef}>
      {children}
    </div>
  );
}
```

## Example 10: Modal Animation

```typescript
import { triggerModalTransition } from '@/lib/micro-interactions';

function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (modalRef.current) {
      triggerModalTransition(modalRef.current, isOpen, isMobile);
    }
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
```

## Example 11: Approval Workflow Progress

```typescript
import { triggerProgressAnimation } from '@/lib/micro-interactions';

function ApprovalProgress({ currentStep, totalSteps }) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      triggerProgressAnimation(progressRef.current, currentStep, totalSteps);
    }
  }, [currentStep, totalSteps]);

  return (
    <div ref={progressRef} className="progress-bar">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`progress-step ${i < currentStep ? 'completed' : ''}`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}
```

## Example 12: Scroll Feedback

```typescript
import { triggerScrollFeedback } from '@/lib/micro-interactions';

function ScrollableList({ items }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;

    if (scrollTop > lastScrollTop.current) {
      triggerScrollFeedback(target, 'down');
    } else {
      triggerScrollFeedback(target, 'up');
    }

    lastScrollTop.current = scrollTop;
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="scrollable-list"
    >
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Example 13: Complete Form with All Interactions

```typescript
import {
  triggerInputFocus,
  removeInputFocus,
  triggerButtonHover,
  removeButtonHover,
  triggerErrorReaction,
  triggerCelebration,
  respectMotionPreference
} from '@/lib/micro-interactions';

function CompleteForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const inputInputs = useRef<HTMLInputElement[]>([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await submitForm(formData);

      if (successRef.current) {
        triggerCelebration(successRef.current, 'cheery');
      }
    } catch (error) {
      setErrors(error.fieldErrors);

      if (errorRef.current) {
        triggerErrorReaction(errorRef.current);
      }
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          onFocus={(e) => triggerInputFocus(e.currentTarget)}
          onBlur={(e) => removeInputFocus(e.currentTarget)}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          onFocus={(e) => triggerInputFocus(e.currentTarget)}
          onBlur={(e) => removeInputFocus(e.currentTarget)}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <button
        ref={submitButtonRef}
        type="submit"
        onMouseEnter={() => triggerButtonHover(submitButtonRef.current!)}
        onMouseLeave={() => removeButtonHover(submitButtonRef.current!)}
      >
        Submit
      </button>

      {Object.keys(errors).length > 0 && (
        <div ref={errorRef} className="error-message">
          {Object.entries(errors).map(([field, message]) => (
            <p key={field}>{message}</p>
          ))}
        </div>
      )}

      <div ref={successRef} className="success-message" />
    </form>
  );
}
```

## Example 14: Creature Blink Animation on Avatar

```typescript
import { triggerCreatureBlink } from '@/lib/micro-interactions';

function CreatureAvatar({ creature }) {
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (avatarRef.current) {
      const stopBlink = triggerCreatureBlink(avatarRef.current, 3000);
      return stopBlink;
    }
  }, [creature]);

  return (
    <div ref={avatarRef} className="creature-avatar">
      {creature.emoji}
    </div>
  );
}
```

## Example 15: Respecting Motion Preferences

```typescript
import { respectMotionPreference } from '@/lib/micro-interactions';

function SmartAnimation({ element, animationType }) {
  useEffect(() => {
    if (respectMotionPreference()) {
      // User prefers reduced motion - just show instantly
      element.style.opacity = '1';
      element.style.transform = 'none';
    } else {
      // Safe to animate
      element.classList.add(`animation-${animationType}`);
    }
  }, [element, animationType]);
}
```

## CSS Integration Example

```css
/* Use the animations in your custom CSS */

.interactive-element {
  transition: all 100ms ease-out;
}

.interactive-element:hover {
  animation: button-scale-up 100ms ease-out forwards;
}

/* Or combine with custom styles */

.post-create-button {
  position: relative;
}

.post-create-button.celebrating::before {
  content: '🎉';
  animation: celebration-jump 2000ms cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

/* Mobile-specific animations */

@media (max-width: 640px) {
  .celebration-active {
    animation-duration: 1500ms;
  }

  .modal-fade-in {
    animation: modal-slide-up 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
}
```

## Testing Examples

```typescript
import { triggerCelebration, respectMotionPreference } from '@/lib/micro-interactions';
import { render, screen } from '@testing-library/react';

describe('Form with Celebrations', () => {
  it('should celebrate on successful submission', async () => {
    const { container } = render(<PostCreateForm />);
    
    const button = screen.getByRole('button', { name: /post/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(container.querySelector('.celebration-active')).toBeInTheDocument();
    });
  });

  it('should respect reduced motion preference', () => {
    // Mock prefers-reduced-motion
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }));

    expect(respectMotionPreference()).toBe(true);
  });
});
```

## Performance Tips

```typescript
// ✅ Good: Batch multiple animations
import { batchAnimations } from '@/lib/micro-interactions';

batchAnimations([
  () => element1.classList.add('fade-in'),
  () => element2.classList.add('slide-left'),
  () => element3.classList.add('bounce-once')
]);

// ✅ Good: Use animation callbacks for cleanup
await waitForAnimationComplete(element);
element.classList.remove('celebration-active');

// ❌ Bad: Don't trigger animations in loops
items.forEach((item) => {
  triggerCelebration(item); // Too many simultaneous animations!
});

// ✅ Good: Stagger animations
items.forEach((item, index) => {
  setTimeout(() => {
    triggerCelebration(item);
  }, index * 100);
});
```

---

For more detailed documentation, see [MICRO_INTERACTIONS_GUIDE.md](./MICRO_INTERACTIONS_GUIDE.md).
