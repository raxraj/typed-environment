# API Reference

This document provides a comprehensive reference for all exported APIs in the `typed-environment` library.

## Table of Contents

- [Classes](#classes)
  - [TypedEnv](#typedenv)
- [Types](#types)
  - [BaseField](#basefield)
  - [EnvSchema](#envschema)
  - [InferSchema](#inferschema)
- [Error Classes](#error-classes)
- [Validation Options](#validation-options)

## Classes

### TypedEnv

The main class for loading and validating environment variables.

```typescript
class TypedEnv<S extends EnvSchema>
```

#### Constructor

```typescript
constructor(schema: S)
```

Creates a new TypedEnv instance with the provided schema.

**Parameters:**
- `schema`: The schema defining the structure and validation rules for environment variables

#### Methods

##### `init(): InferSchema<S>`

Initializes the environment configuration and returns the parsed, validated environment variables.

**Returns:** A typed configuration object with all environment variables

**Throws:**
- `MissingRequiredFieldError` - When a required field is missing
- `InvalidTypeError` - When a value cannot be converted to the expected type
- `InvalidBooleanError` - When a boolean value is not 'true' or 'false'
- `InvalidEnumError` - When a value is not one of the allowed choices
- `InvalidStringLengthError` - When a string doesn't meet length requirements
- `InvalidPatternError` - When a string doesn't match the required pattern
- `InvalidNumberRangeError` - When a number is outside the allowed range
- `CustomValidationError` - When custom validation fails

##### `configEnvironment(filePath?: string): void`

Loads environment variables from a .env file.

**Parameters:**
- `filePath` (optional): The path to the .env file (defaults to '.env')

##### `getEnvironment(): {[key: string]: string}`

Returns the raw environment variables as loaded from the .env file.

**Returns:** A frozen object containing the raw environment variables

##### `getParsedEnvironment(): {[key: string]: string | number | boolean | undefined}`

Returns the parsed and type-converted environment variables.

**Returns:** A frozen object containing the parsed environment variables

## Types

### BaseField

```typescript
type BaseField<Type extends 'string' | 'number' | 'boolean', T>
```

Base field definition for environment variables with type-specific validation options.

**Properties:**
- `type`: The type of the field ('string', 'number', or 'boolean')
- `default?`: Default value to use if the environment variable is not set
- `required?`: Whether this field is required
- `choices?`: Array of allowed values for this field

**String-specific properties:**
- `minLength?`: Minimum length for string values
- `maxLength?`: Maximum length for string values
- `pattern?`: Regular expression pattern that the string must match
- `customValidator?`: Custom validation function for string values

**Number-specific properties:**
- `min?`: Minimum value for number fields
- `max?`: Maximum value for number fields
- `customValidator?`: Custom validation function for number values

**Boolean-specific properties:**
- `customValidator?`: Custom validation function for boolean values

### EnvSchema

```typescript
type EnvSchema = {
  [key: string]: BaseField<'string', string> | BaseField<'number', number> | BaseField<'boolean', boolean>
}
```

Schema definition for environment variables. Each key represents an environment variable name.

### InferSchema

```typescript
type InferSchema<T extends EnvSchema>
```

Inferred configuration object type from a schema. Required fields are included as required properties, while optional fields are optional.

## Error Classes

### MissingRequiredFieldError

Thrown when a required environment variable is missing.

### InvalidTypeError

Thrown when an environment variable cannot be converted to the expected type.

### InvalidBooleanError

Thrown when a boolean environment variable has an invalid value.

### InvalidEnumError

Thrown when an environment variable value is not one of the allowed choices.

### UnsupportedTypeError

Thrown when an unsupported type is specified in the schema.

### InvalidStringLengthError

Thrown when a string environment variable doesn't meet length requirements.

### InvalidPatternError

Thrown when a string environment variable doesn't match the required pattern.

### InvalidNumberRangeError

Thrown when a number environment variable is outside the allowed range.

### CustomValidationError

Thrown when a custom validation function returns false.

## Validation Options

### String Validation

- **Length Constraints**: `minLength`, `maxLength`
- **Pattern Matching**: `pattern` (RegExp or string)
- **Enum Values**: `choices`
- **Custom Validation**: `customValidator`

### Number Validation

- **Range Constraints**: `min`, `max`
- **Enum Values**: `choices`
- **Custom Validation**: `customValidator`

### Boolean Validation

- **Enum Values**: `choices`
- **Custom Validation**: `customValidator`

### Common Validation

- **Required Fields**: `required: true`
- **Default Values**: `default: value`
- **Enum Choices**: `choices: readonly array`

## Example Usage

```typescript
import TypedEnv from 'typed-environment';

// Define schema
const schema = {
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
  DEBUG: {
    type: 'boolean',
    default: false,
  },
  NODE_ENV: {
    type: 'string',
    required: true,
    choices: ['development', 'production', 'test'],
  },
} as const;

// Initialize and get config
const env = new TypedEnv(schema);
const config = env.init();

// config is fully typed!
console.log(config.DATABASE_URL); // string
console.log(config.PORT);         // number
console.log(config.DEBUG);        // boolean
console.log(config.NODE_ENV);     // 'development' | 'production' | 'test'
```