// Simplified base field type
export type BaseField<Type extends 'string' | 'number' | 'boolean', T> = {
  type: Type;
  default?: T;
  required?: boolean;
  choices?: readonly T[];
  customValidator?: (value: T) => boolean;
} & (Type extends 'string'
  ? {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp | string;
    }
  : {}) &
  (Type extends 'number'
    ? {
        min?: number;
        max?: number;
      }
    : {});

// Simplified schema type
export type EnvSchema = {
  [key: string]:
    | BaseField<'string', string>
    | BaseField<'number', number>
    | BaseField<'boolean', boolean>;
};

// Simplified type mapping
type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

// Simplified helper types
type IsRequired<T> = T extends {required: true}
  ? true
  : T extends {default: unknown}
    ? true
    : false;

type InferFieldType<T> = T extends BaseField<
  'string' | 'number' | 'boolean',
  unknown
> & {
  choices: readonly (infer Choice)[];
}
  ? Choice
  : T extends BaseField<infer Type, unknown>
    ? TypeMap[Type]
    : never;

// Simplified schema inference
export type InferSchema<T extends EnvSchema> = {
  [K in keyof T as IsRequired<T[K]> extends true ? K : never]: InferFieldType<
    T[K]
  >;
} & {
  [K in keyof T as IsRequired<T[K]> extends true ? never : K]?: InferFieldType<
    T[K]
  >;
};
