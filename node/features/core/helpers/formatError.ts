import type { AxiosError } from 'axios'

export function formatError(error: AxiosError) {
  if (error.response) {
    /*
     * The request was made and the server responded with a
     * status code that falls out of the range of 2xx
     */
    return `
    Failed with status: ${error.response.status};
    url: ${JSON.stringify(error.response?.config?.url)}
    data: ${JSON.stringify(error.response.data)};
    headers: ${JSON.stringify(error.response.headers)}
     `
  }

  if (error.request) {
    /*
     * The request was made but no response was received, `error.request`
     * is an instance of XMLHttpRequest in the browser and an instance
     * of http.ClientRequest in Node.js
     */
    return `Failed with no response for request: with no response, url: ${error?.config?.url} and message ${error.message}`
  }

  // Something happened in setting up the request and triggered an Error
  return `Failed with message: ${error.message}`
}
