# Isla Post Creation Flow - Quick Start

## What Was Built

Complete implementation of the Isla post creation flow for the Isla.site family communication platform.

### Features

1. **✨ Isla Composer Page** (`/compose`)
   - Post composition interface exclusive to Isla
   - Real-time character counter (5000 char limit)
   - Draft auto-save to localStorage
   - "Mark as Update" flag for announcements
   - Visual feedback with warnings and errors

2. **📡 Multi-Family Broadcasting**
   - Posts created by Isla are visible to ALL families
   - Database: Posts stored with `family_id = NULL`
   - Automatic inclusion in all family feeds
   - Seamless integration with existing wall

3. **🔒 Access Control**
   - Only Isla user can access composer
   - Role-based verification in database
   - Authorization checks on page load and API calls
   - Proper error handling with redirects

4. **💾 Draft Management**
   - Auto-save to localStorage every 3 seconds
   - Drafts persist across page reloads
   - Automatic cleanup after successful publish
   - Confirmation before discarding draft

## Database Schema Updates

### Migration: `supabase/migrations/004_update_posts_for_isla.sql`

Changes:
- `posts.family_id` now allows NULL (for all-family posts)
- New index: `idx_posts_isla_posts`
- Updated RLS policies to include Isla posts
- Modified insert policy to allow Isla role

### Updated Queries
- `getPostsByFamily()` now returns both family-specific AND Isla posts
- Query: `WHERE (family_id = $1 OR family_id IS NULL)`

## Files Created

### Components
- `src/components/PostComposer.tsx` - Main composer form
- `src/components/ComposerActions.tsx` - Action buttons
- `app/(protected)/compose.tsx` - Protected composer page

### Utilities
- `src/lib/islaUser.ts` - Isla role detection
- `supabase/migrations/004_update_posts_for_isla.sql` - Schema updates
- `scripts/setup-isla.sh` - Setup documentation

### Documentation
- `docs/POST_CREATION_FLOW.md` - Detailed implementation guide

### API Updates
- `app/api/posts/create/route.ts` - Enhanced with Isla support
- Fixed async params in all route handlers:
  - `app/api/posts/[postId]/flag/route.ts`
  - `app/api/posts/[postId]/replies/route.ts`
  - `app/api/posts/[postId]/route.ts`

### Navigation
- Updated `src/components/Navigation.tsx` - Shows Compose link for Isla

### Types
- Updated `src/types/posts.ts` - nullable `family_id`

## Setup Instructions

### 1. Apply Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard → SQL Editor
# Copy and run: supabase/migrations/004_update_posts_for_isla.sql
```

### 2. Create Isla User

**Via Supabase Dashboard:**

1. Go to https://app.supabase.com
2. Select your project
3. Go to Authentication > Users
4. Click "Create a new user"
5. Fill in:
   - Email: `isla@isla.site`
   - Password: [Create a strong password]
   - Check "Auto confirm user"
6. Note the User ID

Then in SQL Editor, run:
```sql
INSERT INTO user_profiles (user_id, family_id, role, status)
VALUES ('YOUR_ISLA_USER_ID', gen_random_uuid(), 'isla', 'active');
```

Replace `YOUR_ISLA_USER_ID` with the ID from step 6.

### 3. Test It

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Login as Isla:**
   - Navigate to http://localhost:3000/auth/login
   - Email: `isla@isla.site`
   - Password: [The password you set]

3. **Access the Composer:**
   - Click the "✨ Compose" link in navigation (top-left)
   - Or navigate directly to http://localhost:3000/compose

4. **Create a Test Post:**
   - Type a message (e.g., "Hello from Isla! 👋")
   - Click "✓ Publish"
   - Should see success notification
   - Should redirect to home page

5. **Verify Visibility:**
   - Logout (click "Logout")
   - Login as a parent or child user
   - Navigate to `/wall`
   - Your Isla post should be visible at the top

## API Usage

### Create Isla Post

```bash
curl -X POST http://localhost:3000/api/posts/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d {
    "content": "Hello families!",
    "is_update": false,
    "is_isla_post": true
  }
```

Response:
```json
{
  "id": "uuid",
  "family_id": null,
  "author_id": "isla_user_id",
  "content": "Hello families!",
  "is_update": false,
  "created_at": "2024-04-23T12:00:00Z",
  ...
}
```

## Key Implementation Details

### Character Counting
- Real-time counter updates as user types
- Warning at 4000 characters (80%)
- Error at 5000 characters (100%)
- Publish disabled when invalid

### Draft Auto-Save
- Saves to localStorage every 3 seconds
- Key: `post_draft`
- Auto-loaded on page mount
- Cleared after successful publish

### Authorization Flow
1. User navigates to `/compose`
2. Component checks authentication on mount
3. Verifies user is Isla (via `isIslaUser()`)
4. Redirects to home if not Isla
5. Redirects to login if not authenticated

### Post Broadcasting
- All posts with `family_id = NULL` visible to ALL users
- Family-specific queries include: `WHERE (family_id = $1 OR family_id IS NULL)`
- RLS policies enforce access control
- Posts properly filtered based on user's families

## Validation

### Content Validation
- Not empty (trimmed)
- Maximum 5000 characters
- Whitespace trimmed on save

### User Validation
- Must be authenticated
- Must have Isla role
- Checked on page load and API call

### Button State
- Publish button disabled:
  - Content is empty
  - Content exceeds 5000 chars
  - Request is loading
  - Cancel button disabled during loading

## Error Handling

### User-Friendly Errors
- Empty content: "Content cannot be empty"
- Too long: "Content exceeds 5000 character limit"
- Not Isla: "Only Isla can access this page"
- Network error: Error message displayed with retry option

### Error Preservation
- Draft automatically preserved on error
- User can retry without losing work
- localStorage maintains draft

## Troubleshooting

### "Only Isla can access this page"
**Cause:** User is not Isla
**Fix:** Verify role in `user_profiles` table:
```sql
SELECT role FROM user_profiles WHERE user_id = 'YOUR_USER_ID';
-- Should return: isla
```

### Isla posts not visible to families
**Cause:** RLS policies not updated
**Fix:** Re-apply migration:
```bash
supabase db push
```

### Draft not saving
**Cause:** localStorage disabled
**Fix:** Check browser console for errors, enable localStorage in privacy settings

### Composer page shows blank
**Cause:** Loading state stuck
**Fix:** Check browser console for errors, refresh page

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│        Navigation.tsx                    │
│   (Shows "✨ Compose" for Isla)          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│     compose.tsx (Protected Page)         │
│  ┌────────────────────────────────────┐  │
│  │ Authorization Check (isIslaUser)   │  │
│  │ - Redirect if not authenticated    │  │
│  │ - Redirect if not Isla             │  │
│  └────────────────────────────────────┘  │
│              │                            │
│  ┌───────────▼────────────────────────┐  │
│  │   PostComposer Component           │  │
│  │ - Character counter               │  │
│  │ - Draft auto-save                 │  │
│  │ - Update toggle                   │  │
│  └────────────┬─────────────────────┘   │
│              │                           │
│  ┌───────────▼────────────────────────┐  │
│  │ ComposerActions Component          │  │
│  │ - Publish button                  │  │
│  │ - Cancel button                   │  │
│  │ - Error/Success messages          │  │
│  └───────────┬─────────────────────┘   │
└──────────────┼──────────────────────────┘
               │
               ▼ (on publish)
    ┌──────────────────────────┐
    │  POST /api/posts/create  │
    │                          │
    │ - Verify Isla role       │
    │ - Validate content       │
    │ - Create post            │
    │ - Return post data       │
    └──────────────┬───────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Posts Table        │
         │  family_id = NULL   │ ◄─── Isla post
         │  (visible to all)   │
         └─────────────────────┘
```

## Next Steps

1. ✅ Isla can create posts
2. ⏭️ Add rich text editor (optional)
3. ⏭️ Add image/media support
4. ⏭️ Implement scheduled posts
5. ⏭️ Add engagement analytics

## Support

For detailed information, see:
- `docs/POST_CREATION_FLOW.md` - Complete implementation guide
- `scripts/setup-isla.sh` - Setup instructions
- `app/api/posts/create/route.ts` - API endpoint code
- `app/(protected)/compose.tsx` - Composer page code
