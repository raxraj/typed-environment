import TypedEnv from '../index';

describe('README Example Type Inference', () => {
  it('should correctly infer types for the README example', () => {
    // Test the README example to ensure proper type inference
    const schema = {
      DATABASE_URL: {type: 'string', required: true},
      PORT: {type: 'number', default: 3000},
      DEBUG: {type: 'boolean', default: false},
      NODE_ENV: {
        type: 'string',
        required: true,
        choices: ['development', 'production', 'test'],
      },
    } as const;

    const env = new TypedEnv(schema);
    // Mock environment for testing
    env['environment'] = {
      DATABASE_URL: 'postgresql://localhost:5432/mydb',
      NODE_ENV: 'development',
    };

    const config = env.init();

    // Verify that types are correctly inferred
    // DATABASE_URL should be string (required)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dbUrl: string = config.DATABASE_URL;

    // PORT should be number (has default, so not optional)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const port: number = config.PORT;

    // DEBUG should be boolean (has default, so not optional)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const debug: boolean = config.DEBUG;

    // NODE_ENV should be the literal union type (required with choices)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const nodeEnv: 'development' | 'production' | 'test' = config.NODE_ENV;

    // Runtime checks
    expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/mydb');
    expect(config.PORT).toBe(3000);
    expect(config.DEBUG).toBe(false);
    expect(config.NODE_ENV).toBe('development');

    // Type checks
    expect(typeof config.DATABASE_URL).toBe('string');
    expect(typeof config.PORT).toBe('number');
    expect(typeof config.DEBUG).toBe('boolean');
    expect(typeof config.NODE_ENV).toBe('string');
  });
});
