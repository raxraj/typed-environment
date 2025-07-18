import TypedEnv from '../index';
import * as path from 'path';
import * as fs from 'fs';

describe('Nested Schema Support', () => {
  const tempEnvPath = path.resolve(process.cwd(), '.env.test');

  afterEach(() => {
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }
  });

  describe('Basic Nested Schema', () => {
    it('should parse flat environment variables into nested structure', () => {
      fs.writeFileSync(
        tempEnvPath,
        `DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_SSL=true
API_TIMEOUT=30000
API_RETRIES=3`,
      );

      const schema = {
        database: {
          host: {type: 'string', required: true},
          port: {type: 'number', required: true},
          ssl: {type: 'boolean', default: false},
        },
        api: {
          timeout: {type: 'number', default: 5000},
          retries: {type: 'number', default: 1},
        },
      } as any;

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect((result as any).database.host).toBe('localhost');
      expect((result as any).database.port).toBe(5432);
      expect((result as any).database.ssl).toBe(true);
      expect((result as any).api.timeout).toBe(30000);
      expect((result as any).api.retries).toBe(3);
    });

    it('should use default values for missing nested fields', () => {
      fs.writeFileSync(
        tempEnvPath,
        `DATABASE_HOST=localhost
DATABASE_PORT=5432`,
      );

      const schema = {
        database: {
          host: {type: 'string', required: true},
          port: {type: 'number', required: true},
          ssl: {type: 'boolean', default: false},
          timeout: {type: 'number', default: 30000},
        },
      } as any;

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect((result as any).database.host).toBe('localhost');
      expect((result as any).database.port).toBe(5432);
      expect((result as any).database.ssl).toBe(false);
      expect((result as any).database.timeout).toBe(30000);
    });
  });

  describe('Mixed Flat and Nested Schema', () => {
    it('should handle both flat and nested fields in the same schema', () => {
      fs.writeFileSync(
        tempEnvPath,
        `NODE_ENV=production
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
REDIS_HOST=redis.localhost
REDIS_PORT=6379`,
      );

      const schema = {
        NODE_ENV: {type: 'string', default: 'development'},
        PORT: {type: 'number', default: 8080},
        database: {
          host: {type: 'string', required: true},
          port: {type: 'number', required: true},
        },
        redis: {
          host: {type: 'string', required: true},
          port: {type: 'number', default: 6379},
        },
      } as any;

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect((result as any).NODE_ENV).toBe('production');
      expect((result as any).PORT).toBe(3000);
      expect((result as any).database.host).toBe('localhost');
      expect((result as any).database.port).toBe(5432);
      expect((result as any).redis.host).toBe('redis.localhost');
      expect((result as any).redis.port).toBe(6379);
    });
  });

  describe('Validation with Nested Schema', () => {
    it('should validate required fields in nested schemas', () => {
      fs.writeFileSync(
        tempEnvPath,
        `DATABASE_HOST=localhost
# DATABASE_PORT is missing but required`,
      );

      const schema = {
        database: {
          host: {type: 'string', required: true},
          port: {type: 'number', required: true},
        },
      } as any;

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');

      expect(() => env.init()).toThrow(
        'Environment variable "DATABASE_PORT" is required but is missing',
      );
    });

    it('should validate enum choices in nested schemas', () => {
      fs.writeFileSync(
        tempEnvPath,
        `DATABASE_TYPE=mysql
DATABASE_HOST=localhost`,
      );

      const schema = {
        database: {
          type: {
            type: 'string',
            required: true,
            choices: ['postgres', 'mysql', 'sqlite'],
          },
          host: {type: 'string', required: true},
        },
      } as any;

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect((result as any).database.type).toBe('mysql');
      expect((result as any).database.host).toBe('localhost');
    });
  });
});
