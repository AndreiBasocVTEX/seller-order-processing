export type IErrorPopUpMessage = {
  errorMessage: string
  errorStatus?: number | string // 500, 401 ...
  resetError?: () => void
}
export type IErrorMessage = {
  status: number
  message: string
}
