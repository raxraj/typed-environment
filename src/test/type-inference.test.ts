import TypedEnv from '../index';
import { InferSchema } from '../types';

describe('Type Inference Tests', () => {
  it('should infer correct types for required and optional fields', () => {
    const schema = {
      REQUIRED_STRING: { type: 'string', required: true },
      OPTIONAL_STRING: { type: 'string', required: false },
      STRING_WITH_DEFAULT: { type: 'string', default: 'default' },
      REQUIRED_NUMBER: { type: 'number', required: true },
      OPTIONAL_NUMBER: { type: 'number', required: false },
      NUMBER_WITH_DEFAULT: { type: 'number', default: 42 },
      REQUIRED_BOOLEAN: { type: 'boolean', required: true },
      OPTIONAL_BOOLEAN: { type: 'boolean', required: false },
      BOOLEAN_WITH_DEFAULT: { type: 'boolean', default: true },
      CHOICES_STRING: { 
        type: 'string', 
        required: true, 
        choices: ['option1', 'option2', 'option3'] 
      },
    } as const;

    const env = new TypedEnv(schema);
    
    // Mock environment to ensure we get proper values
    env['environment'] = {
      REQUIRED_STRING: 'test',
      OPTIONAL_STRING: 'optional',
      REQUIRED_NUMBER: '123',
      OPTIONAL_NUMBER: '456',
      REQUIRED_BOOLEAN: 'true',
      OPTIONAL_BOOLEAN: 'false',
      CHOICES_STRING: 'option1',
    };

    const config = env.init();

    // Type assertions to validate inference
    // These should compile without errors if types are correct
    const requiredString: string = config.REQUIRED_STRING;
    const optionalString: string | undefined = config.OPTIONAL_STRING;
    const stringWithDefault: string = config.STRING_WITH_DEFAULT;
    const requiredNumber: number = config.REQUIRED_NUMBER;
    const optionalNumber: number | undefined = config.OPTIONAL_NUMBER;
    const numberWithDefault: number = config.NUMBER_WITH_DEFAULT;
    const requiredBoolean: boolean = config.REQUIRED_BOOLEAN;
    const optionalBoolean: boolean | undefined = config.OPTIONAL_BOOLEAN;
    const booleanWithDefault: boolean = config.BOOLEAN_WITH_DEFAULT;
    const choicesString: 'option1' | 'option2' | 'option3' = config.CHOICES_STRING;

    // Actual runtime checks
    expect(typeof config.REQUIRED_STRING).toBe('string');
    expect(typeof config.OPTIONAL_STRING).toBe('string');
    expect(typeof config.STRING_WITH_DEFAULT).toBe('string');
    expect(typeof config.REQUIRED_NUMBER).toBe('number');
    expect(typeof config.OPTIONAL_NUMBER).toBe('number');
    expect(typeof config.NUMBER_WITH_DEFAULT).toBe('number');
    expect(typeof config.REQUIRED_BOOLEAN).toBe('boolean');
    expect(typeof config.OPTIONAL_BOOLEAN).toBe('boolean');
    expect(typeof config.BOOLEAN_WITH_DEFAULT).toBe('boolean');
    expect(config.CHOICES_STRING).toBe('option1');

    // Verify specific values
    expect(config.REQUIRED_STRING).toBe('test');
    expect(config.OPTIONAL_STRING).toBe('optional');
    expect(config.STRING_WITH_DEFAULT).toBe('default');
    expect(config.REQUIRED_NUMBER).toBe(123);
    expect(config.OPTIONAL_NUMBER).toBe(456);
    expect(config.NUMBER_WITH_DEFAULT).toBe(42);
    expect(config.REQUIRED_BOOLEAN).toBe(true);
    expect(config.OPTIONAL_BOOLEAN).toBe(false);
    expect(config.BOOLEAN_WITH_DEFAULT).toBe(true);
    expect(config.CHOICES_STRING).toBe('option1');
  });

  it('should properly type required vs optional fields', () => {
    const schema = {
      REQUIRED_FIELD: { type: 'string', required: true },
      OPTIONAL_FIELD: { type: 'string', required: false },
      DEFAULT_FIELD: { type: 'string', default: 'default' },
    } as const;

    type InferredType = InferSchema<typeof schema>;
    
    // This function helps verify compile-time types
    function checkTypes(config: InferredType) {
      // Required field should be non-optional
      const required: string = config.REQUIRED_FIELD;
      
      // Optional field should be optional
      const optional: string | undefined = config.OPTIONAL_FIELD;
      
      // Field with default should be non-optional
      const withDefault: string = config.DEFAULT_FIELD;
      
      expect(typeof required).toBe('string');
      expect(typeof withDefault).toBe('string');
      // optional could be string or undefined
    }

    const env = new TypedEnv(schema);
    env['environment'] = {
      REQUIRED_FIELD: 'required_value',
      OPTIONAL_FIELD: 'optional_value',
    };
    
    const config = env.init();
    checkTypes(config);
    
    expect(config.REQUIRED_FIELD).toBe('required_value');
    expect(config.OPTIONAL_FIELD).toBe('optional_value');
    expect(config.DEFAULT_FIELD).toBe('default');
  });
});