import TypedEnv from '../index';
import {EnvSchema} from '../types';
import {InvalidTypeError, MissingRequiredFieldError} from '../utils/envError';

describe('TypedEnv Class', () => {
  it('should parse .env file correctly', () => {
    const schema: EnvSchema = {
      TEST_STRING: {type: 'string', required: true},
      TEST_NUMBER: {type: 'number', required: false},
    };
    const env = new TypedEnv(schema);

    // Simulate loading environment variables
    env.configEnvironment('src/test/mock.env');

    // Assertions
    expect(env['environment'].TEST_STRING).toBe('example');
    expect(env['environment'].TEST_NUMBER).toBe('42');
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
});
