import FormData from 'form-data'

import type {
  FormDataAcceptedTypes,
  FormDataPayload,
} from '../models/form-data.model'

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
