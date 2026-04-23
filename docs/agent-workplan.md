# Agent Workplan

This file maps backlog issues into clean work packets for implementation agents.

## Recommended first wave of implementation tasks

1. Parent authentication
2. Invite token model
3. Invite acceptance flow
4. Child profile creation flow
5. Approval workflow
6. Wall data model
7. Wall feed UI
8. Create-post flow

## Task packet guidance
Each implementation task should include:
- the user problem being solved
- relevant roles
- affected routes/pages
- affected schema/entities
- acceptance criteria copied from the backlog
- notes on dependencies

## Dependency notes
- Invite acceptance depends on invite token model.
- Child profile creation depends on parent authentication.
- Approval workflow depends on family and child state modeling.
- Wall feed depends on post schema.
- Replies depend on post/thread relationships.
- Notifications depend on posts/replies and parent preference modeling.
- Moderation logging depends on admin actions existing.

## Suggested execution order
### Phase 1
- parent authentication
- invite token model
- invite acceptance flow
- child profile creation flow
- approval workflow

### Phase 2
- wall data model
- wall feed UI
- create-post flow
- threaded replies
- Isla update composer

### Phase 3
- moderation queue
- hide/delete actions
- account suspension
- audit logging

### Phase 4
- notification preferences
- update notifications
- reply notifications
- QA and review tasks
