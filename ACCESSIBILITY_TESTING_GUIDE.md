# Isla.site Accessibility Testing Guide

**Last Updated**: January 2025  
**Standard**: WCAG 2.1 Level AA  
**Status**: ✅ Active Testing Protocol

---

## 📋 Quick Reference

- **Automated Testing**: `npm run test:accessibility`
- **Manual Testing Checklist**: See [Manual Verification](#manual-verification)
- **Screen Reader Testing**: See [Screen Reader Testing](#screen-reader-testing)
- **Keyboard Navigation**: See [Keyboard Navigation](#keyboard-navigation)

---

## 1. Automated Accessibility Testing

### 1.1 Using axe DevTools

axe-core is integrated into the project via ESLint plugin. To run automated scans:

```bash
# Build the project
npm run build

# Run linter (includes accessibility checks)
npm lint

# For CI/CD
npm lint -- --max-warnings 0
```

### 1.2 Running axe Scans on Specific Pages

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open Chrome DevTools** (F12)

3. **Install axe DevTools extension** (if not already installed):
   - Search for "axe DevTools" in Chrome Web Store
   - Install and reload page

4. **Run scan**:
   - Click axe DevTools icon → Scan page
   - Review violations, review items, and passes

5. **Document results**:
   - Screenshot violations
   - Check Best Practices section
   - Review all items before commit

### 1.3 Automated Test Pages

Test these 8 redesigned pages with axe DevTools:

| Page | Route | Priority |
|------|-------|----------|
| Home | `/` | P0 |
| Wall Feed | `/protected/wall` | P0 |
| Notifications | `/protected/notifications` | P0 |
| Updates | `/protected/updates` | P1 |
| Children Management | `/protected/children` | P1 |
| Settings | `/protected/settings` | P2 |
| Approvals | `/protected/approvals` | P2 |
| Moderation | `/protected/admin/moderation` | P2 |

---

## 2. Manual Verification

### 2.1 Color Contrast Verification

**Requirement**: 4.5:1 for normal text, 3:1 for large text (18pt+)

**Manual Check**:
1. Install WebAIM Contrast Checker extension
2. On each page, hover over text elements
3. Verify ratio ≥ 4.5:1
4. Document any failures

**Automated Check**:
```javascript
// In browser console
document.querySelectorAll('*').forEach(el => {
  const styles = getComputedStyle(el);
  const color = styles.color;
  const bg = styles.backgroundColor;
  console.log(`Text: ${color} on ${bg}`);
});
```

### 2.2 Focus Indicator Verification

**Requirement**: Visible focus indicator on all interactive elements (minimum 2px outline)

**Manual Check**:
1. Open each page
2. Press TAB repeatedly to tab through all elements
3. Verify:
   - Focus indicator is visible (not hidden)
   - Minimum outline width of 3px
   - High contrast with background (4.5:1 minimum)
4. Check no focus is trapped or lost

**Elements to Test**:
- [ ] Links (nav, content, inline)
- [ ] Buttons (primary, secondary, outline)
- [ ] Form inputs (text, select, checkbox, radio)
- [ ] Interactive icons (bell, dropdowns)
- [ ] Modal buttons
- [ ] Card actions

### 2.3 Font Size & Readability

**Requirement**: Minimum 16px base font size

**Manual Check**:
1. Open DevTools → Computed styles
2. Check element font-size values
3. Verify minimum 16px for body text
4. Verify scaling works at 200% zoom

**Zoom Test**:
1. Press Ctrl++ (Cmd++ on Mac) 3-4 times
2. Verify:
   - Text is readable (no overlapping)
   - Layout doesn't break
   - No horizontal scrolling
   - Buttons remain clickable

---

## 3. Keyboard Navigation

### 3.1 Tab Order Testing

**Requirement**: Logical tab order, no keyboard traps

**Manual Check**:
1. On each page, press TAB repeatedly
2. Verify order follows visual flow (left→right, top→bottom)
3. Verify all interactive elements are reachable
4. Verify no elements trap focus

**Tab Order by Page**:

#### Home Page (/)
- [ ] Sign In button
- [ ] Create Account button
- [ ] Links in footer

#### Wall Feed (/protected/wall)
- [ ] Compose textarea
- [ ] Post button
- [ ] Filter/sort controls
- [ ] Edit/Delete buttons on posts
- [ ] Reply inputs
- [ ] Moderation controls

#### Notifications (/protected/notifications)
- [ ] Notification bell (skip when no notifications)
- [ ] Notification items
- [ ] Dismiss buttons
- [ ] Settings button

### 3.2 Keyboard Shortcuts

**Standard Shortcuts to Test**:
- [ ] **TAB**: Move to next focusable element
- [ ] **Shift+TAB**: Move to previous focusable element
- [ ] **Enter/Space**: Activate buttons
- [ ] **Enter**: Submit forms
- [ ] **Escape**: Close modals, dismiss notifications
- [ ] **Arrow Keys**: Navigate dropdowns, select options

**Custom Shortcuts** (if any):
- None currently implemented (future enhancement)

### 3.3 Skip-to-Main-Content Link

**Requirement**: Skip link on every page to bypass navigation

**Location**: Should be first focusable element

**Manual Check**:
1. Press TAB on any page
2. Verify first item is skip link (if visible/using assistive tech)
3. Click skip link
4. Verify focus moves to main content

**Current Status**: ✅ Implemented in layout.tsx

---

## 4. Screen Reader Testing

### 4.1 Testing with NVDA (Windows)

**Installation**: Download from https://www.nvaccess.org/

**Test Procedure**:
1. Start NVDA
2. Open browser and navigate to page
3. Test page reading:
   - [ ] Page title announced
   - [ ] All headings navigable (H)
   - [ ] Links announced with labels (L)
   - [ ] Form labels associated (F)
   - [ ] Error messages announced
   - [ ] Success states announced
4. Navigate using:
   - Arrow keys
   - Heading navigation (H)
   - Link navigation (K)
   - Form navigation (F)

### 4.2 Testing with JAWS (Windows)

**Installation**: Commercial software, free trial available

**Test Procedure**:
1. Start JAWS
2. Navigate to test page
3. Use JAWS key (Insert) combinations:
   - [ ] H: Navigate by heading
   - [ ] K: Navigate by link
   - [ ] F: Navigate by form field
   - [ ] T: Navigate by table
   - [ ] L: Navigate by list
   - [ ] 1-6: Navigate by heading level

### 4.3 Testing with VoiceOver (macOS/iOS)

**Activation**: Cmd+F5 (macOS) or triple-tap home (iOS)

**Test Procedure**:
1. Enable VoiceOver
2. Use VO+arrows to navigate:
   - [ ] All content announced clearly
   - [ ] Landmarks identified
   - [ ] Link purposes clear
   - [ ] Form labels announced
   - [ ] Error handling announced
3. Use Web Rotor (VO+U):
   - [ ] Headings
   - [ ] Links
   - [ ] Form controls
   - [ ] Images

### 4.4 Screen Reader Test Cases

#### Test Case 1: Page Navigation
- [ ] Page title is announced first
- [ ] Navigation landmarks are identified
- [ ] Main content landmark is identified
- [ ] Skip to main content works

#### Test Case 2: Form Completion
- [ ] All form labels associated with inputs
- [ ] Required fields indicated
- [ ] Error messages associated with inputs (aria-describedby)
- [ ] Success messages announced (aria-live)

#### Test Case 3: Dynamic Content
- [ ] New posts announced when loaded (aria-live)
- [ ] Notifications announced (aria-live)
- [ ] Status updates announced
- [ ] Deletion confirmations announced

#### Test Case 4: Interactive Elements
- [ ] Button purposes clear
- [ ] Link destinations clear
- [ ] Modal dialogs announced
- [ ] Dropdowns expandable with Enter

---

## 5. Motion & Animation Compliance

### 5.1 prefers-reduced-motion Testing

**Requirement**: Respect browser/OS motion preferences

**Test Procedure**:
1. **Windows**:
   - Settings → Ease of Access → Display
   - Enable "Show animations"
   - Reload page

2. **macOS**:
   - System Preferences → Accessibility → Display
   - Enable "Reduce motion"
   - Reload page

3. **Verify**:
   - Animations immediately complete or don't play
   - Content still visible
   - Interactions still work

**Elements Tested**:
- [ ] Button hover animations (disabled)
- [ ] Card animations (disabled)
- [ ] Slide-in animations (disabled)
- [ ] Fade animations (disabled)
- [ ] Creature animations (disabled)
- [ ] Scroll animations (disabled)

### 5.2 Animation Duration Limits

**Requirement**: 
- No animations > 3 seconds without user action
- No automatic content changes
- Flashing < 3 per second

**Manual Check**:
1. Watch each page for animations
2. Document duration using browser DevTools
3. Verify all animations < 3 seconds
4. Verify no auto-scrolling or auto-refresh

**Animation Audit**:
- [ ] All keyframes reviewed
- [ ] All transition durations < 3s
- [ ] No auto-play animations
- [ ] No blinking/flashing elements

---

## 6. Form Accessibility

### 6.1 Label Association

**Requirement**: All inputs have associated labels

**Test Procedure**:
1. Inspect form HTML:
   ```html
   <label htmlFor="email">Email:</label>
   <input id="email" type="email" />
   ```

2. With screen reader enabled:
   - [ ] Tab to field
   - [ ] Label is announced
   - [ ] Purpose is clear

**Forms to Test**:
- [ ] Auth form (login/signup)
- [ ] Child profile form
- [ ] Post composer
- [ ] Comment form
- [ ] Approval form
- [ ] Moderation form

### 6.2 Error Messaging

**Requirement**: Errors announced to screen readers

**Test Procedure**:
1. Enter invalid data
2. Submit form
3. With screen reader:
   - [ ] Error message announced
   - [ ] Field indicated
   - [ ] Instructions provided
4. Enable highlighting:
   ```html
   <input aria-invalid="true" aria-describedby="email-error" />
   <span id="email-error" className="error">Invalid email</span>
   ```

### 6.3 Success States

**Requirement**: Success announced (aria-live)

**Test Procedure**:
1. Complete valid form submission
2. With screen reader:
   - [ ] Success message announced
   - [ ] Confirmation provided
   - [ ] Next action clear

**Implementation Pattern**:
```html
<div aria-live="polite" aria-atomic="true" className="sr-only">
  Success: Your message has been posted
</div>
```

### 6.4 Required Field Indication

**Requirement**: Required fields marked appropriately

**Test Procedure**:
1. Check for visual indicator (*)
2. Check aria-required attribute
3. Test with screen reader:
   - [ ] "required" announced
   - [ ] Expectation clear

**Implementation Pattern**:
```html
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<input id="name" required aria-required="true" />
```

---

## 7. Image & Media Accessibility

### 7.1 Alt Text Requirements

**Requirement**: All images have descriptive alt text

**Test Images**:
- [ ] Creature displays (SVG with role="img")
- [ ] User avatars (if any)
- [ ] Family photos
- [ ] Post images (if any)
- [ ] Icons (if decorative: alt="")

**Alt Text Guidelines**:
- Descriptive (15-125 characters)
- Specific (don't use "image of")
- Meaningful (convey content)
- Decorative: alt="" (not skipped)

### 7.2 SVG Accessibility

**Requirement**: SVG graphics are accessible

**Pattern**:
```html
<!-- Decorative -->
<svg aria-hidden="true">...</svg>

<!-- Meaningful -->
<svg role="img" aria-label="Happy Glimmer creature">...</svg>
```

---

## 8. Component Accessibility Checklist

### 8.1 Button Component

- [ ] Semantic `<button>` element
- [ ] Clear text label
- [ ] Focus indicator visible
- [ ] Disabled state managed
- [ ] aria-label for icon-only buttons

### 8.2 Link Component

- [ ] Semantic `<a>` element
- [ ] Clear link text (avoid "click here")
- [ ] Focus indicator visible
- [ ] aria-label for icon links
- [ ] No ambiguous links

### 8.3 Modal Component

- [ ] Semantic `<dialog>` element
- [ ] Focus trap (focus returns to trigger on close)
- [ ] Escape key closes modal
- [ ] Title announced (aria-labelledby)
- [ ] Description announced (aria-describedby)

### 8.4 Form Input Component

- [ ] `<label>` or aria-label
- [ ] Name attribute set
- [ ] Proper input type
- [ ] Placeholder not used as label
- [ ] Focus state visible

### 8.5 Navigation Component

- [ ] Semantic `<nav>` element
- [ ] Current page marked (aria-current="page")
- [ ] Links properly labeled
- [ ] Keyboard navigable
- [ ] Focus management

### 8.6 Creature Display Component

- [ ] role="img" when meaningful
- [ ] aria-label descriptive
- [ ] prefers-reduced-motion respected
- [ ] No animation auto-play
- [ ] Alternative text provided

---

## 9. Testing Workflows

### 9.1 Pre-Commit Testing

Before committing code:

```bash
# 1. Run automated checks
npm lint

# 2. Manual visual inspection
# - Zoom to 200%
# - Tab through interactive elements
# - Check focus indicators

# 3. Quick screen reader test (10 min)
# - Use built-in screen reader
# - Navigate page
# - Test forms

# 4. Check prefers-reduced-motion
# - Enable in OS
# - Reload page
# - Verify no jarring animations
```

### 9.2 Pre-Release Testing

Before release:

```bash
# 1. Full automated suite
npm lint
npm run build

# 2. Manual testing on all 8 pages
# - Use axe DevTools on each page
# - Check for violations
# - Document screenshots

# 3. Screen reader testing
# - NVDA (Windows)
# - VoiceOver (macOS)
# - Test all major workflows

# 4. Keyboard navigation
# - Tab through entire site
# - Test all keyboard shortcuts
# - Verify no traps

# 5. Motion testing
# - Enable prefers-reduced-motion
# - Verify smooth experience
# - No animations cause issues

# 6. Performance check
# - Lighthouse report (Accessibility score)
# - Should be 90+
```

### 9.3 Continuous Testing

**Daily/Weekly**:
- Run `npm lint` before commit
- Check axe warnings in new code
- Test new components manually

**Monthly**:
- Full site audit with axe DevTools
- Screen reader testing session
- Zoom and keyboard navigation tests
- Update accessibility report

---

## 10. Common Issues & Fixes

### Issue: Focus indicator not visible

**Cause**: CSS `outline: none` without replacement

**Fix**:
```css
/* Bad */
button:focus {
  outline: none; /* Don't do this alone! */
}

/* Good */
button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Issue: Form labels not associated

**Cause**: Missing `for` attribute or id

**Fix**:
```html
<!-- Bad -->
<label>Email:</label>
<input type="email" />

<!-- Good -->
<label htmlFor="email">Email:</label>
<input id="email" type="email" />
```

### Issue: Images missing alt text

**Cause**: Forgotten alt attribute

**Fix**:
```html
<!-- Bad -->
<img src="creature.svg" />

<!-- Good -->
<img src="creature.svg" alt="Happy Glimmer creature" />
```

### Issue: Color alone conveys information

**Cause**: Only using color to indicate state

**Fix**:
```html
<!-- Bad -->
<div style="background: red">Error</div>

<!-- Good -->
<div style="background: red" role="alert">
  <strong>Error:</strong> Invalid email
</div>
```

### Issue: Animations cause seizures/headaches

**Cause**: Flashing or rapid motion

**Fix**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 11. Resources

### Web Accessibility Standards
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [The A11Y Project](https://www.a11yproject.com/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) (Windows, free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows, paid)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) (macOS/iOS, free)
- [TalkBack](https://support.google.com/accessibility/android/answer/6283677) (Android, free)

### Development References
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [React Accessibility](https://react.dev/learn/accessibility)
- [Next.js Accessibility](https://nextjs.org/learn/foundations/how-nextjs-works/accessibility)

---

## 12. Accessibility Contacts

- **Lead**: @accessibility-lead (GitHub)
- **QA**: @qa-team (GitHub)
- **Issues**: [GitHub Issues - a11y](https://github.com/PortableSheep/Isla-site/issues?q=label%3Aa11y)

---

## Appendix: Automated Testing Script

Create `.github/workflows/accessibility.yml` for CI/CD:

```yaml
name: Accessibility Testing

on:
  pull_request:
  push:
    branches: [main]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      
      - run: npm run build
      
      - run: npm lint
        env:
          # Exit with error on a11y warnings
          CI: true
```

---

**Document Version**: 1.0  
**Last Reviewed**: January 2025  
**Next Review**: April 2025
