import TypedEnv from '../index';
import {EnvSchema} from '../types';
import {
  InvalidBooleanError,
  InvalidEnumError,
  InvalidTypeError,
  MissingRequiredFieldError,
  UnsupportedTypeError,
} from '../utils/envError';
import * as path from 'path';
import * as fs from 'fs';

describe('File Parsing', () => {
  const tempEnvPath = path.resolve(process.cwd(), '.env.test');

  afterEach(() => {
    // Clean up temp files after tests
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }
  });

  it('should handle quoted values correctly', () => {
    fs.writeFileSync(
      tempEnvPath,
      'QUOTED_VALUE="hello world"\nSINGLE_QUOTED=\'single quotes\'',
    );

    const schema: EnvSchema = {
      QUOTED_VALUE: {type: 'string', required: true},
      SINGLE_QUOTED: {type: 'string', required: true},
    };

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');

    const result = env.init();

    expect(result.QUOTED_VALUE).toBe('hello world');
    expect(result.SINGLE_QUOTED).toBe('single quotes');
  });

  it('should skip lines without equals sign', () => {
    fs.writeFileSync(tempEnvPath, 'VALID_KEY=value\nInvalid Line\n# Comment');

    const schema: EnvSchema = {
      VALID_KEY: {type: 'string', required: true},
    };

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');

    expect(env['environment'].VALID_KEY).toBe('value');
    expect(Object.keys(env['environment']).length).toBe(1);
  });

  it('should handle non-existent env file gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const schema: EnvSchema = {
      TEST: {type: 'string', default: 'fallback'},
    };

    const env = new TypedEnv(schema);
    env.configEnvironment('non-existent-file.env');
    const result = env.init();

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.TEST).toBe('fallback');

    consoleSpy.mockRestore();
  });
});

describe('TypedEnv Class', () => {
  it('should parse .env file correctly', () => {
    const schema: EnvSchema = {
      TEST_STRING: {type: 'string', required: true},
      TEST_NUMBER: {type: 'number', required: false},
    };
    const env = new TypedEnv(schema);

    // Simulate loading environment variables
    env.configEnvironment('src/test/mock.env');
    env.parse(env['environment'], schema);

    // Assertions
    expect(env['environment'].TEST_STRING).toBe('example');
    expect(env['environment'].TEST_NUMBER).toBe('42');
    expect(env['environment'].TEST_COMMENT).toBeUndefined();
    expect(env['parsedEnvironment'].TEST_NUMBER).toBe(42);
  });

  it('should throw MissingRequiredFieldError if a required field is missing', () => {
    const schema: EnvSchema = {
      TEST_STRING: {type: 'string', required: true},
    };
    const env = new TypedEnv(schema);

    expect(() => env.parse({}, schema)).toThrow(MissingRequiredFieldError);
  });

  it('should throw InvalidTypeError for invalid types', () => {
    const schema: EnvSchema = {
      TEST_NUMBER: {type: 'number', required: true},
    };
    const env = new TypedEnv(schema);

    const mockEnv = {
      TEST_NUMBER: 'not-a-number',
    };

    expect(() => env.parse(mockEnv, schema)).toThrow(InvalidTypeError);
  });

  it('should parse boolean values correctly', () => {
    const schema: EnvSchema = {
      TEST_BOOLEAN: {type: 'boolean', required: true},
    };
    const env = new TypedEnv(schema);

    env.configEnvironment('src/test/mock.env');
    env.parse(env['environment'], schema);
    expect(env['parsedEnvironment'].TEST_BOOLEAN).toBe(true);
  });

  it('should throw invalid boolean error', () => {
    const schema: EnvSchema = {
      TEST_STRING: {type: 'boolean', required: true},
    };
    const env = new TypedEnv(schema);

    env.configEnvironment('src/test/mock.env');

    expect(() => {
      env.parse(env['environment'], schema);
    }).toThrow(InvalidBooleanError);
  });

  it('should validate enum choices for boolean type', () => {
    const schema: EnvSchema = {
      ENUM_BOOLEAN: {type: 'boolean', required: true, choices: [true]},
    };

    const env = new TypedEnv(schema);

    // Valid choice
    env['environment'] = {ENUM_BOOLEAN: 'true'};
    env.parse(env['environment'], schema);
    expect(env['parsedEnvironment'].ENUM_BOOLEAN).toBe(true);

    // Invalid choice
    env['environment'] = {ENUM_BOOLEAN: 'false'};
    expect(() => env.parse(env['environment'], schema)).toThrow(
      InvalidEnumError,
    );
  });

  it('should throw UnsupportedTypeError for invalid schema type', () => {
    const schema = {
      // @eslint-disable-next-line @typescript-eslint/no-explicit-any
      INVALID_TYPE: {type: 'Object' as never, required: true},
    };

    const env = new TypedEnv(schema);
    env['environment'] = {INVALID_TYPE: 'test'};

    expect(() => env.parse(env['environment'], schema)).toThrow(
      UnsupportedTypeError,
    );
  });

  it('should use default value for number field when value is undefined', () => {
    const schema: EnvSchema = {
      NUMBER_WITH_DEFAULT: {type: 'number', default: 42, required: false},
    };

    const env = new TypedEnv(schema);
    env['environment'] = {}; // Empty environment, so NUMBER_WITH_DEFAULT is undefined

    env.parse(env['environment'], schema);
    expect(env['parsedEnvironment'].NUMBER_WITH_DEFAULT).toBe(42);
  });

  it('should use default value for boolean field when value is undefined', () => {
    const schema: EnvSchema = {
      BOOLEAN_WITH_DEFAULT: {type: 'boolean', default: true, required: false},
    };

    const env = new TypedEnv(schema);
    env['environment'] = {}; // Empty environment, so BOOLEAN_WITH_DEFAULT is undefined

    env.parse(env['environment'], schema);
    expect(env['parsedEnvironment'].BOOLEAN_WITH_DEFAULT).toBe(true);
  });
});

describe('Integration Tests', () => {
  const tempEnvPath = path.resolve(process.cwd(), '.env.test');

  afterEach(() => {
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }
  });

  it('should correctly process a complete environment configuration', () => {
    fs.writeFileSync(
      tempEnvPath,
      `
        # This is a comment
        STRING_VAL="string value"
        NUMBER_VAL=123
        BOOLEAN_VAL=true
        ENUM_VAL=option1
        
        # Another comment
        QUOTED_NUM="456"
        `,
    );

    const schema: EnvSchema = {
      STRING_VAL: {type: 'string', required: true},
      NUMBER_VAL: {type: 'number', required: true},
      BOOLEAN_VAL: {type: 'boolean', required: true},
      ENUM_VAL: {
        type: 'string',
        required: true,
        choices: ['option1', 'option2'],
      },
      QUOTED_NUM: {type: 'number', required: true},
      MISSING_WITH_DEFAULT: {type: 'string', default: 'default value'},
    };

    const env = new TypedEnv(schema);
    env.configEnvironment('.env.test');
    const result = env.init();

    expect(result.STRING_VAL).toBe('string value');
    expect(result.NUMBER_VAL).toBe(123);
    expect(result.BOOLEAN_VAL).toBe(true);
    expect(result.ENUM_VAL).toBe('option1');
    expect(result.QUOTED_NUM).toBe(456);
    expect(result.MISSING_WITH_DEFAULT).toBe('default value');
  });
});
