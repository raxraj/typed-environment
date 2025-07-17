import TypedEnv from '../index';
import {EnvSchema} from '../types';
import {InvalidJSONError, CustomValidationError} from '../utils/envError';
import * as path from 'path';
import * as fs from 'fs';

describe('Object Type Support', () => {
  const tempEnvPath = path.resolve(process.cwd(), '.env.test');

  afterEach(() => {
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }
  });

  describe('Object Parsing', () => {
    it('should parse valid JSON objects from env file', () => {
      fs.writeFileSync(
        tempEnvPath,
        `USER_CONFIG={"name": "John", "age": 30, "isActive": true}
API_SETTINGS={"endpoint": "https://api.example.com", "timeout": 5000}
ARRAY_DATA=[1, 2, 3, "test"]
NESTED_OBJECT={"user": {"name": "Jane", "preferences": {"theme": "dark"}}}`,
      );

      const schema: EnvSchema = {
        USER_CONFIG: {type: 'object', required: true},
        API_SETTINGS: {type: 'object', required: true},
        ARRAY_DATA: {type: 'object', required: true},
        NESTED_OBJECT: {type: 'object', required: true},
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect(result.USER_CONFIG).toEqual({
        name: 'John',
        age: 30,
        isActive: true,
      });
      expect(result.API_SETTINGS).toEqual({
        endpoint: 'https://api.example.com',
        timeout: 5000,
      });
      expect(result.ARRAY_DATA).toEqual([1, 2, 3, 'test']);
      expect(result.NESTED_OBJECT).toEqual({
        user: {
          name: 'Jane',
          preferences: {theme: 'dark'},
        },
      });
    });

    it('should handle quoted JSON objects', () => {
      fs.writeFileSync(
        tempEnvPath,
        `CONFIG='{"key": "value", "number": 42}'
SETTINGS='{"nested": {"prop": "escaped_value"}}'`,
      );

      const schema: EnvSchema = {
        CONFIG: {type: 'object', required: true},
        SETTINGS: {type: 'object', required: true},
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect(result.CONFIG).toEqual({key: 'value', number: 42});
      expect(result.SETTINGS).toEqual({nested: {prop: 'escaped_value'}});
    });

    it('should use default values for optional object fields', () => {
      const defaultConfig = {theme: 'light', language: 'en'};

      const schema: EnvSchema = {
        USER_PREFERENCES: {
          type: 'object',
          required: false,
          default: defaultConfig,
        },
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test'); // Non-existent file
      const result = env.init();

      expect(result.USER_PREFERENCES).toEqual(defaultConfig);
    });

    it('should throw InvalidJSONError for malformed JSON', () => {
      fs.writeFileSync(
        tempEnvPath,
        'BAD_JSON={"key": value, "missing_quotes": true}',
      );

      const schema: EnvSchema = {
        BAD_JSON: {type: 'object', required: true},
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');

      expect(() => env.init()).toThrow(InvalidJSONError);
    });

    it('should throw InvalidJSONError for incomplete JSON', () => {
      fs.writeFileSync(tempEnvPath, 'INCOMPLETE_JSON={"key": "value"');

      const schema: EnvSchema = {
        INCOMPLETE_JSON: {type: 'object', required: true},
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');

      expect(() => env.init()).toThrow(InvalidJSONError);
    });

    it('should handle empty objects', () => {
      fs.writeFileSync(tempEnvPath, 'EMPTY_OBJECT={}');

      const schema: EnvSchema = {
        EMPTY_OBJECT: {type: 'object', required: true},
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect(result.EMPTY_OBJECT).toEqual({});
    });

    it('should handle empty arrays', () => {
      fs.writeFileSync(tempEnvPath, 'EMPTY_ARRAY=[]');

      const schema: EnvSchema = {
        EMPTY_ARRAY: {type: 'object', required: true},
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect(result.EMPTY_ARRAY).toEqual([]);
    });

    it('should validate custom object validators', () => {
      fs.writeFileSync(tempEnvPath, 'CONFIG={"requiredField": "value"}');

      const schema: EnvSchema = {
        CONFIG: {
          type: 'object',
          required: true,
          customValidator: (value: object) => {
            return (value as any).requiredField !== undefined;
          },
        },
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect(result.CONFIG).toEqual({requiredField: 'value'});
    });

    it('should fail custom object validation', () => {
      fs.writeFileSync(tempEnvPath, 'CONFIG={"wrongField": "value"}');

      const schema: EnvSchema = {
        CONFIG: {
          type: 'object',
          required: true,
          customValidator: (value: object) => {
            return (value as any).requiredField !== undefined;
          },
        },
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');

      expect(() => env.init()).toThrow(CustomValidationError);
    });
  });

  describe('Object Enum Choices', () => {
    it('should validate object enum choices', () => {
      const config1 = {type: 'config', version: 1};
      const config2 = {type: 'config', version: 2};

      fs.writeFileSync(tempEnvPath, `CONFIG=${JSON.stringify(config1)}`);

      const schema: EnvSchema = {
        CONFIG: {
          type: 'object',
          required: true,
          choices: [config1, config2],
        },
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect(result.CONFIG).toEqual(config1);
    });

    it('should fail object enum validation with invalid choice', () => {
      const config1 = {type: 'config', version: 1};
      const config2 = {type: 'config', version: 2};
      const invalidConfig = {type: 'config', version: 3};

      fs.writeFileSync(tempEnvPath, `CONFIG=${JSON.stringify(invalidConfig)}`);

      const schema: EnvSchema = {
        CONFIG: {
          type: 'object',
          required: true,
          choices: [config1, config2],
        },
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');

      expect(() => env.init()).toThrow(
        'Environment variable "CONFIG" must be one of',
      );
    });
  });

  describe('Integration with Other Types', () => {
    it('should handle mixed types including objects', () => {
      fs.writeFileSync(
        tempEnvPath,
        `STRING_VALUE=hello
NUMBER_VALUE=42
BOOLEAN_VALUE=true
OBJECT_VALUE={"key": "value", "number": 100}`,
      );

      const schema: EnvSchema = {
        STRING_VALUE: {type: 'string', required: true},
        NUMBER_VALUE: {type: 'number', required: true},
        BOOLEAN_VALUE: {type: 'boolean', required: true},
        OBJECT_VALUE: {type: 'object', required: true},
      };

      const env = new TypedEnv(schema);
      env.configEnvironment('.env.test');
      const result = env.init();

      expect(result.STRING_VALUE).toBe('hello');
      expect(result.NUMBER_VALUE).toBe(42);
      expect(result.BOOLEAN_VALUE).toBe(true);
      expect(result.OBJECT_VALUE).toEqual({key: 'value', number: 100});
    });
  });
});
