import type { ObjectLiteral } from './object-literal.model'

export type Next = () => Promise<void>
export type Handler = (ctx: Context) => Promise<unknown>

export interface CustomError {
  name: string
  stack?: string
  message: string
  errors?: ObjectLiteral[]
}
