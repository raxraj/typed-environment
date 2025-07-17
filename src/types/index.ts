/**
 * Base field definition for environment variables.
 *
 * This type defines the structure for all environment variable field definitions
 * in the schema. It includes common properties like type, default value, required flag,
 * and choices, as well as type-specific validation options.
 *
 * @template Type - The type of the field ('string', 'number', or 'boolean')
 * @template T - The TypeScript type corresponding to the field type
 *
 * @example
 * ```typescript
 * // String field with length validation
 * const stringField: BaseField<'string', string> = {
 *   type: 'string',
 *   required: true,
 *   minLength: 5,
 *   maxLength: 20,
 *   pattern: /^[a-zA-Z0-9]+$/
 * };
 *
 * // Number field with range validation
 * const numberField: BaseField<'number', number> = {
 *   type: 'number',
 *   default: 3000,
 *   min: 1000,
 *   max: 65535
 * };
 *
 * // Boolean field with choices
 * const booleanField: BaseField<'boolean', boolean> = {
 *   type: 'boolean',
 *   default: false,
 *   customValidator: (value: boolean) => value === true
 * };
 * ```
 */
export type BaseField<Type extends 'string' | 'number' | 'boolean', T> = {
  /** The type of the field */
  type: Type;
  /** Default value to use if the environment variable is not set */
  default?: T;
  /** Whether this field is required (must be present in environment) */
  required?: boolean;
  /** Array of allowed values for this field (enum validation) */
  choices?: readonly T[];
} & (Type extends 'string'
  ? {
      /** Minimum length for string values */
      minLength?: number;
      /** Maximum length for string values */
      maxLength?: number;
      /** Regular expression pattern that the string must match */
      pattern?: RegExp | string;
      /** Custom validation function for string values */
      customValidator?: (value: string) => boolean;
    }
  : {}) &
  (Type extends 'number'
    ? {
        /** Minimum value for number fields */
        min?: number;
        /** Maximum value for number fields */
        max?: number;
        /** Custom validation function for number values */
        customValidator?: (value: number) => boolean;
      }
    : {}) &
  (Type extends 'boolean'
    ? {
        /** Custom validation function for boolean values */
        customValidator?: (value: boolean) => boolean;
      }
    : {});

/**
 * Schema definition for environment variables.
 *
 * This type defines the structure of the schema object passed to TypedEnv.
 * Each key represents an environment variable name, and each value is a field
 * definition specifying the type and validation rules.
 *
 * @example
 * ```typescript
 * const schema: EnvSchema = {
 *   DATABASE_URL: {
 *     type: 'string',
 *     required: true,
 *     pattern: /^postgresql:\/\/.+/
 *   },
 *   PORT: {
 *     type: 'number',
 *     default: 3000,
 *     min: 1000,
 *     max: 65535
 *   },
 *   DEBUG: {
 *     type: 'boolean',
 *     default: false
 *   },
 *   NODE_ENV: {
 *     type: 'string',
 *     required: true,
 *     choices: ['development', 'production', 'test']
 *   }
 * };
 * ```
 */
export type EnvSchema = {
  [key: string]:
    | BaseField<'string', string>
    | BaseField<'number', number>
    | BaseField<'boolean', boolean>;
};

/**
 * Type mapping for field types to their corresponding TypeScript types.
 *
 * @internal
 */
type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

/**
 * Helper type to determine if a field is required.
 *
 * A field is considered required if it has `required: true` or has a default value
 * (fields with default values are always available in the result).
 *
 * @template T - The field definition type
 * @internal
 */
type IsRequired<T> = T extends {required: true}
  ? true
  : T extends {default: any}
    ? true
    : false;

/**
 * Helper type to infer the correct TypeScript type for a field.
 *
 * This type handles choice-based fields (enums) by inferring the union type
 * of the choices, or falls back to the base type mapping.
 *
 * @template T - The field definition type
 * @internal
 */
type InferFieldType<T> = T extends BaseField<any, any> & {
  choices: readonly (infer Choice)[];
}
  ? Choice
  : T extends BaseField<infer Type, any>
    ? TypeMap[Type]
    : never;

/**
 * Inferred configuration object type from a schema.
 *
 * This type automatically infers the TypeScript type of the configuration object
 * that will be returned by `env.init()`. Required fields (those with `required: true`
 * or with default values) are included as required properties, while optional fields
 * are included as optional properties.
 *
 * @template T - The schema type
 *
 * @example
 * ```typescript
 * const schema = {
 *   DATABASE_URL: { type: 'string', required: true },
 *   PORT: { type: 'number', default: 3000 },
 *   DEBUG: { type: 'boolean' }, // optional
 *   NODE_ENV: { type: 'string', choices: ['dev', 'prod'] as const }
 * } as const;
 *
 * // Inferred type:
 * // {
 * //   DATABASE_URL: string;
 * //   PORT: number;
 * //   DEBUG?: boolean;
 * //   NODE_ENV?: 'dev' | 'prod';
 * // }
 * type Config = InferSchema<typeof schema>;
 * ```
 */
export type InferSchema<T extends EnvSchema> = {
  [K in keyof T as IsRequired<T[K]> extends true ? K : never]: InferFieldType<
    T[K]
  >;
} & {
  [K in keyof T as IsRequired<T[K]> extends true ? never : K]?: InferFieldType<
    T[K]
  >;
};
