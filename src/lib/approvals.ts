// @ts-nocheck
import { getSbClient } from './supabaseClient';

export interface ChildProfile {
  id: string;
  user_id: string;
  family_id: string;
  role: string;
  status: 'pending_approval' | 'active' | 'rejected';
  created_at: string;
  updated_at: string;
  email?: string;
}

export interface ApprovalRecord {
  id: string;
  child_id: string;
  family_id: string;
  action: 'approved' | 'rejected';
  approved_by: string;
  reason?: string;
  created_at: string;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * Get all pending children for a parent in their families
 */
export async function getPendingChildren(
  parentId: string,
  familyId?: string
): Promise<ChildProfile[]>  {
  const supabase = await getSbClient();
  try {
    let query: any = supabase
      .from('user_profiles')
      .select('id, user_id, family_id, role, status, created_at, updated_at')
      .eq('status', 'pending_approval');

    if (familyId) {
      query = query.eq('family_id', familyId);
    } else {
      // Get families where parent is owner
      const { data: families, error: familiesError } = await (supabase
        .from('families')
        .select('id')
        .eq('created_by', parentId) as any);

      if (familiesError || !families) throw familiesError;

      const familyIds = families.map((f: any) => f.id);
      if (familyIds.length === 0) return [];

      query = query.in('family_id', familyIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching pending children:', error);
    throw error;
  }
}

/**
 * Get a child's profile by ID
 */
export async function getChildProfile(childId: string): Promise<ChildProfile | null>  {
  const supabase = await getSbClient();
  try {
    const { data, error } = await (supabase
      .from('user_profiles')
      .select('id, user_id, family_id, role, status, created_at, updated_at')
      .eq('user_id', childId)
      .single() as any);

    if (error) {
      if ((error as any).code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching child profile:', error);
    throw error;
  }
}

/**
 * Approve a pending child
 */
export async function approveChild(
  childId: string,
  familyId: string,
  parentId: string
): Promise<void>  {
  const supabase = await getSbClient();
  try {
    // Verify child exists and is pending
    const profile = await getChildProfile(childId);
    if (!profile) throw new Error('Child profile not found');
    if (profile.status !== 'pending_approval') {
      throw new Error('Child is not pending approval');
    }
    if (profile.family_id !== familyId) {
      throw new Error('Child does not belong to this family');
    }

    // Verify parent owns this family
    const { data: family, error: familyError } = await (supabase
      .from('families')
      .select('id')
      .eq('id', familyId)
      .eq('created_by', parentId)
      .single() as any);

    if (familyError || !family) {
      throw new Error('You do not have permission to approve children in this family');
    }

    // Update child profile status to active
    const sbClient = supabase as any;
    const updateResult = await sbClient
      .from('user_profiles')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', childId);

    if (updateResult.error) throw updateResult.error;

    // Create audit record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auditResult = await (supabase
      .from('child_approvals')
      .insert({
        child_id: childId,
        family_id: familyId,
        action: 'approved',
        approved_by: parentId,
        created_at: new Date().toISOString(),
      }) as any);

    if (auditResult.error) throw auditResult.error;
  } catch (error) {
    console.error('Error approving child:', error);
    throw error;
  }
}

/**
 * Reject a pending child
 */
export async function rejectChild(
  childId: string,
  familyId: string,
  parentId: string,
  reason?: string
): Promise<void>  {
  const supabase = await getSbClient();
  try {
    // Verify child exists
    const profile = await getChildProfile(childId);
    if (!profile) throw new Error('Child profile not found');
    if (profile.family_id !== familyId) {
      throw new Error('Child does not belong to this family');
    }

    // Verify parent owns this family
    const { data: family, error: familyError } = await (supabase
      .from('families')
      .select('id')
      .eq('id', familyId)
      .eq('created_by', parentId)
      .single() as any);

    if (familyError || !family) {
      throw new Error('You do not have permission to manage children in this family');
    }

    // Soft delete: mark as rejected
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sbClient2 = supabase as any;
    const updateResult = await sbClient2
      .from('user_profiles')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('user_id', childId);

    if (updateResult.error) throw updateResult.error;

    // Create audit record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auditResult = await (supabase
      .from('child_approvals')
      .insert({
        child_id: childId,
        family_id: familyId,
        action: 'rejected',
        approved_by: parentId,
        reason: reason || null,
        created_at: new Date().toISOString(),
      }) as any);

    if (auditResult.error) throw auditResult.error;
  } catch (error) {
    console.error('Error rejecting child:', error);
    throw error;
  }
}

/**
 * Get approval history for a family
 */
export async function getApprovalHistory(
  familyId: string,
  action?: 'approved' | 'rejected'
): Promise<ApprovalRecord[]>  {
  const supabase = await getSbClient();
  try {
    let query: any = supabase
      .from('child_approvals')
      .select('id, child_id, family_id, action, approved_by, reason, created_at')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching approval history:', error);
    throw error;
  }
}

/**
 * Get approval statistics for a family
 */
export async function getApprovalStats(familyId: string): Promise<ApprovalStats>  {
  const supabase = await getSbClient();
  try {
    const { data, error } = await (supabase
      .from('user_profiles')
      .select('status')
      .eq('family_id', familyId) as any);

    if (error) throw error;

    const stats: ApprovalStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    data?.forEach((profile: any) => {
      if (profile.status === 'pending_approval') stats.pending++;
      else if (profile.status === 'active') stats.approved++;
      else if (profile.status === 'rejected') stats.rejected++;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    throw error;
  }
}

/**
 * Get child's approval status
 */
export async function getChildApprovalStatus(childId: string): Promise<string>  {
  const supabase = await getSbClient();
  try {
    const profile = await getChildProfile(childId);
    return profile?.status || 'not_found';
  } catch (error) {
    console.error('Error fetching child approval status:', error);
    throw error;
  }
}
