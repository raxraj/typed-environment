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

export default class TypedEnv<S extends EnvSchema> extends Error {
  schema: S;
  private environment: {[key: string]: string} = {};
  private parsedEnvironment: {
    [key: string]: string | number | boolean | undefined;
  } = {};

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
    const flattenedSchema = this.flattenSchema(schema);

    for (const key in flattenedSchema) {
      const field = flattenedSchema[key];
      const value = environment[key];

      this.validateRequiredField<string | number | boolean>(key, field, value);
      this.parseAndSetValue<string | number | boolean>(key, field, value);
      this.validateEnumChoices<string | number | boolean>(key, field);
      this.validateAdvancedConstraints(key, field);
    }
  }

  // Helper method to flatten nested schemas into dot notation keys
  private flattenSchema(
    schema: any,
    prefix = '',
  ): {[key: string]: BaseField<'string' | 'number' | 'boolean', any>} {
    const flattened: {
      [key: string]: BaseField<'string' | 'number' | 'boolean', any>;
    } = {};

    for (const key in schema) {
      const field = schema[key];
      const fullKey = prefix
        ? `${prefix}_${key.toUpperCase()}`
        : key.toUpperCase();

      if (this.isBaseField(field)) {
        flattened[fullKey] = field;
      } else if (this.isNestedSchema(field)) {
        // It's a nested schema
        const nestedFlattened = this.flattenSchema(field, fullKey);
        Object.assign(flattened, nestedFlattened);
      } else {
        // It's neither a BaseField nor a nested schema, treat as BaseField for validation
        flattened[fullKey] = field;
      }
    }

    return flattened;
  }

  // Helper method to check if a field is a BaseField
  private isBaseField(
    field: any,
  ): field is BaseField<'string' | 'number' | 'boolean', any> {
    return (
      field &&
      typeof field === 'object' &&
      typeof field.type === 'string' &&
      ['string', 'number', 'boolean'].includes(field.type)
    );
  }

  // Helper method to check if a field is a nested schema
  private isNestedSchema(field: any): boolean {
    // A nested schema is an object that doesn't have a "type" property that is a primitive type
    if (!field || typeof field !== 'object') {
      return false;
    }

    // If it has a "type" property that's a primitive type string, it's a BaseField
    if (
      field.type &&
      typeof field.type === 'string' &&
      ['string', 'number', 'boolean'].includes(field.type)
    ) {
      return false;
    }

    // If it has properties that look like BaseFields, it's a nested schema
    for (const key in field) {
      const subField = field[key];
      if (this.isBaseField(subField) || this.isNestedSchema(subField)) {
        return true;
      }
    }

    return false;
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

  public init(): InferSchema<S> {
    this.configEnvironment();
    this.parse(this.environment, this.schema);
    return this.constructNestedResult(this.schema) as InferSchema<S>;
  }

  // Helper method to construct the nested result object from the flat parsed environment
  private constructNestedResult(schema: any, prefix = ''): any {
    const result: any = {};

    for (const key in schema) {
      const field = schema[key];
      const fullKey = prefix
        ? `${prefix}_${key.toUpperCase()}`
        : key.toUpperCase();

      if (this.isBaseField(field)) {
        result[key] = this.parsedEnvironment[fullKey];
      } else {
        // It's a nested schema
        result[key] = this.constructNestedResult(field, fullKey);
      }
    }

    return result;
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
