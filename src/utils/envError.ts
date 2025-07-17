/**
 * Base class for all environment-related errors.
 *
 * This class extends the standard Error class and provides a foundation
 * for all environment variable validation and processing errors.
 */
class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvError';
  }
}

/**
 * Error thrown when a required environment variable is missing.
 *
 * This error is thrown when a field is marked as required in the schema
 * but is not present in the environment variables and has no default value.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof MissingRequiredFieldError) {
 *     console.error('Required field missing:', error.message);
 *   }
 * }
 * ```
 */
export class MissingRequiredFieldError extends EnvError {
  constructor(field: string) {
    super(`Environment variable "${field}" is required but is missing.`);
    this.name = 'MissingRequiredFieldError';
  }
}

/**
 * Error thrown when an environment variable cannot be converted to the expected type.
 *
 * This error occurs when a value cannot be parsed as the type specified in the schema.
 * For example, trying to parse "abc" as a number would throw this error.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof InvalidTypeError) {
 *     console.error('Type conversion failed:', error.message);
 *   }
 * }
 * ```
 */
export class InvalidTypeError extends EnvError {
  constructor(field: string, expectedType: string, receivedValue: unknown) {
    super(
      `Environment variable "${field}" must be a ${expectedType}, but received "${receivedValue}".`,
    );
    this.name = 'InvalidTypeError';
  }
}

/**
 * Error thrown when a boolean environment variable has an invalid value.
 *
 * This error occurs when a boolean field receives a value other than 'true' or 'false'.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof InvalidBooleanError) {
 *     console.error('Invalid boolean value:', error.message);
 *   }
 * }
 * ```
 */
export class InvalidBooleanError extends EnvError {
  constructor(field: string, receivedValue: unknown) {
    super(
      `Environment variable "${field}" must be a boolean (true/false), but received "${receivedValue}".`,
    );
    this.name = 'InvalidBooleanError';
  }
}

/**
 * Error thrown when an environment variable value is not one of the allowed choices.
 *
 * This error occurs when a field has a `choices` constraint and the value
 * is not included in the allowed options.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof InvalidEnumError) {
 *     console.error('Invalid choice:', error.message);
 *   }
 * }
 * ```
 */
export class InvalidEnumError extends EnvError {
  constructor(
    field: string,
    allowedValues: readonly (string | number | boolean)[],
    receivedValue: unknown,
  ) {
    super(
      `Environment variable "${field}" must be one of [${allowedValues.join(', ')}], but received "${receivedValue}".`,
    );
    this.name = 'InvalidEnumError';
  }
}

/**
 * Error thrown when an unsupported type is specified in the schema.
 *
 * This error occurs when a field type other than 'string', 'number', or 'boolean'
 * is specified in the schema definition.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof UnsupportedTypeError) {
 *     console.error('Unsupported type:', error.message);
 *   }
 * }
 * ```
 */
export class UnsupportedTypeError extends EnvError {
  constructor(type: string) {
    super(`Unsupported type "${type}" specified in the schema.`);
    this.name = 'UnsupportedTypeError';
  }
}

/**
 * Error thrown when a string environment variable doesn't meet length requirements.
 *
 * This error occurs when a string field has `minLength` or `maxLength` constraints
 * and the value doesn't satisfy these requirements.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof InvalidStringLengthError) {
 *     console.error('String length validation failed:', error.message);
 *   }
 * }
 * ```
 */
export class InvalidStringLengthError extends EnvError {
  constructor(field: string, value: string, min?: number, max?: number) {
    let message = `Environment variable "${field}" has invalid length.`;
    if (min !== undefined && max !== undefined) {
      message = `Environment variable "${field}" must be between ${min} and ${max} characters, but received "${value}" (${value.length} characters).`;
    } else if (min !== undefined) {
      message = `Environment variable "${field}" must be at least ${min} characters, but received "${value}" (${value.length} characters).`;
    } else if (max !== undefined) {
      message = `Environment variable "${field}" must be at most ${max} characters, but received "${value}" (${value.length} characters).`;
    }
    super(message);
    this.name = 'InvalidStringLengthError';
  }
}

/**
 * Error thrown when a string environment variable doesn't match the required pattern.
 *
 * This error occurs when a string field has a `pattern` constraint (regex)
 * and the value doesn't match the specified pattern.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof InvalidPatternError) {
 *     console.error('Pattern validation failed:', error.message);
 *   }
 * }
 * ```
 */
export class InvalidPatternError extends EnvError {
  constructor(field: string, pattern: RegExp | string, receivedValue: string) {
    super(
      `Environment variable "${field}" must match pattern ${pattern}, but received "${receivedValue}".`,
    );
    this.name = 'InvalidPatternError';
  }
}

/**
 * Error thrown when a number environment variable is outside the allowed range.
 *
 * This error occurs when a number field has `min` or `max` constraints
 * and the value is outside the specified range.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof InvalidNumberRangeError) {
 *     console.error('Number range validation failed:', error.message);
 *   }
 * }
 * ```
 */
export class InvalidNumberRangeError extends EnvError {
  constructor(field: string, value: number, min?: number, max?: number) {
    let message = `Environment variable "${field}" is out of range.`;
    if (min !== undefined && max !== undefined) {
      message = `Environment variable "${field}" must be between ${min} and ${max}, but received ${value}.`;
    } else if (min !== undefined) {
      message = `Environment variable "${field}" must be at least ${min}, but received ${value}.`;
    } else if (max !== undefined) {
      message = `Environment variable "${field}" must be at most ${max}, but received ${value}.`;
    }
    super(message);
    this.name = 'InvalidNumberRangeError';
  }
}

/**
 * Error thrown when a custom validation function returns false.
 *
 * This error occurs when a field has a `customValidator` function
 * and the function returns false for the given value.
 *
 * @example
 * ```typescript
 * try {
 *   const config = env.init();
 * } catch (error) {
 *   if (error instanceof CustomValidationError) {
 *     console.error('Custom validation failed:', error.message);
 *   }
 * }
 * ```
 */
export class CustomValidationError extends EnvError {
  constructor(field: string, value: unknown) {
    super(
      `Environment variable "${field}" failed custom validation with value "${value}".`,
    );
    this.name = 'CustomValidationError';
  }
}
