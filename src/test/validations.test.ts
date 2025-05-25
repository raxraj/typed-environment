import TypedEnv from '../index';
import {EnvSchema} from '../types';
import {
  InvalidStringLengthError,
  InvalidPatternError,
  InvalidNumberRangeError,
  CustomValidationError,
} from '../utils/envError';

describe('Enhanced Validation Tests', () => {
  describe('String Validations', () => {
    it('should validate minimum string length', () => {
      const schema: EnvSchema = {
        SHORT_STRING: {type: 'string', required: true, minLength: 5},
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({SHORT_STRING: 'hello'}, schema);
      expect(env['parsedEnvironment'].SHORT_STRING).toBe('hello');

      // Invalid case
      expect(() => env.parse({SHORT_STRING: 'hi'}, schema)).toThrow(
        InvalidStringLengthError,
      );
    });

    it('should validate maximum string length', () => {
      const schema: EnvSchema = {
        LONG_STRING: {type: 'string', required: true, maxLength: 10},
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({LONG_STRING: 'short'}, schema);
      expect(env['parsedEnvironment'].LONG_STRING).toBe('short');

      // Invalid case
      expect(() =>
        env.parse({LONG_STRING: 'this is a very long string'}, schema),
      ).toThrow(InvalidStringLengthError);
    });

    it('should validate string length range', () => {
      const schema: EnvSchema = {
        RANGED_STRING: {
          type: 'string',
          required: true,
          minLength: 3,
          maxLength: 8,
        },
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({RANGED_STRING: 'valid'}, schema);
      expect(env['parsedEnvironment'].RANGED_STRING).toBe('valid');

      // Too short
      expect(() => env.parse({RANGED_STRING: 'hi'}, schema)).toThrow(
        InvalidStringLengthError,
      );

      // Too long
      expect(() => env.parse({RANGED_STRING: 'toolongstring'}, schema)).toThrow(
        InvalidStringLengthError,
      );
    });

    it('should validate regex patterns', () => {
      const schema: EnvSchema = {
        EMAIL: {
          type: 'string',
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        PORT: {type: 'string', required: true, pattern: '^[0-9]+$'},
      };
      const env = new TypedEnv(schema);

      // Valid cases
      env.parse({EMAIL: 'test@example.com', PORT: '3000'}, schema);
      expect(env['parsedEnvironment'].EMAIL).toBe('test@example.com');
      expect(env['parsedEnvironment'].PORT).toBe('3000');

      // Invalid email
      expect(() =>
        env.parse({EMAIL: 'invalid-email', PORT: '3000'}, schema),
      ).toThrow(InvalidPatternError);

      // Invalid port
      expect(() =>
        env.parse({EMAIL: 'test@example.com', PORT: 'abc'}, schema),
      ).toThrow(InvalidPatternError);
    });

    it('should validate custom string validators', () => {
      const schema: EnvSchema = {
        CUSTOM_STRING: {
          type: 'string',
          required: true,
          customValidator: (value: string) => value.startsWith('prefix_'),
        },
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({CUSTOM_STRING: 'prefix_valid'}, schema);
      expect(env['parsedEnvironment'].CUSTOM_STRING).toBe('prefix_valid');

      // Invalid case
      expect(() => env.parse({CUSTOM_STRING: 'invalid'}, schema)).toThrow(
        CustomValidationError,
      );
    });
  });

  describe('Number Validations', () => {
    it('should validate minimum number value', () => {
      const schema: EnvSchema = {
        PORT: {type: 'number', required: true, min: 1000},
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({PORT: '3000'}, schema);
      expect(env['parsedEnvironment'].PORT).toBe(3000);

      // Invalid case
      expect(() => env.parse({PORT: '500'}, schema)).toThrow(
        InvalidNumberRangeError,
      );
    });

    it('should validate maximum number value', () => {
      const schema: EnvSchema = {
        PORT: {type: 'number', required: true, max: 65535},
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({PORT: '8080'}, schema);
      expect(env['parsedEnvironment'].PORT).toBe(8080);

      // Invalid case
      expect(() => env.parse({PORT: '70000'}, schema)).toThrow(
        InvalidNumberRangeError,
      );
    });

    it('should validate number range', () => {
      const schema: EnvSchema = {
        PORT: {type: 'number', required: true, min: 1000, max: 65535},
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({PORT: '3000'}, schema);
      expect(env['parsedEnvironment'].PORT).toBe(3000);

      // Too small
      expect(() => env.parse({PORT: '500'}, schema)).toThrow(
        InvalidNumberRangeError,
      );

      // Too large
      expect(() => env.parse({PORT: '70000'}, schema)).toThrow(
        InvalidNumberRangeError,
      );
    });

    it('should validate custom number validators', () => {
      const schema: EnvSchema = {
        EVEN_NUMBER: {
          type: 'number',
          required: true,
          customValidator: (value: number) => value % 2 === 0,
        },
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({EVEN_NUMBER: '42'}, schema);
      expect(env['parsedEnvironment'].EVEN_NUMBER).toBe(42);

      // Invalid case
      expect(() => env.parse({EVEN_NUMBER: '43'}, schema)).toThrow(
        CustomValidationError,
      );
    });
  });

  describe('Boolean Validations', () => {
    it('should validate custom boolean validators', () => {
      const schema: EnvSchema = {
        MUST_BE_TRUE: {
          type: 'boolean',
          required: true,
          customValidator: (value: boolean) => value === true,
        },
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({MUST_BE_TRUE: 'true'}, schema);
      expect(env['parsedEnvironment'].MUST_BE_TRUE).toBe(true);

      // Invalid case
      expect(() => env.parse({MUST_BE_TRUE: 'false'}, schema)).toThrow(
        CustomValidationError,
      );
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle multiple validations on a single field', () => {
      const schema: EnvSchema = {
        COMPLEX_STRING: {
          type: 'string',
          required: true,
          minLength: 8,
          maxLength: 20,
          pattern: /^[a-zA-Z0-9_]+$/,
          customValidator: (value: string) => !value.includes('forbidden'),
        },
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({COMPLEX_STRING: 'valid_string123'}, schema);
      expect(env['parsedEnvironment'].COMPLEX_STRING).toBe('valid_string123');

      // Too short
      expect(() => env.parse({COMPLEX_STRING: 'short'}, schema)).toThrow(
        InvalidStringLengthError,
      );

      // Invalid pattern
      expect(() =>
        env.parse({COMPLEX_STRING: 'invalid-string!'}, schema),
      ).toThrow(InvalidPatternError);

      // Custom validation failure
      expect(() =>
        env.parse({COMPLEX_STRING: 'forbidden_string'}, schema),
      ).toThrow(CustomValidationError);
    });

    it('should handle real-world port validation example', () => {
      const schema: EnvSchema = {
        SERVER_PORT: {
          type: 'number',
          required: true,
          min: 1000,
          max: 65535,
          customValidator: (port: number) => port !== 3000, // Reserved for dev
        },
      };
      const env = new TypedEnv(schema);

      // Valid case
      env.parse({SERVER_PORT: '8080'}, schema);
      expect(env['parsedEnvironment'].SERVER_PORT).toBe(8080);

      // Reserved port
      expect(() => env.parse({SERVER_PORT: '3000'}, schema)).toThrow(
        CustomValidationError,
      );
    });
  });
});
