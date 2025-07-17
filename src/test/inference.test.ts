import TypedEnv from '../index';

describe('Schema Inference Tests', () => {
  describe('Shorthand Schema Support', () => {
    it('should infer string type from string default values', () => {
      const schema = {
        STRING_FIELD: 'default_value',
      } as const;

      const env = new TypedEnv(schema);
      env.parse({STRING_FIELD: 'test_value'}, schema);

      expect(env['parsedEnvironment'].STRING_FIELD).toBe('test_value');
    });

    it('should infer number type from number default values', () => {
      const schema = {
        NUMBER_FIELD: 42,
      } as const;

      const env = new TypedEnv(schema);
      env.parse({NUMBER_FIELD: '100'}, schema);

      expect(env['parsedEnvironment'].NUMBER_FIELD).toBe(100);
    });

    it('should infer boolean type from boolean default values', () => {
      const schema = {
        BOOLEAN_FIELD: true,
      } as const;

      const env = new TypedEnv(schema);
      env.parse({BOOLEAN_FIELD: 'false'}, schema);

      expect(env['parsedEnvironment'].BOOLEAN_FIELD).toBe(false);
    });

    it('should use default values when environment variables are not provided', () => {
      const schema = {
        STRING_FIELD: 'default_string',
        NUMBER_FIELD: 42,
        BOOLEAN_FIELD: true,
      } as const;

      const env = new TypedEnv(schema);
      env.parse({}, schema);

      expect(env['parsedEnvironment'].STRING_FIELD).toBe('default_string');
      expect(env['parsedEnvironment'].NUMBER_FIELD).toBe(42);
      expect(env['parsedEnvironment'].BOOLEAN_FIELD).toBe(true);
    });

    it('should support required fields without explicit types', () => {
      const schema = {
        REQUIRED_FIELD: {required: true},
      } as const;

      const env = new TypedEnv(schema);
      env.parse({REQUIRED_FIELD: 'test_value'}, schema);

      expect(env['parsedEnvironment'].REQUIRED_FIELD).toBe('test_value');
    });

    it('should throw error for missing required fields', () => {
      const schema = {
        REQUIRED_FIELD: {required: true},
      } as const;

      const env = new TypedEnv(schema);
      expect(() => env.parse({}, schema)).toThrow();
    });

    it('should support required fields with enum choices', () => {
      const schema = {
        ENV_FIELD: {required: true, choices: ['dev', 'prod', 'test']},
      } as const;

      const env = new TypedEnv(schema);
      env.parse({ENV_FIELD: 'dev'}, schema);

      expect(env['parsedEnvironment'].ENV_FIELD).toBe('dev');
    });

    it('should validate enum choices for required fields', () => {
      const schema = {
        ENV_FIELD: {required: true, choices: ['dev', 'prod', 'test']},
      } as const;

      const env = new TypedEnv(schema);
      expect(() => env.parse({ENV_FIELD: 'invalid'}, schema)).toThrow();
    });

    it('should support mixed shorthand and full schema definitions', () => {
      const schema = {
        // Shorthand syntax
        DATABASE_URL: 'postgresql://localhost',
        PORT: 3000,
        DEBUG: false,
        REQUIRED_FIELD: {required: true},

        // Full syntax
        API_KEY: {
          type: 'string',
          required: true,
          minLength: 10,
        },
        MAX_CONNECTIONS: {
          type: 'number',
          default: 100,
          min: 1,
          max: 1000,
        },
      } as const;

      const env = new TypedEnv(schema);
      env.parse(
        {
          DATABASE_URL: 'postgresql://prod-db',
          PORT: '8080',
          DEBUG: 'true',
          REQUIRED_FIELD: 'value',
          API_KEY: 'secret-api-key-123',
          MAX_CONNECTIONS: '200',
        },
        schema,
      );

      expect(env['parsedEnvironment'].DATABASE_URL).toBe(
        'postgresql://prod-db',
      );
      expect(env['parsedEnvironment'].PORT).toBe(8080);
      expect(env['parsedEnvironment'].DEBUG).toBe(true);
      expect(env['parsedEnvironment'].REQUIRED_FIELD).toBe('value');
      expect(env['parsedEnvironment'].API_KEY).toBe('secret-api-key-123');
      expect(env['parsedEnvironment'].MAX_CONNECTIONS).toBe(200);
    });
  });

  describe('Type Inference in Action', () => {
    it('should maintain type safety with shorthand syntax', () => {
      const schema = {
        STRING_FIELD: 'default',
        NUMBER_FIELD: 42,
        BOOLEAN_FIELD: true,
        REQUIRED_STRING: {required: true},
        ENUM_FIELD: {required: true, choices: ['a', 'b', 'c']},
      } as const;

      const env = new TypedEnv(schema);
      env.parse(
        {
          REQUIRED_STRING: 'test_value',
          ENUM_FIELD: 'a',
        },
        schema,
      );

      const result = env['parsedEnvironment'];

      // These types should be inferred correctly
      // STRING_FIELD: string
      // NUMBER_FIELD: number
      // BOOLEAN_FIELD: boolean
      // REQUIRED_STRING: string
      // ENUM_FIELD: 'a' | 'b' | 'c'

      // The TypeScript compiler should catch type errors here
      expect(typeof result.STRING_FIELD).toBe('string');
      expect(typeof result.NUMBER_FIELD).toBe('number');
      expect(typeof result.BOOLEAN_FIELD).toBe('boolean');
      expect(typeof result.REQUIRED_STRING).toBe('string');
      expect(result.ENUM_FIELD).toBe('a');
    });

    it('should work with complex real-world scenarios', () => {
      const schema = {
        // Database configuration
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_SSL: false,
        DB_NAME: {required: true},

        // Server configuration
        SERVER_PORT: 3000,
        SERVER_HOST: '0.0.0.0',

        // Environment
        NODE_ENV: {
          required: true,
          choices: ['development', 'production', 'test'],
        },

        // Feature flags
        ENABLE_LOGGING: true,
        ENABLE_METRICS: false,

        // Security
        JWT_SECRET: {required: true},
        API_RATE_LIMIT: 100,
      } as const;

      const env = new TypedEnv(schema);
      env.parse(
        {
          DB_NAME: 'myapp_db',
          NODE_ENV: 'production',
          JWT_SECRET: 'my-secret-key',
          ENABLE_LOGGING: 'false',
          SERVER_PORT: '8080',
        },
        schema,
      );

      const result = env['parsedEnvironment'];

      expect(result.DB_HOST).toBe('localhost');
      expect(result.DB_PORT).toBe(5432);
      expect(result.DB_SSL).toBe(false);
      expect(result.DB_NAME).toBe('myapp_db');
      expect(result.SERVER_PORT).toBe(8080);
      expect(result.SERVER_HOST).toBe('0.0.0.0');
      expect(result.NODE_ENV).toBe('production');
      expect(result.ENABLE_LOGGING).toBe(false);
      expect(result.ENABLE_METRICS).toBe(false);
      expect(result.JWT_SECRET).toBe('my-secret-key');
      expect(result.API_RATE_LIMIT).toBe(100);
    });
  });
});
