import type { AxiosResponse } from 'axios'

import type { IErrorDetails } from '../../types/api'

export const parseErrorResponse = async (response: AxiosResponse<Blob>) => {
  return new Promise<{
    message: string
    details: string
  }>((resolve) => {
    const fileReader = new FileReader()

    fileReader.onload = () => {
      const errorJSON = JSON.parse(fileReader.result as string) as IErrorDetails
      const errorDetails = errorJSON.errors?.map((el) => el.error.message)

      resolve({
        message: errorJSON.message,
        details: errorDetails ? errorDetails.join('\n') : errorJSON.stack,
      })
    }

    fileReader.readAsText(response.data)
  })
}
