import TypedEnv from '../index';

describe('Edge Case Type Inference', () => {
  it('should handle mixed scenarios correctly', () => {
    const schema = {
      // Required field without default
      REQUIRED_NO_DEFAULT: {type: 'string', required: true},

      // Optional field without default
      OPTIONAL_NO_DEFAULT: {type: 'string', required: false},

      // Field with default but not explicitly required
      DEFAULT_NOT_REQUIRED: {type: 'number', default: 42},

      // Field with default AND explicitly required
      DEFAULT_AND_REQUIRED: {type: 'boolean', default: true, required: true},

      // Optional field with choices
      OPTIONAL_CHOICES: {
        type: 'string',
        required: false,
        choices: ['a', 'b', 'c'],
      },

      // Required field with choices
      REQUIRED_CHOICES: {
        type: 'string',
        required: true,
        choices: ['x', 'y', 'z'],
      },

      // Field with default and choices
      DEFAULT_CHOICES: {
        type: 'string',
        default: 'default',
        choices: ['default', 'other'],
      },
    } as const;

    const env = new TypedEnv(schema);
    env['environment'] = {
      REQUIRED_NO_DEFAULT: 'test',
      OPTIONAL_NO_DEFAULT: 'optional',
      REQUIRED_CHOICES: 'x',
      OPTIONAL_CHOICES: 'a',
    };

    const config = env.init();

    // Type checks (these should compile without errors)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const requiredNoDefault: string = config.REQUIRED_NO_DEFAULT;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const optionalNoDefault: string | undefined = config.OPTIONAL_NO_DEFAULT;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const defaultNotRequired: number = config.DEFAULT_NOT_REQUIRED;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const defaultAndRequired: boolean = config.DEFAULT_AND_REQUIRED;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const optionalChoices: 'a' | 'b' | 'c' | undefined =
      config.OPTIONAL_CHOICES;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const requiredChoices: 'x' | 'y' | 'z' = config.REQUIRED_CHOICES;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const defaultChoices: 'default' | 'other' = config.DEFAULT_CHOICES;

    // Runtime checks
    expect(config.REQUIRED_NO_DEFAULT).toBe('test');
    expect(config.OPTIONAL_NO_DEFAULT).toBe('optional');
    expect(config.DEFAULT_NOT_REQUIRED).toBe(42);
    expect(config.DEFAULT_AND_REQUIRED).toBe(true);
    expect(config.OPTIONAL_CHOICES).toBe('a');
    expect(config.REQUIRED_CHOICES).toBe('x');
    expect(config.DEFAULT_CHOICES).toBe('default');
  });

  it('should handle undefined optional fields correctly', () => {
    const schema = {
      REQUIRED_FIELD: {type: 'string', required: true},
      OPTIONAL_FIELD: {type: 'string', required: false},
      DEFAULT_FIELD: {type: 'number', default: 123},
    } as const;

    const env = new TypedEnv(schema);
    env['environment'] = {
      REQUIRED_FIELD: 'required_value',
      // OPTIONAL_FIELD is intentionally omitted
      // DEFAULT_FIELD is intentionally omitted
    };

    const config = env.init();

    // Type checks
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const required: string = config.REQUIRED_FIELD;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const optional: string | undefined = config.OPTIONAL_FIELD;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const withDefault: number = config.DEFAULT_FIELD;

    expect(config.REQUIRED_FIELD).toBe('required_value');
    expect(config.OPTIONAL_FIELD).toBeUndefined();
    expect(config.DEFAULT_FIELD).toBe(123);
  });
});
