export type Join<Key, Path> = Key extends string | number
  ? Path extends string | number
    ? `${Key}${'' extends Path ? '' : '.'}${Path}`
    : never
  : never;

export type MakePath<TSchema> = TSchema extends object
  ? { [K in keyof TSchema]-?: Join<K, MakePath<TSchema[K]>> }[keyof TSchema]
  : TSchema;
