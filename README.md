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
} as const;

const env = new TypedEnv(schema);
const config = env.init();

// config is fully typed!
console.log(config.DATABASE_URL); // string
console.log(config.PORT);         // number
console.log(config.DEBUG);        // boolean
console.log(config.NODE_ENV);     // 'development' | 'production' | 'test'
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

## Error Handling

The library provides specific error types for different validation issues. When your `.env` file contains invalid values, the library will throw descriptive errors to help you identify and fix the problems.

### Error Types

- `MissingRequiredFieldError`: When a required field is missing
- `InvalidTypeError`: When a value can't be converted to the expected type
- `InvalidBooleanError`: When a value can't be parsed as a boolean
- `InvalidEnumError`: When a value is not one of the allowed choices
- `InvalidStringLengthError`: When a string doesn't meet length requirements
- `InvalidPatternError`: When a string doesn't match the required pattern
- `InvalidNumberRangeError`: When a number is outside the allowed range
- `CustomValidationError`: When custom validation fails

### Comprehensive Error Handling Examples

#### Basic Error Handling Pattern

```typescript
import TypedEnv from 'typed-environment';
import {
  MissingRequiredFieldError,
  InvalidPatternError,
  InvalidStringLengthError,
  InvalidNumberRangeError,
  CustomValidationError,
  InvalidEnumError,
  InvalidTypeError,
  InvalidBooleanError
} from 'typed-environment';

const schema = {
  DATABASE_URL: {
    type: 'string',
    required: true,
    pattern: /^postgresql:\/\/.+/
  },
  API_KEY: {
    type: 'string',
    required: true,
    minLength: 32,
    maxLength: 64
  },
  PORT: {
    type: 'number',
    required: true,
    min: 1000,
    max: 65535
  },
  NODE_ENV: {
    type: 'string',
    required: true,
    choices: ['development', 'staging', 'production']
  }
} as const;

const env = new TypedEnv(schema);

try {
  const config = env.init();
  console.log('Configuration loaded successfully!');
} catch (error) {
  if (error instanceof MissingRequiredFieldError) {
    console.error(`❌ Missing required environment variable: ${error.message}`);
    process.exit(1);
  } else if (error instanceof InvalidPatternError) {
    console.error(`❌ Invalid format: ${error.message}`);
    console.error('💡 Hint: DATABASE_URL should start with "postgresql://"');
  } else if (error instanceof InvalidStringLengthError) {
    console.error(`❌ Invalid length: ${error.message}`);
    console.error('💡 Hint: API_KEY should be between 32-64 characters');
  } else if (error instanceof InvalidNumberRangeError) {
    console.error(`❌ Invalid port: ${error.message}`);
    console.error('💡 Hint: PORT should be between 1000-65535');
  } else if (error instanceof InvalidEnumError) {
    console.error(`❌ Invalid environment: ${error.message}`);
    console.error('💡 Hint: NODE_ENV must be development, staging, or production');
  } else {
    console.error(`❌ Configuration error: ${error.message}`);
  }
}
```

#### Advanced Validation Error Scenarios

Here are real-world examples of what happens when your `.env` file contains incorrect values:

##### Scenario 1: Invalid Database URL Pattern

```bash
# .env file with invalid DATABASE_URL
DATABASE_URL=mysql://localhost:3306/myapp  # Should be postgresql://
API_KEY=abc123def456ghi789jkl012mno345pqr678stu901
PORT=8080
NODE_ENV=development
```

```typescript
// This will throw InvalidPatternError
try {
  const config = env.init();
} catch (error) {
  if (error instanceof InvalidPatternError) {
    console.error('Database URL must be a PostgreSQL connection string');
    console.error('Expected format: postgresql://user:password@host:port/database');
    // error.message: 'Environment variable "DATABASE_URL" must match pattern /^postgresql:\/\/.+/, but received "mysql://localhost:3306/myapp".'
  }
}
```

##### Scenario 2: API Key Too Short

```bash
# .env file with short API_KEY
DATABASE_URL=postgresql://localhost:5432/myapp
API_KEY=short_key  # Too short, needs 32-64 characters
PORT=8080
NODE_ENV=development
```

```typescript
// This will throw InvalidStringLengthError
try {
  const config = env.init();
} catch (error) {
  if (error instanceof InvalidStringLengthError) {
    console.error('API key must be between 32 and 64 characters');
    console.error(`Current length: ${error.message.match(/\((\d+) characters\)/)?.[1]} characters`);
    // error.message: 'Environment variable "API_KEY" must be between 32 and 64 characters, but received "short_key" (9 characters).'
  }
}
```

##### Scenario 3: Port Out of Range

```bash
# .env file with invalid PORT
DATABASE_URL=postgresql://localhost:5432/myapp
API_KEY=abc123def456ghi789jkl012mno345pqr678stu901
PORT=80  # Too low, should be 1000-65535
NODE_ENV=development
```

```typescript
// This will throw InvalidNumberRangeError
try {
  const config = env.init();
} catch (error) {
  if (error instanceof InvalidNumberRangeError) {
    console.error('Port must be in the valid range for application servers');
    console.error('Use ports 1000-65535 to avoid conflicts with system services');
    // error.message: 'Environment variable "PORT" must be between 1000 and 65535, but received 80.'
  }
}
```

##### Scenario 4: Invalid Environment Value

```bash
# .env file with invalid NODE_ENV
DATABASE_URL=postgresql://localhost:5432/myapp
API_KEY=abc123def456ghi789jkl012mno345pqr678stu901
PORT=8080
NODE_ENV=prod  # Should be 'production', not 'prod'
```

```typescript
// This will throw InvalidEnumError
try {
  const config = env.init();
} catch (error) {
  if (error instanceof InvalidEnumError) {
    console.error('Invalid environment name');
    console.error('Valid options: development, staging, production');
    // error.message: 'Environment variable "NODE_ENV" must be one of [development, staging, production], but received "prod".'
  }
}
```

#### Custom Validation Error Handling

```typescript
const schema = {
  WORKER_COUNT: {
    type: 'number',
    required: true,
    min: 1,
    customValidator: (value: number) => {
      const maxWorkers = require('os').cpus().length;
      return value <= maxWorkers;
    }
  },
  SECURE_TOKEN: {
    type: 'string',
    required: true,
    customValidator: (value: string) => {
      // Must contain at least one uppercase, lowercase, number, and special char
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value);
    }
  }
} as const;

try {
  const config = env.init();
} catch (error) {
  if (error instanceof CustomValidationError) {
    if (error.message.includes('WORKER_COUNT')) {
      console.error('Worker count exceeds available CPU cores');
      console.error(`Maximum allowed workers: ${require('os').cpus().length}`);
    } else if (error.message.includes('SECURE_TOKEN')) {
      console.error('Token must contain uppercase, lowercase, number, and special character');
      console.error('Example: MySecure123!');
    }
  }
}
```

#### Production-Ready Error Handling

```typescript
function loadConfiguration() {
  const env = new TypedEnv(schema);
  
  try {
    return env.init();
  } catch (error) {
    // Log the full error for debugging
    console.error('Configuration validation failed:', error);
    
    // Provide user-friendly messages
    if (error instanceof MissingRequiredFieldError) {
      console.error('\n🔧 Setup Required:');
      console.error('Please ensure all required environment variables are set in your .env file');
      console.error('Run: cp .env.example .env');
    } else if (error instanceof InvalidPatternError || 
               error instanceof InvalidStringLengthError ||
               error instanceof InvalidNumberRangeError ||
               error instanceof InvalidEnumError) {
      console.error('\n📋 Configuration Guide:');
      console.error('Please check your .env file values against the requirements:');
      console.error('- DATABASE_URL: postgresql://user:pass@host:port/db');
      console.error('- API_KEY: 32-64 character string');
      console.error('- PORT: number between 1000-65535');
      console.error('- NODE_ENV: development|staging|production');
    } else if (error instanceof CustomValidationError) {
      console.error('\n⚙️  Custom Validation Failed:');
      console.error('Please review the custom validation requirements in your schema');
    }
    
    // Exit gracefully in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error; // Re-throw in development for debugging
  }
}

// Usage
const config = loadConfiguration();
```

### Error Prevention Tips

1. **Create an `.env.example` file** with sample values to guide developers
2. **Use descriptive validation rules** that match your application's requirements
3. **Implement graceful startup** that validates configuration before starting services
4. **Log validation errors clearly** to help with debugging during deployment
5. **Test your schema** with invalid values to ensure proper error handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.