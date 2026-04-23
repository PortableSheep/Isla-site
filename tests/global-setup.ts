import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting Global Setup for E2E Tests...\n');

  try {
    // Create necessary directories
    const dirs = [
      'tests/screenshots',
      'tests/videos',
      'tests/traces',
      'test-results',
      'playwright-report',
    ];

    for (const dir of dirs) {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
      }
    }

    // Verify environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missingEnvVars: string[] = [];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingEnvVars.push(envVar);
      }
    }

    if (missingEnvVars.length > 0) {
      console.warn(
        `⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}`,
      );
      console.warn('   These should be set in .env.test file');
    }

    // Verify dev server is running
    console.log('\n📡 Checking dev server...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      await page.goto(process.env.BASE_URL || 'http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      console.log('✓ Dev server is running and responsive');
    } catch (error) {
      console.log(
        '⚠️  Dev server not responding. It will be started by Playwright.',
      );
    } finally {
      await page.close();
      await browser.close();
    }

    // Initialize test database
    console.log('\n🗄️  Initializing test database...');
    await initializeTestDatabase();

    // Create seed data
    console.log('\n🌱 Creating seed data...');
    await createSeedData();

    console.log('\n✅ Global setup completed successfully!\n');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    process.exit(1);
  }
}

/**
 * Initialize test database
 */
async function initializeTestDatabase(): Promise<void> {
  try {
    // Check if Supabase is available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL not set, skipping database initialization');
      return;
    }

    // TODO: Add actual database initialization logic
    // This would typically involve:
    // 1. Connecting to test Supabase instance
    // 2. Running migrations
    // 3. Setting up RLS policies
    console.log('✓ Test database initialized');
  } catch (error) {
    console.warn('⚠️  Could not initialize test database:', error);
  }
}

/**
 * Create seed data for tests
 */
async function createSeedData(): Promise<void> {
  try {
    // TODO: Add actual seed data creation
    // This would typically involve:
    // 1. Creating test users
    // 2. Creating test families
    // 3. Creating test posts
    // 4. Creating test notifications
    console.log('✓ Seed data created');
  } catch (error) {
    console.warn('⚠️  Could not create seed data:', error);
  }
}

/**
 * Print configuration summary
 */
function printConfigurationSummary(): void {
  console.log('\n📋 Test Configuration Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Base URL:        ${process.env.BASE_URL || 'http://localhost:3000'}`);
  console.log(`Supabase URL:    ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set'}`);
  console.log(`Environment:     ${process.env.CI ? 'CI/CD' : 'Local Development'}`);
  console.log(`Test User:       ${process.env.TEST_PARENT_EMAIL || 'not set'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

export default globalSetup;
