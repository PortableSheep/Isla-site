import { getSbClient } from './supabaseClient';
import { ChildProfile, CreateChildProfileRequest, UpdateChildProfileRequest } from '@/types/child';

/**
 * Create a new child profile with pending_approval status
 */
export async function createChildProfile(
  parentId: string,
  data: CreateChildProfileRequest,
  familyId?: string
): Promise<ChildProfile>  {
  const supabase = await getSbClient();
  const { name, age, bio } = data;

  // Validate input
  if (!name || name.trim().length < 2 || name.trim().length > 50) {
    throw new Error('Name must be between 2 and 50 characters');
  }

  if (age !== undefined && (age < 0 || age > 18)) {
    throw new Error('Age must be between 0 and 18');
  }

  if (bio && bio.length > 500) {
    throw new Error('Bio must be less than 500 characters');
  }

  // Generate a unique email for the child profile
  const childEmail = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@isla.local`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = (await (supabase as any)
    .from('users')
    .insert([
      {
        email: childEmail,
        parent_id: parentId,
        family_id: familyId || null,
        name: name.trim(),
        age: age || null,
        bio: bio?.trim() || null,
        status: 'pending_approval',
        approved_at: null,
        approved_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()) as any;

  if (error) {
    throw new Error(`Failed to create child profile: ${error.message}`);
  }

  return profile as ChildProfile;
}

/**
 * Get all children for a parent
 */
export async function getChildrenByParent(parentId: string): Promise<ChildProfile[]>  {
  const supabase = await getSbClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase as any)
    .from('users')
    .select('*')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false })) as any;

  if (error) {
    throw new Error(`Failed to fetch children: ${error.message}`);
  }

  return data as ChildProfile[];
}

/**
 * Get a single child profile by ID
 */
export async function getChildProfile(childId: string): Promise<ChildProfile>  {
  const supabase = await getSbClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', childId)
    .single()) as any;

  if (error) {
    throw new Error(`Failed to fetch child profile: ${error.message}`);
  }

  return data as ChildProfile;
}

/**
 * Update a child profile
 */
export async function updateChildProfile(
  childId: string,
  data: UpdateChildProfileRequest
): Promise<ChildProfile>  {
  const supabase = await getSbClient();
  // Validate input
  if (data.name && (data.name.trim().length < 2 || data.name.trim().length > 50)) {
    throw new Error('Name must be between 2 and 50 characters');
  }

  if (data.age !== undefined && (data.age < 0 || data.age > 18)) {
    throw new Error('Age must be between 0 and 18');
  }

  if (data.bio && data.bio.length > 500) {
    throw new Error('Bio must be less than 500 characters');
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }
  if (data.age !== undefined) {
    updateData.age = data.age;
  }
  if (data.bio !== undefined) {
    updateData.bio = data.bio?.trim() || null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = (await (supabase as any)
    .from('users')
    .update(updateData)
    .eq('id', childId)
    .select()
    .single()) as any;

  if (error) {
    throw new Error(`Failed to update child profile: ${error.message}`);
  }

  return profile as ChildProfile;
}

/**
 * Delete a child profile (only pending profiles)
 */
export async function deleteChildProfile(childId: string, parentId: string): Promise<void>  {
  const supabase = await getSbClient();
  // First verify the profile exists and belongs to the parent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: fetchError } = (await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', childId)
    .eq('parent_id', parentId)
    .single()) as any;

  if (fetchError || !profile) {
    throw new Error('Child profile not found or does not belong to this parent');
  }

  // Only allow deletion of pending profiles
  if ((profile as ChildProfile).status !== 'pending_approval') {
    throw new Error('Can only delete profiles with pending_approval status');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await (supabase as any)
    .from('users')
    .delete()
    .eq('id', childId)) as any;

  if (error) {
    throw new Error(`Failed to delete child profile: ${error.message}`);
  }
}

/**
 * Get children by status
 */
export async function getChildrenByStatus(
  parentId: string,
  status: 'pending_approval' | 'active' | 'rejected' | 'suspended'
): Promise<ChildProfile[]>  {
  const supabase = await getSbClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase as any)
    .from('users')
    .select('*')
    .eq('parent_id', parentId)
    .eq('status', status)
    .order('created_at', { ascending: false })) as any;

  if (error) {
    throw new Error(`Failed to fetch children by status: ${error.message}`);
  }

  return data as ChildProfile[];
}

/**
 * Check if a child is approved
 */
export async function isChildApproved(childId: string): Promise<boolean>  {
  const supabase = await getSbClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase as any)
    .from('users')
    .select('status')
    .eq('id', childId)
    .single()) as any;

  if (error || !data) {
    throw new Error('Failed to check child approval status');
  }

  return (data as { status: string }).status === 'active';
}
