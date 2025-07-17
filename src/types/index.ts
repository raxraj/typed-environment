export type BaseField<Type extends 'string' | 'number' | 'boolean', T> = {
  type: Type;
  default?: T;
  required?: boolean;
  choices?: readonly T[];
} & (Type extends 'string'
  ? {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp | string;
      customValidator?: (value: string) => boolean;
    }
  : {}) &
  (Type extends 'number'
    ? {
        min?: number;
        max?: number;
        customValidator?: (value: number) => boolean;
      }
    : {}) &
  (Type extends 'boolean'
    ? {
        customValidator?: (value: boolean) => boolean;
      }
    : {});

// Shorthand field definitions
export type ShorthandField =
  | string // default string value
  | number // default number value
  | boolean // default boolean value
  | {required: true} // required string field
  | {required: true; choices: readonly string[]} // required string enum
  | {required: true; choices: readonly number[]} // required number enum
  | {required: true; choices: readonly boolean[]}; // required boolean enum

export type EnvSchema = {
  [key: string]:
    | BaseField<'string', string>
    | BaseField<'number', number>
    | BaseField<'boolean', boolean>
    | ShorthandField;
};

type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

// Helper type to normalize shorthand fields to full BaseField format
type NormalizeField<T> = T extends string
  ? BaseField<'string', T>
  : T extends number
    ? BaseField<'number', T>
    : T extends boolean
      ? BaseField<'boolean', T>
      : T extends {required: true; choices: readonly (infer Choice)[]}
        ? Choice extends string
          ? BaseField<'string', Choice> & {
              required: true;
              choices: readonly Choice[];
            }
          : Choice extends number
            ? BaseField<'number', Choice> & {
                required: true;
                choices: readonly Choice[];
              }
            : Choice extends boolean
              ? BaseField<'boolean', Choice> & {
                  required: true;
                  choices: readonly Choice[];
                }
              : never
        : T extends {required: true}
          ? BaseField<'string', string> & {required: true}
          : T extends BaseField<infer Type, infer Value>
            ? T
            : never;

// Helper type to determine if a field is required (either explicitly required or has a default value)
type IsRequired<T> = T extends BaseField<
  'string' | 'number' | 'boolean',
  any
> & {required: true}
  ? true
  : T extends BaseField<'string' | 'number' | 'boolean', any> & {default: any}
    ? true
    : T extends string | number | boolean
      ? true // shorthand with default value
      : T extends {required: true}
        ? true
        : false;

// Helper type to infer the correct field type, including choices
type InferFieldType<T> = T extends BaseField<
  'string' | 'number' | 'boolean',
  any
> & {
  choices: readonly (infer Choice)[];
}
  ? Choice
  : T extends BaseField<infer Type, any>
    ? TypeMap[Type]
    : T extends string
      ? string
      : T extends number
        ? number
        : T extends boolean
          ? boolean
          : T extends {required: true; choices: readonly (infer Choice)[]}
            ? Choice
            : T extends {required: true}
              ? string
              : never;

// Inference logic
export type InferSchema<T extends EnvSchema> = {
  [K in keyof T as IsRequired<T[K]> extends true ? K : never]: InferFieldType<
    T[K]
  >;
} & {
  [K in keyof T as IsRequired<T[K]> extends true ? never : K]?: InferFieldType<
    T[K]
  >;
};
