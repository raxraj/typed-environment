# typed-environment

A zero-dependency, TypeScript-native library to load and validate environment variables using a custom schema with advanced validation capabilities.

## Overview

`typed-environment` provides a type-safe way to access environment variables in your TypeScript projects. It allows you to define a schema for your environment variables, with support for validation, type conversion, and default values.

## Features

- 🔒 **Type Safety**: Full TypeScript support with typed environment variables
- ✅ **Validation**: Validate environment variables against your schema
- 🔄 **Type Conversion**: Automatically convert string values to the appropriate type (string, number, boolean)
- 📝 **Documentation**: Self-documenting environment requirements
- 🏷️ **Default Values**: Specify default values for optional variables
- 🔍 **Error Handling**: Clear error messages for missing or invalid environment variables
- 🎯 **Advanced Validations**: String patterns, length limits, number ranges, and custom validators
- 🚀 **Schema Inference**: Automatically infer types from defaults and reduce boilerplate code
- 🔄 **Backward Compatible**: Existing schemas continue to work without changes

## Installation

```bash
npm install typed-environment
# or
yarn add typed-environment
```

## Basic Usage

### Traditional Schema Definition

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
} as const;

const env = new TypedEnv(schema);
const config = env.init();

// config is fully typed!
console.log(config.DATABASE_URL); // string
console.log(config.PORT);         // number
console.log(config.DEBUG);        // boolean
console.log(config.NODE_ENV);     // 'development' | 'production' | 'test'
```

### New Simplified Schema with Inference (Recommended)

🚀 **New Feature**: Schema inference reduces boilerplate code by automatically inferring types from your schema definition:

```typescript
import TypedEnv from 'typed-environment';

const schema = {
  DATABASE_URL: { required: true },     // inferred as string
  PORT: 3000,                          // inferred as number with default
  DEBUG: false,                        // inferred as boolean with default
  NODE_ENV: { 
    required: true, 
    choices: ['development', 'production', 'test'] 
  },                                   // inferred as string enum
} as const;

const env = new TypedEnv(schema);
const config = env.init();

// Same fully typed result with less boilerplate!
console.log(config.DATABASE_URL); // string
console.log(config.PORT);         // number
console.log(config.DEBUG);        // boolean
console.log(config.NODE_ENV);     // 'development' | 'production' | 'test'
```

### Schema Inference Rules

The library now supports several shorthand formats that reduce boilerplate:

1. **Default values with type inference**:
   ```typescript
   const schema = {
     API_HOST: 'localhost',      // inferred as string with default
     API_PORT: 3000,             // inferred as number with default
     ENABLE_LOGGING: true,       // inferred as boolean with default
   } as const;
   ```

2. **Required fields without explicit types**:
   ```typescript
   const schema = {
     DATABASE_URL: { required: true },  // inferred as required string
     API_KEY: { required: true },       // inferred as required string
   } as const;
   ```

3. **Required fields with choices**:
   ```typescript
   const schema = {
     NODE_ENV: { required: true, choices: ['dev', 'prod'] },  // inferred as 'dev' | 'prod'
     LOG_LEVEL: { required: true, choices: [1, 2, 3] },       // inferred as 1 | 2 | 3
   } as const;
   ```

4. **Mixed shorthand and full syntax**:
   ```typescript
   const schema = {
     // Shorthand
     DATABASE_URL: { required: true },
     PORT: 3000,
     DEBUG: false,
     
     // Full syntax for advanced validation
     API_KEY: {
       type: 'string',
       required: true,
       minLength: 32,
       pattern: /^[a-zA-Z0-9]{32}$/
     },
   } as const;
   ```

### Backward Compatibility

✅ **Fully backward compatible**: All existing schemas continue to work without any changes.

## Why Schema Inference?

The new schema inference feature provides several key benefits:

### 📏 **Less Boilerplate**
- **Before**: `{ type: 'string', default: 'localhost' }`
- **After**: `'localhost'` (50%+ reduction in code)

### 🔍 **Better Developer Experience**
- More readable and intuitive schema definitions
- Less repetitive type annotations
- Easier to write and maintain

### 🚀 **Faster Development**
- Focus on business logic instead of boilerplate
- Reduced chance of type annotation errors
- Shorter schema definitions

### 🎯 **Smart Defaults**
- Automatically infer the most common patterns
- `{ required: true }` defaults to string (most common case)
- Default values automatically infer their types

### 📈 **Gradual Adoption**
- Start with simple shorthand syntax
- Add advanced validations only when needed
- Mix shorthand and full syntax in the same schema

### Example Comparison:

```typescript
// Before (108 lines)
const oldSchema = {
  DATABASE_URL: { type: 'string', required: true },
  DATABASE_PORT: { type: 'number', default: 5432 },
  DATABASE_SSL: { type: 'boolean', default: false },
  API_HOST: { type: 'string', default: 'localhost' },
  API_PORT: { type: 'number', default: 3000 },
  DEBUG_MODE: { type: 'boolean', default: false },
  NODE_ENV: { type: 'string', required: true, choices: ['dev', 'prod'] },
} as const;

// After (54 lines - 50% reduction!)
const newSchema = {
  DATABASE_URL: { required: true },
  DATABASE_PORT: 5432,
  DATABASE_SSL: false,
  API_HOST: 'localhost',
  API_PORT: 3000,
  DEBUG_MODE: false,
  NODE_ENV: { required: true, choices: ['dev', 'prod'] },
} as const;
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

### Real-World Example

```typescript
import TypedEnv from 'typed-environment';

// Before: Verbose schema definition
const oldSchema = {
  DATABASE_URL: {
    type: 'string',
    required: true,
    pattern: /^postgresql:\/\/.+/,
  },
  PORT: {
    type: 'number',
    default: 3000,
    min: 1000,
    max: 65535,
  },
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    pattern: /^[a-zA-Z0-9+/=]+$/,
  },
  ENABLE_LOGGING: {
    type: 'boolean',
    default: true,
  },
  NODE_ENV: {
    type: 'string',
    required: true,
    choices: ['development', 'staging', 'production'],
  },
  RATE_LIMIT: {
    type: 'number',
    default: 100,
    min: 1,
    max: 10000,
    customValidator: (value: number) => value % 10 === 0,
  },
} as const;

// After: Simplified schema with inference (50% less boilerplate!)
const newSchema = {
  // Use full syntax only when advanced validation is needed
  DATABASE_URL: {
    type: 'string',
    required: true,
    pattern: /^postgresql:\/\/.+/,
  },
  
  // Use shorthand for simple cases
  PORT: 3000,                    // inferred as number with default
  ENABLE_LOGGING: true,          // inferred as boolean with default
  NODE_ENV: {
    required: true,
    choices: ['development', 'staging', 'production'],
  },
  
  // Mix shorthand with advanced validation when needed
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    pattern: /^[a-zA-Z0-9+/=]+$/,
  },
  RATE_LIMIT: {
    type: 'number',
    default: 100,
    min: 1,
    max: 10000,
    customValidator: (value: number) => value % 10 === 0,
  },
} as const;

const env = new TypedEnv(newSchema);
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

```typescript
try {
  const config = env.init();
} catch (error) {
  if (error instanceof MissingRequiredFieldError) {
    console.error(`Missing required field: ${error.message}`);
  } else if (error instanceof InvalidPatternError) {
    console.error(`Pattern validation failed: ${error.message}`);
  }
  // Handle other error types...
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.