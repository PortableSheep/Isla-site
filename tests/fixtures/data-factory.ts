import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  type: 'parent' | 'child';
  parentId?: string;
}

export interface TestFamily {
  id: string;
  parentId: string;
  childrenIds: string[];
}

/**
 * Create a Supabase client for test operations
 */
export function getSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Generate a test parent user
 */
export function generateParentUser(): Omit<TestUser, 'id'> {
  const email = faker.internet.email();
  return {
    email,
    password: `TestPassword123!${Math.random().toString(36).substring(7)}`,
    type: 'parent',
  };
}

/**
 * Generate a test child user
 */
export function generateChildUser(parentId: string): Omit<TestUser, 'id'> {
  return {
    email: faker.internet.email(),
    password: `TestPassword123!${Math.random().toString(36).substring(7)}`,
    type: 'child',
    parentId,
  };
}

/**
 * Generate test child profile data
 */
export function generateChildProfile() {
  return {
    name: faker.person.firstName(),
    age: faker.number.int({ min: 5, max: 18 }),
    bio: faker.lorem.sentence(),
  };
}

/**
 * Generate test post content
 */
export function generatePostContent() {
  return faker.lorem.paragraphs(1);
}

/**
 * Generate test post with replies
 */
export function generatePostWithReplies() {
  return {
    content: generatePostContent(),
    replies: [
      { content: generatePostContent() },
      { content: generatePostContent() },
    ],
  };
}

/**
 * Generate notification preference data
 */
export function generateNotificationPreferences() {
  return {
    email_updates: faker.datatype.boolean(),
    email_replies: faker.datatype.boolean(),
    email_children: faker.datatype.boolean(),
    in_app_updates: faker.datatype.boolean(),
    in_app_replies: faker.datatype.boolean(),
    in_app_children: faker.datatype.boolean(),
    email_frequency: faker.helpers.arrayElement(['immediate', 'digest', 'off']),
    digest_day: faker.helpers.arrayElement([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]),
    digest_time: `${faker.number.int({ min: 0, max: 23 }).toString().padStart(2, '0')}:00`,
  };
}

/**
 * Generate family seed data
 */
export function generateFamilyData() {
  return {
    name: faker.company.name(),
    description: faker.lorem.sentence(),
  };
}
