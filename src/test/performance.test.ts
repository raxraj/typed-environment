import TypedEnv from '../index';
import {EnvSchema} from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance Tests', () => {
  const tempEnvPath = path.resolve(process.cwd(), '.env.test');

  beforeEach(() => {
    // Create a test .env file
    fs.writeFileSync(
      tempEnvPath,
      'TEST_STRING=value\nTEST_NUMBER=42\nTEST_BOOLEAN=true',
    );
  });

  afterEach(() => {
    // Clean up temp files after tests
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }
  });

  it('should cache frozen objects and return the same reference on subsequent calls', () => {
    const schema: EnvSchema = {
      TEST_STRING: {type: 'string', required: true},
      TEST_NUMBER: {type: 'number', required: true},
      TEST_BOOLEAN: {type: 'boolean', required: true},
    };

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');
    env.init();

    // First calls should return frozen objects
    const firstEnvironment = env.getEnvironment();
    const firstParsedEnvironment = env.getParsedEnvironment();

    // Subsequent calls should return the same cached frozen objects
    const secondEnvironment = env.getEnvironment();
    const secondParsedEnvironment = env.getParsedEnvironment();

    // Objects should be the same reference (cached)
    expect(firstEnvironment).toBe(secondEnvironment);
    expect(firstParsedEnvironment).toBe(secondParsedEnvironment);

    // Objects should be frozen
    expect(Object.isFrozen(firstEnvironment)).toBe(true);
    expect(Object.isFrozen(firstParsedEnvironment)).toBe(true);
    expect(Object.isFrozen(secondEnvironment)).toBe(true);
    expect(Object.isFrozen(secondParsedEnvironment)).toBe(true);
  });

  it('should handle getEnvironment() calls before init() gracefully', () => {
    const schema: EnvSchema = {
      TEST_STRING: {type: 'string', required: true},
    };

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');

    // Should return frozen environment even before init()
    const environment = env.getEnvironment();
    const parsedEnvironment = env.getParsedEnvironment();

    expect(Object.isFrozen(environment)).toBe(true);
    expect(Object.isFrozen(parsedEnvironment)).toBe(true);
  });

  it('should demonstrate performance improvement with repeated calls', () => {
    const schema: EnvSchema = {
      TEST_STRING: {type: 'string', required: true},
      TEST_NUMBER: {type: 'number', required: true},
      TEST_BOOLEAN: {type: 'boolean', required: true},
    };

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');
    env.init();

    // Measure time for multiple calls
    const iterations = 1000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      env.getEnvironment();
      env.getParsedEnvironment();
    }

    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;

    // With caching, 1000 calls should be very fast (< 100ms)
    expect(totalTimeMs).toBeLessThan(100);

    // Verify results are still correct
    const environment = env.getEnvironment();
    const parsedEnvironment = env.getParsedEnvironment();

    expect(environment.TEST_STRING).toBe('value');
    expect(parsedEnvironment.TEST_STRING).toBe('value');
    expect(parsedEnvironment.TEST_NUMBER).toBe(42);
    expect(parsedEnvironment.TEST_BOOLEAN).toBe(true);
  });
});
