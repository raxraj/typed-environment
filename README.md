# typed-env

A strongly typed environment variable manager for TypeScript applications.

## Overview

`typed-environment` provides a type-safe way to access environment variables in your TypeScript projects. It allows you to define a schema for your environment variables, with support for validation, type conversion, and default values.

## Features

- 🔒 **Type Safety**: Full TypeScript support with typed environment variables
- ✅ **Validation**: Validate environment variables against your schema
- 🔄 **Type Conversion**: Automatically convert string values to the appropriate type (string, number, boolean)
- 📝 **Documentation**: Self-documenting environment requirements
- 🏷️ **Default Values**: Specify default values for optional variables
- 🔍 **Error Handling**: Clear error messages for missing or invalid environment variables

## Installation

```bash
npm install typed-environment
# or
yarn add typed-environment
```

## Usage

### Basic Example

```typescript
import TypedEnv from 'typed-environment';

const environmentSchema = {
    PORT: {
        type: "number",
        default: 8090
    },
    SECRET_KEY: {
        type: "string",
        required: true
    }
};
const typedEnv = new TypedEnv(environmentSchema);

const env = typedEnv.init();
```

### Handling Missing Variables

The library will throw detailed errors when required variables are missing or values don't match the expected type:

```typescript
try {
    const env = typedEnv.init();
} catch (error) {
    console.error('Environment configuration error:', error.message);
    // Example: "Environment variable "API_KEY" is required but is missing."
}
```

### Supported Types

- `string()`: String values
- `number()`: Numeric values
- `boolean()`: Boolean values (supports "true"/"false" strings)

## Error Handling

The library provides specific error types for different validation issues:

- `MissingRequiredFieldError`: When a required field is missing
- `InvalidTypeError`: When a value can't be converted to the expected type
- `InvalidBooleanError`: When a value can't be parsed as a boolean
- `InvalidEnumError`: When a value is not one of the allowed choices

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

