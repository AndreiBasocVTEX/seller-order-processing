export type FormDataAcceptedTypes =
  | string
  | number
  | {
      isFile: boolean
      filename: string
      value: string | Blob
      contentType: string
    }

export type FormDataPayload = { [key: string]: FormDataAcceptedTypes }
