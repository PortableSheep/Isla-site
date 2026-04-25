import { getSbClient } from './supabaseClient';

export async function signUp(email: string, password: string) {
  const supabase = await getSbClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password-confirm`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = await getSbClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = await getSbClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const supabase = await getSbClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getSession() {
  const supabase = await getSbClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function resetPassword(email: string) {
  const supabase = await getSbClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password-confirm`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const supabase = await getSbClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

export async function validateEmail(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function validatePassword(password: string): Promise<string | null> {
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
}

// Sends a passwordless magic-link email used by the public wall to let
// visitors persist their display name across devices. The chosen name is
// passed via auth metadata so it lands on the user record on first sign-in.
export async function signInWithMagicLink(email: string, displayName: string) {
  const supabase = await getSbClient();
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { display_name: displayName },
      emailRedirectTo: redirectTo,
    },
  });
  if (error) throw error;
}

// Updates the signed-in user's display_name in auth.users.user_metadata.
// Used to backfill the metadata after a magic-link sign-in completes when
// the local name was set after the link was sent.
export async function updateDisplayName(name: string) {
  const supabase = await getSbClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: name },
  });
  if (error) throw error;
}
