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

/**
 * A TypeScript-native library for loading and validating environment variables using a custom schema.
 *
 * TypedEnv provides a type-safe way to access environment variables with validation, type conversion,
 * and default values. It supports advanced validation features like string patterns, length limits,
 * number ranges, enum choices, and custom validators.
 *
 * @template S - The schema type that defines the structure of environment variables
 *
 * @example
 * ```typescript
 * import TypedEnv from 'typed-environment';
 *
 * const schema = {
 *   DATABASE_URL: { type: 'string', required: true },
 *   PORT: { type: 'number', default: 3000 },
 *   DEBUG: { type: 'boolean', default: false },
 * } as const;
 *
 * const env = new TypedEnv(schema);
 * const config = env.init();
 *
 * console.log(config.DATABASE_URL); // string
 * console.log(config.PORT);         // number
 * console.log(config.DEBUG);        // boolean
 * ```
 */
export default class TypedEnv<S extends EnvSchema> extends Error {
  schema: S;
  private environment: {[key: string]: string} = {};
  private parsedEnvironment: {
    [key: string]: string | number | boolean | undefined;
  } = {};

  /**
   * Creates a new TypedEnv instance with the provided schema.
   *
   * @param schema - The schema defining the structure and validation rules for environment variables
   *
   * @example
   * ```typescript
   * const schema = {
   *   DATABASE_URL: { type: 'string', required: true },
   *   PORT: { type: 'number', default: 3000, min: 1000, max: 65535 },
   *   DEBUG: { type: 'boolean', default: false },
   * } as const;
   *
   * const env = new TypedEnv(schema);
   * ```
   */
  constructor(schema: S) {
    super();
    this.schema = schema;
  }

  private parseLine(line: string): {key: string; value: string} | null {
    const trimmed = line.trim();
    if (this.shouldSkipLine(trimmed)) {
      return null;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      return null;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = this.cleanupValue(rawValue);

    return {key, value};
  }

  private shouldSkipLine(line: string): boolean {
    return !line || line.startsWith('#');
  }

  private cleanupValue(value: string): string {
    if (this.isQuoted(value)) {
      return value.slice(1, -1); // Remove surrounding quotes
    }
    return value;
  }

  private isQuoted(value: string): boolean {
    return (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    );
  }

  /**
   * Loads environment variables from a .env file.
   *
   * This method reads the specified .env file and parses it to extract environment variables.
   * It supports quoted values, comments, and empty lines. If the file doesn't exist,
   * it logs a warning and continues with an empty environment.
   *
   * @param filePath - The path to the .env file (defaults to '.env' in the current working directory)
   *
   * @example
   * ```typescript
   * const env = new TypedEnv(schema);
   *
   * // Load from default .env file
   * env.configEnvironment();
   *
   * // Load from custom file
   * env.configEnvironment('./config/.env.production');
   * ```
   */
  configEnvironment(filePath = '.env') {
    const pathToEnvironmentFile = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(pathToEnvironmentFile)) {
      console.warn(
        `Warning: .env file not found at ${pathToEnvironmentFile}. Proceeding with empty environment.`,
      );
      return;
    }

    const content = fs.readFileSync(pathToEnvironmentFile, 'utf-8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const parsedLine = this.parseLine(line);
      if (parsedLine) {
        const {key, value} = parsedLine;
        this.environment[key] = value;
      }
    }
  }

  parse(environment: {[key: string]: string}, schema: EnvSchema) {
    for (const key in schema) {
      const field = schema[key];
      const value = environment[key];

      this.validateRequiredField<string | number | boolean>(key, field, value);
      this.parseAndSetValue<string | number | boolean>(key, field, value);
      this.validateEnumChoices<string | number | boolean>(key, field);
      this.validateAdvancedConstraints(key, field);
    }
  }

  private validateRequiredField<T>(
    key: string,
    field: BaseField<'string' | 'number' | 'boolean', T>,
    value: string | undefined,
  ): void {
    if (value === undefined && field.required && field.default === undefined) {
      throw new MissingRequiredFieldError(key);
    }
  }

  private parseAndSetValue<T>(
    key: string,
    field: BaseField<'string' | 'number' | 'boolean', T>,
    value: string | undefined,
  ): void {
    switch (field.type) {
      case 'string':
        this.parseString(key, field as BaseField<'string', string>, value);
        break;
      case 'number':
        this.parseNumber(key, field as BaseField<'number', number>, value);
        break;
      case 'boolean':
        this.parseBoolean(key, field as BaseField<'boolean', boolean>, value);
        break;
      default:
        throw new UnsupportedTypeError(field.type);
    }
  }

  private parseString(
    key: string,
    field: BaseField<'string', string>,
    value: string | undefined,
  ): void {
    this.parsedEnvironment[key] = value !== undefined ? value : field.default;
  }

  private parseNumber(
    key: string,
    field: BaseField<'number', number>,
    value: string | undefined,
  ): void {
    const numValue = value !== undefined ? Number(value) : field.default;
    if (numValue !== undefined && isNaN(numValue)) {
      throw new InvalidTypeError(key, 'number', value);
    }
    this.parsedEnvironment[key] = numValue;
  }

  private parseBoolean(
    key: string,
    field: BaseField<'boolean', boolean>,
    value: string | undefined,
  ): void {
    if (value && value !== 'true' && value !== 'false') {
      throw new InvalidBooleanError(key, value);
    }
    this.parsedEnvironment[key] =
      value !== undefined ? value.toLowerCase() === 'true' : field.default;
  }

  private validateEnumChoices<T>(
    key: string,
    field: BaseField<'string' | 'number' | 'boolean', T>,
  ): void {
    if (
      field.choices &&
      !field.choices.find(choice => choice === this.parsedEnvironment[key])
    ) {
      throw new InvalidEnumError(
        key,
        field.choices as readonly (string | number | boolean)[],
        this.parsedEnvironment[key],
      );
    }
  }

  private validateAdvancedConstraints(
    key: string,
    field: BaseField<
      'string' | 'number' | 'boolean',
      string | number | boolean
    >,
  ): void {
    const value = this.parsedEnvironment[key];

    // Skip validation if value is undefined (handled by required field validation)
    if (value === undefined) {
      return;
    }

    switch (field.type) {
      case 'string':
        this.validateStringConstraints(
          key,
          field as BaseField<'string', string>,
          value as string,
        );
        break;
      case 'number':
        this.validateNumberConstraints(
          key,
          field as BaseField<'number', number>,
          value as number,
        );
        break;
      case 'boolean':
        this.validateBooleanConstraints(
          key,
          field as BaseField<'boolean', boolean>,
          value as boolean,
        );
        break;
    }
  }

  private validateStringConstraints(
    key: string,
    field: BaseField<'string', string> & {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp | string;
      customValidator?: (value: string) => boolean;
    },
    value: string,
  ): void {
    // Length validation
    if (field.minLength !== undefined && value.length < field.minLength) {
      throw new InvalidStringLengthError(
        key,
        value,
        field.minLength,
        field.maxLength,
      );
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      throw new InvalidStringLengthError(
        key,
        value,
        field.minLength,
        field.maxLength,
      );
    }

    // Pattern validation
    if (field.pattern !== undefined) {
      const regex =
        typeof field.pattern === 'string'
          ? new RegExp(field.pattern)
          : field.pattern;
      if (!regex.test(value)) {
        throw new InvalidPatternError(key, field.pattern, value);
      }
    }

    // Custom validation
    if (field.customValidator && !field.customValidator(value)) {
      throw new CustomValidationError(key, value);
    }
  }

  private validateNumberConstraints(
    key: string,
    field: BaseField<'number', number> & {
      min?: number;
      max?: number;
      customValidator?: (value: number) => boolean;
    },
    value: number,
  ): void {
    // Range validation
    if (field.min !== undefined && value < field.min) {
      throw new InvalidNumberRangeError(key, value, field.min, field.max);
    }
    if (field.max !== undefined && value > field.max) {
      throw new InvalidNumberRangeError(key, value, field.min, field.max);
    }

    // Custom validation
    if (field.customValidator && !field.customValidator(value)) {
      throw new CustomValidationError(key, value);
    }
  }

  private validateBooleanConstraints(
    key: string,
    field: BaseField<'boolean', boolean> & {
      customValidator?: (value: boolean) => boolean;
    },
    value: boolean,
  ): void {
    // Custom validation
    if (field.customValidator && !field.customValidator(value)) {
      throw new CustomValidationError(key, value);
    }
  }

  /**
   * Initializes the environment configuration and returns the parsed, validated environment variables.
   *
   * This method:
   * 1. Loads environment variables from the .env file (if it exists)
   * 2. Parses and validates each variable according to the schema
   * 3. Applies type conversions and default values
   * 4. Returns a fully typed configuration object
   *
   * @returns A typed configuration object with all environment variables
   * @throws {MissingRequiredFieldError} When a required field is missing
   * @throws {InvalidTypeError} When a value cannot be converted to the expected type
   * @throws {InvalidBooleanError} When a boolean value is not 'true' or 'false'
   * @throws {InvalidEnumError} When a value is not one of the allowed choices
   * @throws {InvalidStringLengthError} When a string doesn't meet length requirements
   * @throws {InvalidPatternError} When a string doesn't match the required pattern
   * @throws {InvalidNumberRangeError} When a number is outside the allowed range
   * @throws {CustomValidationError} When custom validation fails
   *
   * @example
   * ```typescript
   * const env = new TypedEnv(schema);
   *
   * try {
   *   const config = env.init();
   *   console.log(config.DATABASE_URL); // Fully typed and validated
   * } catch (error) {
   *   if (error instanceof MissingRequiredFieldError) {
   *     console.error('Missing required field:', error.message);
   *   }
   * }
   * ```
   */
  public init(): InferSchema<S> {
    this.configEnvironment();
    this.parse(this.environment, this.schema);
    return this.parsedEnvironment as InferSchema<S>;
  }

  /**
   * Returns the raw environment variables as loaded from the .env file.
   *
   * This method provides access to the unparsed environment variables as they were
   * loaded from the .env file. All values are strings and have not been type-converted
   * or validated.
   *
   * @returns A frozen object containing the raw environment variables
   *
   * @example
   * ```typescript
   * const env = new TypedEnv(schema);
   * env.configEnvironment();
   *
   * const rawEnv = env.getEnvironment();
   * console.log(rawEnv.PORT); // "3000" (string)
   * ```
   */
  public getEnvironment(): {[key: string]: string} {
    return Object.freeze(this.environment);
  }

  /**
   * Returns the parsed and type-converted environment variables.
   *
   * This method provides access to the environment variables after they have been
   * parsed and type-converted according to the schema, but before the final typing
   * is applied. Values may be strings, numbers, booleans, or undefined.
   *
   * @returns A frozen object containing the parsed environment variables
   *
   * @example
   * ```typescript
   * const env = new TypedEnv(schema);
   * env.init();
   *
   * const parsedEnv = env.getParsedEnvironment();
   * console.log(parsedEnv.PORT); // 3000 (number)
   * console.log(parsedEnv.DEBUG); // false (boolean)
   * ```
   */
  public getParsedEnvironment(): {
    [key: string]: string | number | boolean | undefined;
  } {
    return Object.freeze(this.parsedEnvironment);
  }
}
