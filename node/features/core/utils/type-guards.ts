export function isString(x: unknown) {
  if (typeof x === 'string') {
    return x
  }

  throw new Error('The value should be of type: string')
}

export function isNumber(x: unknown) {
  if (typeof x === 'number') {
    return x
  }

  throw new Error('The value should be of type: number')
}
