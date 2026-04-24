# Account Suspension Implementation

## Overview
This implementation adds a complete account suspension and appeals system to Isla.site, allowing moderators to suspend user accounts and giving suspended users the ability to appeal their suspensions.

## Database Schema

### User Profiles Table Updates
Added the following columns to track suspension status:
- `suspended` (boolean, default: false) - Whether account is currently suspended
- `suspended_at` (timestamp) - When the suspension was applied
- `suspended_by` (uuid) - Admin who suspended the account
- `suspension_reason` (varchar) - Category: spam, harassment, multiple_violations, other
- `suspension_reason_text` (text) - Detailed reason text
- `suspension_duration_days` (integer) - Duration in days (null for permanent)
- `suspension_expires_at` (timestamp) - When suspension auto-expires
- `appeal_status` (varchar) - 'none', 'pending', 'approved', 'rejected'
- `appeal_submitted_at` (timestamp) - When user submitted appeal

### New Tables

#### suspension_appeals
Stores appeal submissions from suspended users:
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `appeal_text` (text) - User's explanation (max 2000 chars)
- `status` (varchar) - 'pending', 'approved', 'rejected'
- `reviewed_by` (uuid) - Admin who reviewed the appeal
- `reviewed_at` (timestamp) - When the appeal was reviewed
- `review_response` (text) - Admin's response/rejection reason
- `created_at` (timestamp)
- `updated_at` (timestamp)

Indexes created for performance:
- idx_suspension_appeals_user_id
- idx_suspension_appeals_status
- idx_suspension_appeals_created_at
- idx_user_profiles_suspended
- idx_user_profiles_suspension_expires_at

## Components

### User-Facing Components

#### SuspensionNotice.tsx
Displayed when a suspended user logs in. Shows:
- Clear "Account Suspended" message with red styling
- Suspension reason and details
- Suspension date and expiry (if applicable)
- Duration information
- Details section explaining restrictions
- Appeal button link
- Logout button

#### AppealForm.tsx
Allows suspended users to submit appeals:
- Textarea for appeal explanation (max 2000 characters)
- Character counter with visual progress bar
- Submit button with loading state
- Success message on submission
- Previous appeal history display if exists
- Shows pending/rejected appeals with status

#### /appeal Page
Full-page interface for appeal submission:
- Accessible only to suspended users
- Displays AppealForm component
- Shows appeal history
- Displays previous rejection reasons if applicable

### Admin Components

#### SuspendUserModal.tsx
Modal dialog for suspending users:
- User name display
- Dropdown for suspension reason (Spam, Harassment, Multiple Violations, Other)
- Text input for reason details (required for "Other")
- Duration selector (24h, 7d, 30d, Permanent)
- Confirm/Cancel buttons
- Error handling

#### SuspensionIndicator.tsx
Shows suspension status in moderation context:
- Red badge with suspension details
- Reason, details, suspension date
- Expiry date (if applicable)
- Appeal status indicator
- "Lift Suspension" button for admins
- Error handling for unsuspend action

#### AppealsQueue.tsx
Displays pending appeals in moderation dashboard:
- Lists all pending suspension appeals
- Shows user ID and submission date
- Expandable details view
- Rejection reason textarea (required for rejection)
- Approve/Reject buttons
- Auto-refresh every 30 seconds
- Empty state message

## API Routes

### User Appeals
- **POST /api/users/appeal**
  - Submit a suspension appeal
  - Checks if user is suspended
  - Prevents duplicate pending appeals
  - Validates appeal text (1-2000 characters)
  - Creates appeal record
  - Updates user profile with pending status
  - Logs to audit trail
  - Returns: `{success: true, appeal}`

### Admin Suspension Management
- **POST /api/admin/users/[userId]/suspend**
  - Suspend a user account
  - Requires admin role
  - Accepts: reason, reason_text, duration_days
  - Sets suspension timestamp and details
  - Calculates expiry if duration specified
  - Logs to audit trail
  - Returns: `{success: true}`

- **POST /api/admin/users/[userId]/unsuspend**
  - Lift a user's suspension
  - Requires admin role
  - Clears all suspension fields
  - Resets appeal status to 'none'
  - Logs to audit trail
  - Returns: `{success: true}`

### Admin Appeals Management
- **GET /api/admin/appeals**
  - List all pending suspension appeals
  - Requires admin role
  - Sorted by created_at descending
  - Returns: `{appeals: [...SuspensionAppeal[]]}`

- **POST /api/admin/appeals/[appealId]/approve**
  - Approve a suspension appeal
  - Requires admin role
  - Updates appeal status to 'approved'
  - Automatically unsuspends the user
  - Sets appeal_status to 'approved' in user_profiles
  - Logs to audit trail
  - Returns: `{success: true}`

- **POST /api/admin/appeals/[appealId]/reject**
  - Reject a suspension appeal
  - Requires admin role
  - Accepts: review_response (required)
  - Updates appeal status to 'rejected'
  - Sets appeal_status to 'rejected' in user_profiles
  - User remains suspended
  - Response stored for user to see
  - Logs to audit trail
  - Returns: `{success: true}`

## Authentication & Authorization

### AuthGuard Enhancement
Updated `AuthGuard.tsx` to:
- Check suspension status on component mount
- Fetch suspension data from user_profiles
- Display SuspensionNotice if user is suspended
- Support allowSuspended prop to bypass for appeal pages
- Auto-check for expired suspensions

### RLS Policies
Added policies to prevent suspended users from:
- Creating posts (posts table INSERT policy)
- Updating their own posts (posts table UPDATE policy)
- Modifying profile (user_profiles table UPDATE policy)

Admins can:
- Suspend/unsuspend users (user_profiles UPDATE with admin check)
- View all appeals (suspension_appeals SELECT)
- Review and respond to appeals

## Suspension Utilities

### lib/suspension.ts
Provides helper functions:
- `getUserSuspensionStatus(userId)` - Fetch current suspension data
- `checkAndAutoUnsuspend(userId)` - Auto-unsuspend if duration expired
- `getFormattedSuspensionReason(reason)` - Format reason for display
- `calculateSuspensionExpiry(durationDays)` - Calculate expiry date

## Types

### suspension.ts
- `AppealStatus` - 'none' | 'pending' | 'approved' | 'rejected'
- `SuspensionReason` - 'spam' | 'harassment' | 'multiple_violations' | 'other'
- `SuspensionData` - Full suspension status interface
- `SuspensionAppeal` - Appeal record interface
- `SuspensionRequestPayload` - Admin suspension request type

## Database Migrations

### Migration 006: add_account_suspension.sql
- Adds suspension columns to user_profiles
- Creates suspension_appeals table
- Adds indexes for performance
- Enables RLS on suspension_appeals
- Creates RLS policies for appeals

### Migration 007: add_suspension_rls_policies.sql
- Updates RLS policies on posts table
- Prevents suspended users from creating posts
- Prevents suspended users from updating posts
- Adds metadata column to audit_logs for tracking

## Access Control Flow

### Login Flow
1. User authenticates via auth.sign In
2. AuthGuard checks if user is suspended
3. If suspended, SuspensionNotice is displayed
4. User cannot access protected pages
5. User can access /appeal page to submit appeal

### Suspension Flow
1. Admin views moderation dashboard
2. Admin clicks "Suspend" on user
3. SuspendUserModal opens
4. Admin selects reason and duration
5. Admin confirms suspension
6. POST /api/admin/users/[userId]/suspend executes
7. User is marked as suspended
8. Audit trail entry created
9. User sees SuspensionNotice on next login

### Appeal Flow
1. Suspended user accesses /appeal
2. User reads appeal instructions
3. User fills AppealForm with explanation
4. POST /api/users/appeal submits appeal
5. Appeal marked as 'pending'
6. Admin sees appeal in AppealsQueue
7. Admin reviews and either:
   - Approves: User is unsuspended immediately
   - Rejects: User remains suspended with rejection reason
8. User sees appeal status in appeal page

## Styling

All suspension components use Tailwind CSS with:
- Red/danger theme for suspension notices
- Clear visual hierarchy
- Responsive design
- Consistent with existing Isla.site design
- Green for approve, Red for reject, Yellow for pending

## Testing Checklist

- [x] TypeScript compilation successful
- [x] Build completed without errors
- [x] All new routes created
- [x] All new components created
- [x] Database migrations created
- [x] Types properly defined

### Manual Testing Needed
- [ ] Admin can suspend user from moderation queue
- [ ] Suspended user sees notice on login
- [ ] Suspended user cannot post or comment
- [ ] Suspended user can access /appeal page
- [ ] Suspended user can submit appeal
- [ ] Admin can view pending appeals
- [ ] Admin can approve appeal (unsuspends user)
- [ ] Admin can reject appeal with reason
- [ ] Approved user can post again
- [ ] Auto-unsuspend works after duration expires
- [ ] Audit trail records all actions
- [ ] RLS policies prevent unauthorized access

## Future Enhancements

1. Email notifications for:
   - Suspension notifications
   - Appeal submitted confirmation
   - Appeal decision (approved/rejected)

2. Appeal history for admins:
   - View all appeals for a user
   - Track appeal patterns

3. Suspension tiers:
   - Warning levels
   - Progressive suspension durations

4. Batch suspension:
   - Suspend multiple users at once
   - CSV import of users

5. Scheduled tasks:
   - Auto-unsuspend when duration expires
   - Daily appeal digest for admins

6. Analytics:
   - Suspension statistics
   - Appeal approval rate
   - Common suspension reasons

## Files Created/Modified

### New Files
- `supabase/migrations/006_add_account_suspension.sql`
- `supabase/migrations/007_add_suspension_rls_policies.sql`
- `src/types/suspension.ts`
- `src/lib/suspension.ts`
- `src/components/suspension/SuspensionNotice.tsx`
- `src/components/suspension/AppealForm.tsx`
- `src/components/suspension/SuspensionIndicator.tsx`
- `src/components/suspension/SuspendUserModal.tsx`
- `src/components/suspension/index.ts`
- `src/components/moderation/AppealsQueue.tsx`
- `app/appeal/page.tsx`
- `app/api/admin/users/[userId]/suspend/route.ts`
- `app/api/admin/users/[userId]/unsuspend/route.ts`
- `app/api/users/appeal/route.ts`
- `app/api/admin/appeals/route.ts`
- `app/api/admin/appeals/[appealId]/approve/route.ts`
- `app/api/admin/appeals/[appealId]/reject/route.ts`

### Modified Files
- `src/components/AuthGuard.tsx` - Added suspension check

## Configuration

No additional environment variables needed. Uses existing Supabase configuration.

## Known Limitations

1. Auto-unsuspend requires checking on login (no scheduled job)
2. Email notifications not yet implemented
3. Appeals cannot be edited after submission
4. No bulk suspension operations yet
5. RLS policies apply globally (all roles)

## Notes

- All API routes require authentication
- Admin routes check for admin role before processing
- Suspension data is stored at user level, not per-family
- Appeals are user-wide, not family-specific
- Audit logs track all suspension actions
- RLS ensures users can only see their own appeals
