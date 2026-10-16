import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.js', 'tests/unit/**/*.test.js'],
    environment: 'node',
    pool: 'forks',
    testTimeout: 20000,
    hookTimeout: 60000,
  },
})
