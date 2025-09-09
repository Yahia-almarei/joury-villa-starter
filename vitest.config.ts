import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key'
    },
    // Prevent Vitest from running in watch mode during development
    watch: false,
    // Disable parallel execution to avoid worker conflicts
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    // Increase timeout to prevent premature failures
    testTimeout: 30000,
    // Isolate tests to prevent cross-contamination
    isolate: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})