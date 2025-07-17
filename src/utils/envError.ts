class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvError';
  }
}

export class MissingRequiredFieldError extends EnvError {
  constructor(field: string) {
    super(`Environment variable "${field}" is required but is missing.`);
    this.name = 'MissingRequiredFieldError';
  }
}

export class InvalidTypeError extends EnvError {
  constructor(field: string, expectedType: string, receivedValue: unknown) {
    super(
      `Environment variable "${field}" must be a ${expectedType}, but received "${receivedValue}".`,
    );
    this.name = 'InvalidTypeError';
  }
}

export class InvalidBooleanError extends EnvError {
  constructor(field: string, receivedValue: unknown) {
    super(
      `Environment variable "${field}" must be a boolean (true/false), but received "${receivedValue}".`,
    );
    this.name = 'InvalidBooleanError';
  }
}

export class InvalidEnumError extends EnvError {
  constructor(
    field: string,
    allowedValues: readonly (string | number | boolean | object)[],
    receivedValue: unknown,
  ) {
    super(
      `Environment variable "${field}" must be one of [${allowedValues.map(v => (typeof v === 'object' ? JSON.stringify(v) : v)).join(', ')}], but received "${typeof receivedValue === 'object' ? JSON.stringify(receivedValue) : receivedValue}".`,
    );
    this.name = 'InvalidEnumError';
  }
}

export class UnsupportedTypeError extends EnvError {
  constructor(type: string) {
    super(`Unsupported type "${type}" specified in the schema.`);
    this.name = 'UnsupportedTypeError';
  }
}

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

export class InvalidPatternError extends EnvError {
  constructor(field: string, pattern: RegExp | string, receivedValue: string) {
    super(
      `Environment variable "${field}" must match pattern ${pattern}, but received "${receivedValue}".`,
    );
    this.name = 'InvalidPatternError';
  }
}

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

export class CustomValidationError extends EnvError {
  constructor(field: string, value: unknown) {
    super(
      `Environment variable "${field}" failed custom validation with value "${value}".`,
    );
    this.name = 'CustomValidationError';
  }
}

export class InvalidJSONError extends EnvError {
  constructor(field: string, value: string, originalError: string) {
    super(
      `Environment variable "${field}" must be valid JSON, but received "${value}". Error: ${originalError}`,
    );
    this.name = 'InvalidJSONError';
  }
}
