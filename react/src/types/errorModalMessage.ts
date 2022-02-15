export type IErrorPopUpMessage = {
  errorMessage: string
  errorDetails?: string
  resetError?: () => void
}
export type IErrorMessage = {
  status: number
  message: string
}
