import TypedEnv from '../index';
import {EnvSchema} from '../types';

describe('Real-world Usage Demo', () => {
  it('should demonstrate the performance improvement in a real-world scenario', () => {
    // Create a realistic schema for a web application
    const schema: EnvSchema = {
      DATABASE_URL: {type: 'string', required: true},
      PORT: {type: 'number', default: 3000},
      DEBUG: {type: 'boolean', default: false},
      NODE_ENV: {
        type: 'string',
        required: true,
        choices: ['development', 'production', 'test'],
      },
      API_KEY: {type: 'string', required: true},
      REDIS_URL: {type: 'string', required: true},
    };

    const env = new TypedEnv(schema);

    // Mock environment
    env['environment'] = {
      DATABASE_URL: 'postgresql://localhost:5432/myapp',
      PORT: '8080',
      DEBUG: 'true',
      NODE_ENV: 'development',
      API_KEY: 'abc123def456',
      REDIS_URL: 'redis://localhost:6379',
    };

    // Initialize
    const config = env.init();

    // Verify correct parsing
    expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/myapp');
    expect(config.PORT).toBe(8080);
    expect(config.DEBUG).toBe(true);
    expect(config.NODE_ENV).toBe('development');

    // Simulate frequent access patterns common in web applications
    const iterations = 100;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      // Simulate middleware accessing environment
      const envVars = env.getEnvironment();
      const parsedVars = env.getParsedEnvironment();

      // Simulate various parts of the app accessing config
      expect(envVars.DATABASE_URL).toBeDefined();
      expect(parsedVars.PORT).toBe(8080);
      expect(parsedVars.DEBUG).toBe(true);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Performance should be excellent
    expect(totalTime).toBeLessThan(50); // Should be very fast

    // Verify caching works
    const env1 = env.getEnvironment();
    const env2 = env.getEnvironment();
    expect(env1).toBe(env2); // Same reference

    // Verify immutability is preserved
    expect(Object.isFrozen(env1)).toBe(true);
    expect(Object.isFrozen(env.getParsedEnvironment())).toBe(true);
  });
});
