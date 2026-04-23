# Isla Post Creation Flow - Implementation Guide

## Overview
This implementation provides Isla with a special post composer that allows her to create messages visible to all families in the system. Posts created by Isla are stored with `family_id = NULL` to indicate they're accessible to all families.

## Architecture

### 1. Isla User Role
- **Role**: Special `isla` role in `user_profiles`
- **Database**: User created in Supabase Auth with email `isla@isla.site`
- **Profile**: Entry in `user_profiles` table with role = 'isla'
- **Access**: Only Isla can access the `/compose` page

### 2. Database Changes

#### Migration: `004_update_posts_for_isla.sql`
- Updated `posts.family_id` to allow NULL values
- Added index for Isla posts: `idx_posts_isla_posts`
- Updated RLS policies to include Isla posts in all family feeds
- Modified insert policy to allow Isla to create all-family posts

#### Post Query Changes
- `getPostsByFamily()` now returns both family posts AND Isla posts (family_id IS NULL)
- Query uses OR condition to include both scopes

### 3. Components

#### PostComposer.tsx
- **Purpose**: Textarea with real-time character counter
- **Features**:
  - 5000 character limit with warning at 80% (4000 chars)
  - Draft auto-save to localStorage with 3s debounce
  - Update checkbox to mark as announcement
  - Visual feedback: border color changes on warning/error
- **Props**: `onContentChange`, `isUpdate`, `onUpdateToggle`, `disabled`

#### ComposerActions.tsx
- **Purpose**: Form action buttons and feedback
- **Features**:
  - "Publish" button (disabled until content is valid)
  - "Cancel" button (with confirmation if draft exists)
  - Error messages
  - Success notification
- **Props**: `content`, `isUpdate`, `isLoading`, `onPublish`, `onCancel`, `successMessage`

#### compose.tsx (Protected Page)
- **Route**: `/compose` (only accessible to Isla)
- **Features**:
  - Authorization check on mount
  - Redirects to login if not authenticated
  - Redirects to home if not Isla
  - Form state management
  - Optimistic UI with redirect on success
  - Draft persistence via localStorage

### 4. API Endpoint

#### POST /api/posts/create
**Enhanced to support Isla posts**

Request body:
```json
{
  "content": "string (required)",
  "is_update": "boolean (optional)",
  "is_isla_post": "boolean (optional)",
  "family_id": "string (required if not is_isla_post)"
}
```

Response:
- 201: Created post object
- 400: Missing or invalid fields
- 401: Unauthorized
- 403: Not Isla (when is_isla_post=true)
- 500: Server error

### 5. Navigation
- Updated `Navigation.tsx` to show "✨ Compose" link for Isla users
- Link displayed conditionally based on `isIslaUser()` check
- Purple styling to distinguish Isla-specific features

### 6. Authentication
- New utility: `isIslaUser()` in `lib/islaUser.ts`
- Checks user's role in `user_profiles` table
- Used for authorization on composer page and in navigation

## Setup Instructions

### 1. Deploy Migration
```bash
# Apply the SQL migration to your Supabase project
supabase migration up
```

Or manually in Supabase SQL Editor:
```sql
-- Run migration file: 004_update_posts_for_isla.sql
```

### 2. Create Isla User

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → Your Project
2. Navigate to Authentication > Users
3. Click "Create a new user"
4. Email: `isla@isla.site`
5. Password: [Create a strong password]
6. Note the user ID

Then in SQL Editor, run:
```sql
INSERT INTO user_profiles (user_id, family_id, role, status)
VALUES (
  'ISLA_USER_ID_HERE',
  'DUMMY_FAMILY_ID_HERE',
  'isla',
  'active'
);
```

Note: The `family_id` for Isla user can be a dummy UUID or the first family ID. It's used for the profile entry but not for post visibility.

**Option B: Via Script**
```bash
chmod +x scripts/setup-isla.sh
./scripts/setup-isla.sh
```

### 3. Test the Implementation

1. **Login as Isla**
   - Navigate to `/auth/login`
   - Email: `isla@isla.site`
   - Password: [The password you set]

2. **Access Composer**
   - Navigate to `/compose`
   - Should see the compose form
   - Character counter and update toggle should be visible

3. **Create a Post**
   - Type a message in the textarea
   - Click "Publish"
   - Should redirect to home page with success message

4. **Verify Post Visibility**
   - Login as a family user
   - Navigate to `/wall`
   - Isla's post should appear at the top
   - Post should have author marked as Isla

## File Structure

```
app/
  (protected)/
    compose.tsx                 # Post composer page (Isla-only)
    
api/
  posts/
    create/route.ts            # Enhanced with Isla support
    [postId]/
      flag/route.ts            # Fixed async params
      hide/route.ts            # Working
      replies/route.ts         # Fixed async params
      route.ts                 # Fixed async params

src/
  components/
    PostComposer.tsx          # Composer form
    ComposerActions.tsx       # Action buttons
    Navigation.tsx            # Updated with Compose link
    
  lib/
    islaUser.ts               # Isla role utilities
    posts.ts                  # Updated getPostsByFamily()
    
  types/
    posts.ts                  # Updated with nullable family_id

supabase/
  migrations/
    004_update_posts_for_isla.sql  # RLS and schema updates
    
scripts/
  setup-isla.sh               # Setup instructions
```

## Features Implemented

✅ Isla role setup with special user  
✅ Protected composer page (Isla-only)  
✅ Post composer form with character counter  
✅ Draft auto-save to localStorage  
✅ Update/announcement checkbox  
✅ Multi-family post broadcasting (family_id = NULL)  
✅ RLS policies for Isla posts  
✅ API endpoint with Isla verification  
✅ Navigation link for Isla  
✅ Validation (empty check, 5000 char limit)  
✅ Error handling and retry  
✅ Success notification with redirect  

## Validation Rules

- **Content Required**: Non-empty, trimmed
- **Max Length**: 5000 characters
- **Update Flag**: Optional boolean
- **Isla Verification**: Required for is_isla_post=true
- **Button State**: Disabled until content is valid and not loading

## RLS (Row Level Security)

### Isla Post Access
- All authenticated users can view posts where family_id IS NULL and hidden=false
- Isla can create posts with family_id = NULL
- Family admins can still hide Isla posts if needed

### Query Behavior
```sql
-- Family feed now includes:
-- 1. Posts for their specific family
-- 2. Posts with family_id = NULL (Isla posts)
SELECT * FROM posts
WHERE (family_id = $1 OR family_id IS NULL)
AND parent_post_id IS NULL
AND deleted_at IS NULL
AND hidden = false
ORDER BY created_at DESC
```

## Testing Checklist

- [ ] Isla can access `/compose` page
- [ ] Non-Isla users redirected to home from `/compose`
- [ ] Unauthenticated users redirected to login
- [ ] Character counter works correctly
- [ ] Warning appears at 4000+ chars
- [ ] Error appears at 5000+ chars
- [ ] Publish button disabled when empty or > 5000 chars
- [ ] Draft auto-saves after 3 seconds
- [ ] Draft persists on page reload
- [ ] "Mark as Update" checkbox toggles correctly
- [ ] Cancel button works with confirmation
- [ ] Success message shows after publish
- [ ] Redirect to home after success
- [ ] Post appears immediately on wall
- [ ] Isla posts visible to all families
- [ ] Error messages display on failure
- [ ] Retry works after error
- [ ] localStorage draft clears after successful post

## Future Enhancements

- [ ] Rich text editor (bold, italic, links)
- [ ] Emoji picker
- [ ] Image/media support
- [ ] Scheduled posts
- [ ] Post templates
- [ ] Analytics/engagement tracking
- [ ] Pinned posts
- [ ] Post categories/tags

## Troubleshooting

### Compose page shows 403 Forbidden
- Verify Isla user role in Supabase: `user_profiles.role = 'isla'`
- Check RLS policies allow Isla user

### Posts not visible to all families
- Verify family_id IS NULL for Isla posts
- Check RLS policies for SELECT permission with family_id IS NULL condition
- Verify posts are not marked as hidden

### Draft not saving
- Check browser localStorage is enabled
- Verify no errors in browser console
- Clear localStorage and try again

### Build errors with async params
- All route.ts files use NextRequest and async params
- Example: `context: { params: Promise<{ postId: string }> }`
- Must await params before destructuring
