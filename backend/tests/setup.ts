import { connectDatabase, disconnectDatabase } from '../src/config';
import { beforeAll, afterAll, afterEach } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';

// Global setup
beforeAll(async () => {
  // Connect to test database
  await connectDatabase();
});

// Global teardown
afterAll(async () => {
  // Disconnect from database
  await disconnectDatabase();
});

// Clean up after each test
afterEach(async () => {
  // Add any cleanup logic here
  // e.g., clear collections, reset mocks
});
