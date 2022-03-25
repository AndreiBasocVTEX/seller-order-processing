export type CountyMappingData = Record<string, string | number | (() => never)>

export type LocalityMappingData = Record<
  string,
  Record<string, string | (() => never)>
>
