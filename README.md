# typed-environment

A zero-dependency, TypeScript-native library to load and validate environment variables using a custom schema with advanced validation capabilities.

## Overview

`typed-environment` provides a type-safe way to access environment variables in your TypeScript projects. It allows you to define a schema for your environment variables, with support for validation, type conversion, and default values.

## Features

- 🔒 **Type Safety**: Full TypeScript support with typed environment variables
- ✅ **Validation**: Validate environment variables against your schema
- 🔄 **Type Conversion**: Automatically convert string values to the appropriate type (string, number, boolean, object)
- 📝 **Documentation**: Self-documenting environment requirements
- 🏷️ **Default Values**: Specify default values for optional variables
- 🔍 **Error Handling**: Clear error messages for missing or invalid environment variables
- 🎯 **Advanced Validations**: String patterns, length limits, number ranges, and custom validators

## Installation

```bash
npm install typed-environment
# or
yarn add typed-environment
```

## Basic Usage

```typescript
import TypedEnv from 'typed-environment';

const schema = {
  DATABASE_URL: { type: 'string', required: true },
  PORT: { type: 'number', default: 3000 },
  DEBUG: { type: 'boolean', default: false },
  NODE_ENV: { 
    type: 'string', 
    required: true, 
    choices: ['development', 'production', 'test'] 
  },
  CONFIG: { 
    type: 'object', 
    required: true 
  },
} as const;

const env = new TypedEnv(schema);
const config = env.init();

// config is fully typed!
console.log(config.DATABASE_URL); // string
console.log(config.PORT);         // number
console.log(config.DEBUG);        // boolean
console.log(config.NODE_ENV);     // 'development' | 'production' | 'test'
console.log(config.CONFIG);       // object
```

## Advanced Validation Features

### String Validation

```typescript
const schema = {
  // Length constraints
  USERNAME: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 20
  },

  // Pattern validation with regex
  EMAIL: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  // Pattern validation with string regex
  API_KEY: {
    type: 'string',
    required: true,
    pattern: '^[a-zA-Z0-9]{32}$'
  },

  // Custom validation function
  CUSTOM_FIELD: {
    type: 'string',
    required: true,
    customValidator: (value: string) => value.startsWith('prefix_')
  }
} as const;
```

### Number Validation

```typescript
const schema = {
  // Range validation
  PORT: {
    type: 'number',
    required: true,
    min: 1000,
    max: 65535
  },

  // Custom validation for numbers
  WORKER_COUNT: {
    type: 'number',
    required: true,
    min: 1,
    customValidator: (value: number) => value <= require('os').cpus().length
  }
} as const;
```

### Boolean Validation

```typescript
const schema = {
  // Custom boolean validation
  ENABLE_FEATURE: {
    type: 'boolean',
    required: true,
    customValidator: (value: boolean) => {
      // Only allow true in production
      return process.env.NODE_ENV !== 'production' || value === true;
    }
  }
} as const;
```

### Object Validation

```typescript
const schema = {
  // Basic object support - stores JSON as single line string in .env
  DATABASE_CONFIG: {
    type: 'object',
    required: true,
  },

  // Object with custom validation
  API_SETTINGS: {
    type: 'object',
    required: true,
    customValidator: (value: object) => {
      const config = value as any;
      return config.endpoint && config.timeout > 0;
    }
  },

  // Object with choices (enum validation)
  THEME_CONFIG: {
    type: 'object',
    required: true,
    choices: [
      { theme: 'dark', layout: 'compact' },
      { theme: 'light', layout: 'expanded' }
    ]
  },

  // Object with default value
  FEATURE_FLAGS: {
    type: 'object',
    default: { enableNewUI: false, enableBetaFeatures: false }
  }
} as const;

// Example .env file content:
// DATABASE_CONFIG={"host": "localhost", "port": 5432, "database": "myapp"}
// API_SETTINGS={"endpoint": "https://api.example.com", "timeout": 5000}
// THEME_CONFIG={"theme": "dark", "layout": "compact"}
```

### Real-World Example

```typescript
import TypedEnv from 'typed-environment';

const schema = {
  // Database configuration
  DATABASE_URL: {
    type: 'string',
    required: true,
    pattern: /^postgresql:\/\/.+/,
  },

  // Server configuration
  PORT: {
    type: 'number',
    default: 3000,
    min: 1000,
    max: 65535,
  },

  // Security
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    pattern: /^[a-zA-Z0-9+/=]+$/,
  },

  // Feature flags
  ENABLE_LOGGING: {
    type: 'boolean',
    default: true,
  },

  // Environment
  NODE_ENV: {
    type: 'string',
    required: true,
    choices: ['development', 'staging', 'production'],
  },

  // Rate limiting
  RATE_LIMIT: {
    type: 'number',
    default: 100,
    min: 1,
    max: 10000,
    customValidator: (value: number) => value % 10 === 0, // Must be multiple of 10
  },

  // Object configuration for complex settings
  REDIS_CONFIG: {
    type: 'object',
    required: true,
    customValidator: (value: object) => {
      const config = value as any;
      return config.host && config.port && typeof config.port === 'number';
    }
  },

  // Feature flags as object
  FEATURES: {
    type: 'object',
    default: { enableCache: true, enableMetrics: false }
  },
} as const;

const env = new TypedEnv(schema);
const config = env.init();

// All values are properly typed and validated!
```

## Validation Types

| Validation Type | Supported Types | Description |
|----------------|----------------|-------------|
| `required` | all | Field must be present |
| `default` | all | Default value if not provided |
| `choices` | all | Enum validation |
| `minLength` | string | Minimum string length |
| `maxLength` | string | Maximum string length |
| `pattern` | string | Regex pattern matching |
| `min` | number | Minimum numeric value |
| `max` | number | Maximum numeric value |
| `customValidator` | all | Custom validation function |

## Object Support

The library supports object types for complex configuration that needs to be stored as JSON strings in environment files:

```bash
# .env file
DATABASE_CONFIG={"host": "localhost", "port": 5432, "ssl": true}
API_ENDPOINTS={"users": "/api/users", "orders": "/api/orders"}
FEATURE_FLAGS={"enableNewUI": true, "enableBetaFeatures": false}
```

```typescript
const schema = {
  DATABASE_CONFIG: { type: 'object', required: true },
  API_ENDPOINTS: { type: 'object', required: true },
  FEATURE_FLAGS: { type: 'object', default: { enableNewUI: false } }
} as const;

const config = env.init();
// config.DATABASE_CONFIG is properly typed as object
// config.API_ENDPOINTS is properly typed as object
// config.FEATURE_FLAGS is properly typed as object
```

### Object Features

- **JSON Parsing**: Objects are stored as single-line JSON strings in .env files
- **Type Safety**: Full TypeScript support with proper type inference
- **Nested Objects**: Support for complex nested structures and arrays
- **Custom Validation**: Validate object structure and contents
- **Enum Choices**: Support for predefined object configurations
- **Default Values**: Provide fallback object configurations

## Error Handling

The library provides specific error types for different validation issues:

- `MissingRequiredFieldError`: When a required field is missing
- `InvalidTypeError`: When a value can't be converted to the expected type
- `InvalidBooleanError`: When a value can't be parsed as a boolean
- `InvalidEnumError`: When a value is not one of the allowed choices
- `InvalidStringLengthError`: When a string doesn't meet length requirements
- `InvalidPatternError`: When a string doesn't match the required pattern
- `InvalidNumberRangeError`: When a number is outside the allowed range
- `CustomValidationError`: When custom validation fails
- `InvalidJSONError`: When an object field contains invalid JSON

```typescript
try {
  const config = env.init();
} catch (error) {
  if (error instanceof MissingRequiredFieldError) {
    console.error(`Missing required field: ${error.message}`);
  } else if (error instanceof InvalidPatternError) {
    console.error(`Pattern validation failed: ${error.message}`);
  } else if (error instanceof InvalidJSONError) {
    console.error(`Invalid JSON in environment variable: ${error.message}`);
  }
  // Handle other error types...
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.