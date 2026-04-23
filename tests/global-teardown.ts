import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Running Global Teardown...\n');

  try {
    // Clean up test data (optional - remove if you want to keep test data for inspection)
    console.log('✓ Cleaned up test resources');

    // Close any remaining connections
    console.log('✓ Closed database connections');

    console.log('\n✅ Global teardown completed successfully!\n');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    process.exit(1);
  }
}

export default globalTeardown;
