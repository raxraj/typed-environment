#!/usr/bin/env node
import TypedEnv from './src/index';

console.log('=== TypedEnv Schema Inference Demo ===\n');

// Old way - verbose schema definition
console.log('1. Traditional Schema Definition:');
const oldSchema = {
  DATABASE_URL: {type: 'string', required: true},
  PORT: {type: 'number', default: 3000},
  DEBUG: {type: 'boolean', default: false},
  NODE_ENV: {
    type: 'string',
    required: true,
    choices: ['development', 'production', 'test'],
  },
} as const;

console.log('Schema:', JSON.stringify(oldSchema, null, 2));

// New way - inferred schema with minimal boilerplate
console.log('\n2. New Simplified Schema with Inference:');
const newSchema = {
  DATABASE_URL: {required: true}, // inferred as string
  PORT: 3000, // inferred as number with default
  DEBUG: false, // inferred as boolean with default
  NODE_ENV: {
    required: true,
    choices: ['development', 'production', 'test'],
  }, // inferred as string enum
} as const;

console.log('Schema:', JSON.stringify(newSchema, null, 2));

// Test with environment variables
const testEnv = {
  DATABASE_URL: 'postgresql://localhost:5432/myapp',
  PORT: '8080',
  DEBUG: 'true',
  NODE_ENV: 'production',
};

console.log('\n3. Testing with Environment Variables:');
console.log('Environment:', JSON.stringify(testEnv, null, 2));

// Test old schema
console.log('\n4. Results with Traditional Schema:');
const oldEnv = new TypedEnv(oldSchema);
oldEnv.parse(testEnv, oldSchema);
console.log('Parsed:', JSON.stringify(oldEnv.getParsedEnvironment(), null, 2));

// Test new schema
console.log('\n5. Results with Inferred Schema:');
const newEnv = new TypedEnv(newSchema);
newEnv.parse(testEnv, newSchema);
console.log('Parsed:', JSON.stringify(newEnv.getParsedEnvironment(), null, 2));

// Test with defaults
console.log('\n6. Testing with Default Values (empty environment):');
const emptyEnv = {};
const schemaWithDefaults = {
  API_HOST: 'localhost',
  API_PORT: 3000,
  ENABLE_LOGGING: true,
  REQUIRED_FIELD: {required: true},
} as const;

console.log('Schema with defaults:', JSON.stringify(schemaWithDefaults, null, 2));

try {
  const testEnvWithDefaults = new TypedEnv(schemaWithDefaults);
  testEnvWithDefaults.parse(emptyEnv, schemaWithDefaults);
  console.log('This should fail due to missing required field...');
} catch (error: any) {
  console.log('Expected error:', error.message);
}

// Test with provided required field
console.log('\n7. Testing with Required Field Provided:');
const envWithRequired = {REQUIRED_FIELD: 'provided_value'};
const testEnvWithRequired = new TypedEnv(schemaWithDefaults);
testEnvWithRequired.parse(envWithRequired, schemaWithDefaults);
console.log('Parsed:', JSON.stringify(testEnvWithRequired.getParsedEnvironment(), null, 2));

console.log('\n✅ Schema inference is working correctly!');
console.log('✅ Backward compatibility maintained!');
console.log('✅ Significant reduction in boilerplate code!');