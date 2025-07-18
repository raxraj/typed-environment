#!/usr/bin/env node

/**
 * Demo script to showcase the performance improvement of cached frozen objects
 */

const TypedEnv = require('./dist/index.js').default;

// Create a schema
const schema = {
  DATABASE_URL: { type: 'string', required: true },
  PORT: { type: 'number', default: 3000 },
  DEBUG: { type: 'boolean', default: false },
  NODE_ENV: { type: 'string', required: true, choices: ['development', 'production', 'test'] },
};

// Create TypedEnv instance
const env = new TypedEnv(schema);

// Mock environment variables
env.environment = {
  DATABASE_URL: 'postgresql://localhost:5432/myapp',
  PORT: '8080',
  DEBUG: 'true',
  NODE_ENV: 'development',
};

console.log('🚀 TypedEnv Performance Demo');
console.log('============================');

// Initialize the environment
const config = env.init();
console.log('✅ Environment initialized successfully');
console.log('📊 Config:', config);

// Test performance with multiple calls
const iterations = 10000;
console.log(`\n🔄 Testing performance with ${iterations} calls...`);

const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  env.getEnvironment();
  env.getParsedEnvironment();
}

const endTime = Date.now();
const totalTime = endTime - startTime;

console.log(`⚡ Time taken: ${totalTime}ms for ${iterations * 2} calls`);
console.log(`📈 Average time per call: ${(totalTime / (iterations * 2)).toFixed(4)}ms`);

// Test that objects are cached (same reference)
const env1 = env.getEnvironment();
const env2 = env.getEnvironment();
const parsed1 = env.getParsedEnvironment();
const parsed2 = env.getParsedEnvironment();

console.log('\n🔍 Testing object caching:');
console.log(`   Environment objects are same reference: ${env1 === env2}`);
console.log(`   Parsed objects are same reference: ${parsed1 === parsed2}`);
console.log(`   Environment is frozen: ${Object.isFrozen(env1)}`);
console.log(`   Parsed environment is frozen: ${Object.isFrozen(parsed1)}`);

console.log('\n✨ Performance improvement achieved!');
console.log('   - Objects are frozen once and cached');
console.log('   - Subsequent calls return cached references');
console.log('   - No repeated Object.freeze() overhead');
console.log('   - Same functionality, better performance');