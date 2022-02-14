export type IErrorPopUpMessage = {
  errorMessage: string
  errorStatus?: number | string // 500, 401 ...
  errorDetails?: string
  resetError?: () => void
}
export type IErrorMessage = {
  status: number
  message: string
}
