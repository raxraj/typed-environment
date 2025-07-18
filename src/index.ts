import {BaseField, EnvSchema, InferSchema} from './types';
import * as path from 'path';
import * as fs from 'fs';
import {
  InvalidBooleanError,
  InvalidEnumError,
  InvalidTypeError,
  MissingRequiredFieldError,
  UnsupportedTypeError,
  InvalidStringLengthError,
  InvalidPatternError,
  InvalidNumberRangeError,
  CustomValidationError,
} from './utils/envError';

export default class TypedEnv<S extends EnvSchema> {
  schema: S;
  private environment: {[key: string]: string} = {};
  private parsedEnvironment: {
    [key: string]: string | number | boolean | undefined;
  } = {};

  constructor(schema: S) {
    this.schema = schema;
  }

  // Simplified .env parsing - combines multiple small methods into one
  private parseEnvLine(line: string): {key: string; value: string} | null {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return null;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      return null;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();

    // Remove quotes if present
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    return {key, value};
  }

  // Simplified environment configuration
  configEnvironment(filePath = '.env') {
    const envFilePath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(envFilePath)) {
      console.warn(
        `Warning: .env file not found at ${envFilePath}. Proceeding with empty environment.`,
      );
      return;
    }

    const content = fs.readFileSync(envFilePath, 'utf-8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const parsed = this.parseEnvLine(line);
      if (parsed) {
        this.environment[parsed.key] = parsed.value;
      }
    }
  }

  // Simplified main parsing method
  parse(environment: {[key: string]: string}, schema: EnvSchema) {
    for (const key in schema) {
      const field = schema[key];
      const value = environment[key];

      // Check if field is required and missing
      if (
        value === undefined &&
        field.required &&
        field.default === undefined
      ) {
        throw new MissingRequiredFieldError(key);
      }

      // Parse value based on type
      if (field.type === 'string') {
        this.parseStringValue(key, field, value);
      } else if (field.type === 'number') {
        this.parseNumberValue(key, field, value);
      } else if (field.type === 'boolean') {
        this.parseBooleanValue(key, field, value);
      } else {
        // Handle unsupported types (should not happen with proper typing, but needed for tests)
        throw new UnsupportedTypeError((field as any).type);
      }

      // Validate constraints
      this.validateField(key, field);
    }
  }

  // Simplified string parsing
  private parseStringValue(
    key: string,
    field: BaseField<'string', string>,
    value: string | undefined,
  ) {
    this.parsedEnvironment[key] = value !== undefined ? value : field.default;
  }

  // Simplified number parsing
  private parseNumberValue(
    key: string,
    field: BaseField<'number', number>,
    value: string | undefined,
  ) {
    const numValue = value !== undefined ? Number(value) : field.default;
    if (numValue !== undefined && isNaN(numValue as number)) {
      throw new InvalidTypeError(key, 'number', value);
    }
    this.parsedEnvironment[key] = numValue;
  }

  // Simplified boolean parsing
  private parseBooleanValue(
    key: string,
    field: BaseField<'boolean', boolean>,
    value: string | undefined,
  ) {
    if (value && value !== 'true' && value !== 'false') {
      throw new InvalidBooleanError(key, value);
    }
    this.parsedEnvironment[key] =
      value !== undefined ? value.toLowerCase() === 'true' : field.default;
  }

  // Simplified validation
  private validateField(
    key: string,
    field:
      | BaseField<'string', string>
      | BaseField<'number', number>
      | BaseField<'boolean', boolean>,
  ) {
    const value = this.parsedEnvironment[key];

    // Skip validation if value is undefined
    if (value === undefined) {
      return;
    }

    // Validate enum choices
    if (field.choices && !field.choices.includes(value as never)) {
      throw new InvalidEnumError(
        key,
        field.choices as readonly (string | number | boolean)[],
        value,
      );
    }

    // Type-specific validations
    if (field.type === 'string' && typeof value === 'string') {
      this.validateString(key, field, value);
    } else if (field.type === 'number' && typeof value === 'number') {
      this.validateNumber(key, field, value);
    } else if (field.type === 'boolean' && typeof value === 'boolean') {
      this.validateBoolean(key, field, value);
    }
  }

  // Simplified string validation
  private validateString(
    key: string,
    field: BaseField<'string', string>,
    value: string,
  ) {
    const stringField = field as BaseField<'string', string> & {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp | string;
      customValidator?: (value: string) => boolean;
    };

    // Length validation
    if (
      stringField.minLength !== undefined &&
      value.length < stringField.minLength
    ) {
      throw new InvalidStringLengthError(
        key,
        value,
        stringField.minLength,
        stringField.maxLength,
      );
    }
    if (
      stringField.maxLength !== undefined &&
      value.length > stringField.maxLength
    ) {
      throw new InvalidStringLengthError(
        key,
        value,
        stringField.minLength,
        stringField.maxLength,
      );
    }

    // Pattern validation
    if (stringField.pattern !== undefined) {
      const regex =
        typeof stringField.pattern === 'string'
          ? new RegExp(stringField.pattern)
          : stringField.pattern;
      if (!regex.test(value)) {
        throw new InvalidPatternError(key, stringField.pattern, value);
      }
    }

    // Custom validation
    if (stringField.customValidator && !stringField.customValidator(value)) {
      throw new CustomValidationError(key, value);
    }
  }

  // Simplified number validation
  private validateNumber(
    key: string,
    field: BaseField<'number', number>,
    value: number,
  ) {
    const numberField = field as BaseField<'number', number> & {
      min?: number;
      max?: number;
      customValidator?: (value: number) => boolean;
    };

    // Range validation
    if (numberField.min !== undefined && value < numberField.min) {
      throw new InvalidNumberRangeError(
        key,
        value,
        numberField.min,
        numberField.max,
      );
    }
    if (numberField.max !== undefined && value > numberField.max) {
      throw new InvalidNumberRangeError(
        key,
        value,
        numberField.min,
        numberField.max,
      );
    }

    // Custom validation
    if (numberField.customValidator && !numberField.customValidator(value)) {
      throw new CustomValidationError(key, value);
    }
  }

  // Simplified boolean validation
  private validateBoolean(
    key: string,
    field: BaseField<'boolean', boolean>,
    value: boolean,
  ) {
    const booleanField = field as BaseField<'boolean', boolean> & {
      customValidator?: (value: boolean) => boolean;
    };

    // Custom validation
    if (booleanField.customValidator && !booleanField.customValidator(value)) {
      throw new CustomValidationError(key, value);
    }
  }

  public init(): InferSchema<S> {
    this.configEnvironment();
    this.parse(this.environment, this.schema);
    return this.parsedEnvironment as InferSchema<S>;
  }

  public getEnvironment(): {[key: string]: string} {
    return Object.freeze(this.environment);
  }

  public getParsedEnvironment(): {
    [key: string]: string | number | boolean | undefined;
  } {
    return Object.freeze(this.parsedEnvironment);
  }
}
