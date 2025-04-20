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
    allowedValues: readonly (string | number | boolean)[],
    receivedValue: unknown,
  ) {
    super(
      `Environment variable "${field}" must be one of [${allowedValues.join(', ')}], but received "${receivedValue}".`,
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
