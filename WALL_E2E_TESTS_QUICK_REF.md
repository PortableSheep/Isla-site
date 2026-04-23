# Wall E2E Tests - Quick Reference

## Files Created

```
tests/e2e/
├── wall.spec.ts                 # Main test file (21KB, 15 test cases)
└── pages/
    ├── feed.page.ts            # Feed page object (4.4KB)
    ├── post-composer.page.ts    # Post composer page object (5.2KB)
    └── thread.page.ts          # Thread page object (6.2KB)
```

## Test Suite Summary

### 10 Main Test Cases
1. **View Wall Feed** - Navigate and verify feed loads with pagination
2. **Create Post** - Create posts and verify they appear at top
3. **Reply to Post** - Reply with character limit validation
4. **View Threaded Conversation** - Thread view with proper hierarchy
5. **Isla Creates Update** - Admin update posts with special badge
6. **View Updates Page** - Dedicated updates page display
7. **Post Pagination** - Load More functionality
8. **Author Badges** - Role identification badges
9. **Delete Own Post** - Post deletion workflow
10. **Post Character Limits** - Validation (empty, 1, 500, 501+ chars)

### 5 Additional Tests
- **Performance** - Wall loads < 1 second
- **Accessibility** - Keyboard navigation support
- **Edge Cases** - Deleted posts handling
- **Concurrent Posting** - Multiple sequential posts
- **Mobile** - Responsive on mobile (375x667)

## Key Methods by Page Object

### FeedPage
```typescript
feedPage.navigateToWall()
feedPage.navigateToUpdates()
feedPage.waitForFeedToLoad()
feedPage.getVisiblePostCount(): Promise<number>
feedPage.getFirstPostContent(): Promise<string>
feedPage.clickLoadMore()
feedPage.refreshFeed()
feedPage.verifyPaginationControls()
feedPage.isKeyboardNavigable(): Promise<boolean>
feedPage.verifyPostsLoadedInLessThanSecond(): Promise<boolean>
```

### PostComposerPage
```typescript
composerPage.createPost(content: string)
composerPage.createMultiplePosts(messages: string[])
composerPage.typePostMessage(message: string)
composerPage.submitPost()
composerPage.getCharacterCount(): Promise<number>
composerPage.typeCharacters(count: number)
composerPage.attemptSubmitEmpty(): Promise<boolean>
composerPage.verifyCharacterLimitError()
composerPage.verifyAuthorNameDisplayed(authorName: string)
composerPage.verifyTimestampDisplayed()
composerPage.createUpdatePost(content: string)
```

### ThreadPage
```typescript
threadPage.createReply(message: string, postIndex?: number)
threadPage.clickReplyButton(postIndex?: number)
threadPage.getReplyCount(postIndex?: number): Promise<number>
threadPage.verifyReplyInThread(replyContent: string)
threadPage.getAllReplies(): Promise<string[]>
threadPage.verifyReplyOrder(): Promise<boolean>
threadPage.verifyReplyAuthorAndTimestamp(replyContent: string)
threadPage.verifyNestedIndentation(): Promise<boolean>
threadPage.replyToReply(parentReplyIndex: number, message: string)
threadPage.getVisibleReplyCount(): Promise<number>
```

## Running Tests

### All wall tests
```bash
npm run test -- wall.spec.ts
```

### Specific test
```bash
npm run test -- wall.spec.ts -g "Create Post"
```

### With UI
```bash
npm run test -- wall.spec.ts --ui
```

### Headed (see browser)
```bash
npm run test -- wall.spec.ts --headed
```

### Debug mode
```bash
npm run test -- wall.spec.ts --debug
```

### Generate report
```bash
npx playwright show-report
```

## Test User
- Email: `wall-parent@example.com`
- Password: `SecurePassword123!`

## Realistic Test Data

### Post Examples
- "Just completed a fun family game night!"
- "Reminder: Piano lessons on Saturday at 2 PM"
- "Made homemade pizza for dinner tonight"
- "Looking forward to the family reunion"
- "Beautiful sunset at the park"

### Reply Examples
- "That sounds amazing!"
- "I'll be there!"
- "Can you share the recipe?"
- "Already ordered it!"

## Browser Coverage
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop/WebKit)
- Chrome (Mobile - Pixel 5)
- Safari (Mobile - iPhone 12)

## Key Features

✅ Page Object Model for maintainability  
✅ Realistic family-appropriate content  
✅ Comprehensive error handling  
✅ Performance measurements  
✅ Accessibility verification  
✅ Mobile responsiveness testing  
✅ Multi-user scenarios  
✅ Async/await best practices  
✅ Automatic cleanup  
✅ Cross-browser compatibility  

## Selector Flexibility

Tests use multiple selectors to work with various UI implementations:

```typescript
// Posts
'[data-testid="post"], [data-testid="feed-item"], article, .post'

// Textarea
'textarea[placeholder*="message"], textarea[placeholder*="post"]'

// Buttons
'button:has-text("Create Post")'
'button:has-text("Post"), button[type="submit"]'

// Replies
'[data-testid="reply"], .reply, .comment'
```

## Common Assertions

```typescript
expect(postCount).toBeGreaterThan(0)
expect(charCount).toBeLessThanOrEqual(500)
expect(isLoggedIn).toBe(true)
expect(firstPost).toContain('content')
await expect(element).toBeVisible()
await expect(element).not.toBeVisible()
```

## Debugging

### See what's happening
```bash
npm run test -- wall.spec.ts --headed --workers=1
```

### Slow down execution
```bash
npm run test -- wall.spec.ts --headed --debug
```

### Take screenshots
Add to test: `await page.screenshot({ path: 'debug.png' })`

### Check logs
```bash
npm run test -- wall.spec.ts 2>&1 | tail -100
```

## Performance Targets

- Wall feed loads: < 1 second
- Post creation: < 2 seconds
- Reply submission: < 2 seconds
- Pagination: < 500ms for 20 posts

## Notes

- Tests automatically create and clean up test data
- Authentication happens in beforeEach hook
- Logout happens in afterEach hook
- Tests use realistic but distinct post content
- All tests are independent and can run in parallel
- Supports up to 3 concurrent workers (default)
