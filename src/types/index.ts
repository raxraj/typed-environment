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
    | BaseField<'boolean', boolean>;
};

type TypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

// Inference logic
// Infer the value type from choices if present, otherwise use TypeMap
export type InferFieldType<F> = F extends {choices: readonly (infer C)[]}
  ? C
  : F extends {type: infer T}
    ? T extends keyof TypeMap
      ? TypeMap[T]
      : never
    : never;

export type InferSchema<T extends EnvSchema> = {
  [K in keyof T as T[K] extends {required: true} ? K : never]: InferFieldType<
    T[K]
  >;
} & {
  [K in keyof T as T[K] extends {required: true} ? never : K]?: InferFieldType<
    T[K]
  >;
};
