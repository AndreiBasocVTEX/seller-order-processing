import ObjectsToCsv from 'objects-to-csv'

import type { VtexTrackingEvent } from '../../vtex/dto/tracking.dto'
import type {
  CreateTrackingRequest,
  DeleteTrackingRequest,
  GetTrackingLabelRequest,
  GetTrackingStatusRequest,
} from '../../shared/clients/carrier-client'
import { CarrierClient } from '../../shared/clients/carrier-client'
import { createFancourierOrderPayload } from '../helpers/fancourier-create-payload.helper'
import type { IAuthDataFancourier } from '../models/fancourier-auth.model'
import { CarriersEnum } from '../../shared/enums/carriers.enum'
import {
  payloadToFormData,
  transformResponseToBuffer,
  transformResponseToText,
} from '../../core/helpers/body-parser.helper'
import type { FormDataPayload } from '../../core/models/form-data.model'
import {
  UnhandledError,
  ValidationError,
} from '../../core/helpers/error.helper'
import type { ObjectLiteral } from '../../core/models/object-literal.model'

export default class FancourierClient extends CarrierClient {
  protected static ENABLED_SETTING_NAME = 'fancourier__isEnabled'

  public isActive(settings: ObjectLiteral): boolean {
    return !!settings[FancourierClient.ENABLED_SETTING_NAME]
  }

  public throwIfDisabled(settings: ObjectLiteral): void | never {
    if (!this.isActive(settings)) {
      throw new ValidationError({
        message: `You need to enable ${CarriersEnum.FANCOURIER} integration to perform this action`,
      })
    }
  }

  protected async requestAWB({
    settings,
    order,
    params,
  }: CreateTrackingRequest): Promise<{
    resStatus: string
    lineNumber: string
    rate: string
    trackingNumber: string
  }> {
    const fancourierOrderPayload = await createFancourierOrderPayload(
      order,
      settings.fancourier__warehouseId,
      params
    )

    // Order of the keys in fileData is important because of the generation column flow for the csv-object
    const fileData = [
      {
        'Type of service': fancourierOrderPayload?.service,
        Bank: '',
        IBAN: '',
        'Nr. of envelopes': fancourierOrderPayload?.content?.envelopeCount,
        'Nr. of parcels': fancourierOrderPayload?.content?.parcelsCount,
        Weight: fancourierOrderPayload?.content?.totalWeight,
        'Payment of shipment': 'destinatar',
        Reimbursement: fancourierOrderPayload?.extra?.bankRepaymentAmount,
        'Reimbursement transport payment': 'destinatar',
        'Declared Value': fancourierOrderPayload?.extra?.declaredValue,
        'Contact person': fancourierOrderPayload?.addressTo?.name,
        Observations: '',
        Contains: fancourierOrderPayload?.content?.contents,
        'Recipient name': fancourierOrderPayload?.addressTo?.name,
        'Contact person 1': fancourierOrderPayload?.addressTo?.name,
        Phone: fancourierOrderPayload?.addressTo?.phone,
        Fax: '',
        Email: fancourierOrderPayload?.addressTo?.email,
        County: fancourierOrderPayload?.addressTo?.countyName,
        Town: fancourierOrderPayload?.addressTo?.localityName
          .replace(/\(.*\)/, '')
          .trim(),
        Street: fancourierOrderPayload?.addressTo?.street,
        Number: fancourierOrderPayload?.addressTo?.number,
        'Postal Code': fancourierOrderPayload?.addressTo?.postalCode,
        'Block(building)': fancourierOrderPayload?.addressTo?.reference,
        Entrance: '',
        Floor: '',
        Flat: '',
        'Height of packet': '',
        'Width of packet': '',
        'Lenght of packet': '',
      },
    ]

    const csv = new ObjectsToCsv(fileData)
    const csvData = await csv.toString()

    const res = await this.requestToFanCourier(
      'import_awb_integrat.php',
      {
        client_id: settings.fancourier__clientId,
        user_pass: settings.fancourier__password,
        username: settings.fancourier__username,
        fisier: {
          isFile: true,
          filename: 'fisier.csv',
          value: csvData,
          contentType: 'text/plain',
        },
      },
      { responseType: 'text' }
    )

    if (typeof res !== 'string') {
      // eslint-disable-next-line no-console
      console.log(
        'Fancourier validation failed, please check if the sent fileData was right.',
        JSON.stringify(fileData, null, 2)
      )
      throw new ValidationError({
        message: `Fancourier validation failed, please check if the sent fileData was right. ${JSON.stringify(
          fileData
        )}`,
      })
    }

    const [lineNumber, resStatus, trackingNumber, rate] = res?.split(',') ?? []

    if (resStatus === '0') {
      // If there is an error, then on the third position of the response array (trackingNumber)
      // will be an error message
      throw new ValidationError({ message: `${trackingNumber}` })
    }

    return {
      lineNumber,
      trackingNumber,
      rate,
      resStatus,
    }
  }

  public async trackingLabel({
    settings,
    trackingNumber,
    paperSize,
  }: GetTrackingLabelRequest): Promise<unknown> {
    return this.requestToFanCourier(
      'view_awb_integrat_pdf.php',
      {
        client_id: settings.fancourier__clientId,
        user_pass: settings.fancourier__password,
        username: settings.fancourier__username,
        nr: trackingNumber,
        page: paperSize,
      },
      { responseType: 'blob' }
    )
  }

  public async createTracking(request: CreateTrackingRequest) {
    const { trackingNumber } = await this.requestAWB(request)

    return {
      trackingNumber,
      courier: CarriersEnum.FANCOURIER,
      trackingUrl: `https://www.fancourier.ro/awb-tracking/?metoda=tracking&awb=${trackingNumber}`,
    }
  }

  public async getTrackingStatus({
    settings,
    trackingNumber,
    invoiceNumber,
  }: GetTrackingStatusRequest) {
    const formData: IAuthDataFancourier = {
      client_id: settings.fancourier__clientId,
      user_pass: settings.fancourier__password,
      username: settings.fancourier__username,
    }

    const updatedAwbInfo = (await this.requestToFanCourier(
      'awb_tracking_integrat.php',
      {
        ...formData,
        AWB: trackingNumber,
        display_mode: 3,
      },
      { responseType: 'text' }
    )) as string

    const trackingHistory = updatedAwbInfo.split('\n').filter(Boolean)

    let trackingEvents: VtexTrackingEvent[] = []
    let isDelivered = false

    if (trackingHistory.length && invoiceNumber) {
      trackingEvents = trackingHistory.map((event) => {
        // event[0] is a status number (2 — is delivered)
        const [, description] = event.split(',')

        return {
          description,
        }
      })

      isDelivered = trackingHistory.some((event) => event.split(',')[0] === '2')
    }

    return {
      isDelivered,
      events: trackingEvents,
    }
  }

  public async deleteAWB({ settings, trackingNumber }: DeleteTrackingRequest) {
    const res = await this.requestToFanCourier(
      'delete_awb_integrat.php',
      {
        client_id: settings.fancourier__clientId,
        user_pass: settings.fancourier__password,
        username: settings.fancourier__username,
        AWB: trackingNumber,
      },
      { responseType: 'text' }
    )

    if (typeof res === 'string' && res.includes('DELETED')) {
      return true
    }

    throw new ValidationError({
      message: `Fancourier validation failed, please check if the sent fileData was right.`,
    })
  }

  private requestToFanCourier(
    url: string,
    payload: FormDataPayload,
    options: { responseType: 'text' | 'blob' }
  ) {
    if (!url) {
      throw new ValidationError({ message: 'URL is required' })
    }

    const form = payloadToFormData(payload)

    return new Promise((resolve, reject) => {
      form.submit(`https://www.selfawb.ro/${url}`, (error, response) => {
        if (options.responseType === 'blob') {
          return transformResponseToBuffer(error, response)
            .then(resolve)
            .catch(reject)
        }

        return transformResponseToText(error, response)
          .then(resolve)
          .catch(reject)
      })
    }).catch((error) => {
      throw UnhandledError.fromError(error)
    })
  }
}
