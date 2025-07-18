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

export type EnvSchema = {
  [key: string]:
    | BaseField<'string', string>
    | BaseField<'number', number>
    | BaseField<'boolean', boolean>
    | {[key: string]: any}; // Simplified nested schema
};

type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

// Helper type to determine if a field is required (either explicitly required or has a default value)
type IsRequired<T> = T extends {required: true}
  ? true
  : T extends {default: any}
    ? true
    : T extends BaseField<any, any>
      ? false
      : true; // Nested schemas are always considered "required" (they exist as objects)

// Helper type to check if a value is a nested schema
type IsNestedSchema<T> = T extends BaseField<any, any> ? false : true;

// Helper type to infer the correct field type, including choices and nested schemas
type InferFieldType<T> = T extends BaseField<any, any> & {
  choices: readonly (infer Choice)[];
}
  ? Choice
  : T extends BaseField<infer Type, any>
    ? TypeMap[Type]
    : T extends Record<string, any>
      ? {[K in keyof T]: InferFieldType<T[K]>}
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
