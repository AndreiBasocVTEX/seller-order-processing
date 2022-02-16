import type { ObjectLiteral } from '../models/object-literal.model'

function isObjectLiteral(value: unknown): value is ObjectLiteral {
  return typeof value === 'object'
}

export default function findAllObjectPropsByKey(
  obj: ObjectLiteral,
  keyToFind: string
): unknown[] {
  return Object.entries(obj).reduce(
    (acc, [key, value]) =>
      key === keyToFind
        ? acc.concat(value)
        : isObjectLiteral(value)
        ? acc.concat(findAllObjectPropsByKey(value, keyToFind))
        : acc,
    [] as unknown[]
  )
}
