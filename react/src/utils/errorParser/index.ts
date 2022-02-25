import type { AxiosResponse } from 'axios'

export const parseErrorResponse = async (response: AxiosResponse<Blob>) => {
  const errorResponse = await new Promise<{
    message: string
    details: string
  }>((resolve) => {
    const fileReader = new FileReader()

    fileReader.onload = () => {
      const errorJSON = JSON.parse(fileReader.result as string) as {
        message: string
        stack: string
      }

      resolve({
        message: errorJSON.message,
        details: errorJSON.stack,
      })
    }

    fileReader.readAsText(response.data)
  })

  return errorResponse
}
