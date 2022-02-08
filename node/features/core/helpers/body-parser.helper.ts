import type { IncomingMessage } from 'http'

import FormData from 'form-data'

import type {
  FormDataAcceptedTypes,
  FormDataPayload,
} from '../models/form-data.model'

export function transformResponseToBuffer(
  error: Error | null,
  res: IncomingMessage
) {
  if (error) {
    return Promise.reject(error)
  }

  return new Promise((resolve, reject) => {
    const body: Uint8Array[] = []

    res.on('data', (chunk: Uint8Array) => {
      body.push(chunk)
    })

    res.on('end', () => {
      return resolve(Buffer.concat(body))
    })

    res.on('error', () => reject(body))
  })
}

export function transformResponseToText(
  error: Error | null,
  res: IncomingMessage
) {
  if (error) {
    return Promise.reject(error)
  }

  return new Promise((resolve, reject) => {
    const body: string[] = []

    res.on('data', (chunk: string) => {
      body.push(chunk)
    })

    res.on('end', () => {
      return resolve(body.join(''))
    })

    res.on('error', () => reject(body))
  })
}

export function payloadToFormData(payload: FormDataPayload) {
  const form = new FormData()

  for (const propName in payload) {
    const value: FormDataAcceptedTypes = payload[propName]

    if (typeof value === 'object' && value?.isFile) {
      form.append(propName, value.value, {
        filename: value.filename,
        contentType: value.contentType,
      })
    } else if (typeof value === 'string' || typeof value === 'number') {
      form.append(propName, value)
    } else {
      console.warn(
        `Could not append ${propName} to form as the value is not a valid one. ${value}`
      )
    }
  }

  return form
}
