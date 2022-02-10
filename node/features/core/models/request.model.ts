export type Next = () => Promise<void>
export type Handler = (ctx: Context) => Promise<unknown>

export interface CustomError {
  name: string
  stack?: string
  message: string
}
