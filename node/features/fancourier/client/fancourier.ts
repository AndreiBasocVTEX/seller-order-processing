import type { InstanceOptions, IOContext } from '@vtex/api'
import FormData from 'form-data'
import ObjectsToCsv from 'objects-to-csv'

import type {
  TrackingRequestDTO,
} from '../../core/dto/order-api'
import { VtexTrackingEvent } from "../../vtex/dto/tracking.dto"
import type {
  GetAWBInfoParams,
  IBodyForRequestAwb,
  TrackingLabelParams,
} from '../../shared/clients/carrier-client'
import { CarrierClient } from '../../shared/clients/carrier-client'
import { createFancourierOrderPayload } from '../helpers/fancourier-create-payload.helper'
import type { IAuthDataFancourier } from '../models/fancourier-auth.model'
import { IVtexOrder } from '../../vtex/dto/order.dto'

type FormDataAcceptedTypes =
  | string
  | number
  | { isFile: boolean; filename: string; value: unknown; contentType: string }

type FanCourierRequestPayloadType = { [key: string]: FormDataAcceptedTypes }

export default class FancourierClient extends CarrierClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('', ctx, options)
  }

  protected async requestAWB({
    settings,
    trackingRequest,
    order,
  }: IBodyForRequestAwb): Promise<{
    _: string
    lineNumber: string
    rate: string
    trackingNumber: string
  }> {
    const fancourierOrderPayload = createFancourierOrderPayload(
      order,
      settings.fancourier__warehouseId,
      trackingRequest
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
      throw new Error(
        `Fancourier validation failed, please check if the sent fileData was right. ${JSON.stringify(
          fileData
        )}`
      )
    }

    const [lineNumber, _, trackingNumber, rate] = res?.split(',') ?? []

    return {
      lineNumber,
      trackingNumber,
      rate,
      _,
    }
  }

  public async trackingLabel({
    settings,
    payload,
  }: TrackingLabelParams<{ awbTrackingNumber: string }>): Promise<unknown> {
    const { awbTrackingNumber } = payload

    return this.requestToFanCourier(
      'view_awb_integrat_pdf.php',
      {
        client_id: settings.fancourier__clientId,
        user_pass: settings.fancourier__password,
        username: settings.fancourier__username,
        nr: awbTrackingNumber,
        page: 'A4',
      },
      { responseType: 'blob' }
    )
  }

  public async requestAWBForInvoice({
    order,
    settings,
    trackingRequest,
  }: {
    order: IVtexOrder
    settings: IOContext['settings']
    trackingRequest: TrackingRequestDTO
  }) {
    const { trackingNumber } = await this.requestAWB({
      settings,
      order,
      trackingRequest,
    })

    const { items } = order

    return {
      orderId: order.orderId,
      trackingNumber,
      items,
      courier: 'Fancourier',
      trackingUrl: `https://www.fancourier.ro/awb-tracking/?metoda=tracking&awb=${trackingNumber}`,
    }
  }

  public async getAWBInfo({ settings, order }: GetAWBInfoParams) {
    const formData: IAuthDataFancourier = {
      client_id: settings.fancourier__clientId,
      user_pass: settings.fancourier__password,
      username: settings.fancourier__username,
    }

    // @TODO: Change to the first element of an array after we will have only one packageAttachment per order
    const packageItem = order?.packageAttachment?.packages?.pop()
    const trackingNumber = packageItem?.trackingNumber

    const invoiceNumber = packageItem?.invoiceNumber

    const updatedAwbInfo = (await this.requestToFanCourier(
      'awb_tracking_integrat.php',
      {
        ...formData,
        AWB: trackingNumber,
        display_mode: 3,
      },
      { responseType: 'text' }
    )) as string

    const trackingHistory = updatedAwbInfo.split('\n')

    let trackingEvents: VtexTrackingEvent[] = []
    let isDelivered = false

    if (trackingHistory.length) {
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
      pathParams: {
        orderId: order.orderId,
        invoiceNumber,
      },
      payload: {
        isDelivered,
        events: trackingEvents,
      },
    }
  }

  private requestToFanCourier(
    url: string,
    payload: FanCourierRequestPayloadType,
    options: { responseType: 'text' | 'blob' }
  ) {
    if (!url) {
      throw new Error('URL is required')
    }

    const form = new FormData()

    for (const propName in payload) {
      const value: FormDataAcceptedTypes = payload[propName]

      if (typeof value === 'object' && value?.isFile) {
        form.append(propName, value.value, {
          filename: value.filename,
          contentType: value.contentType,
        })
      } else {
        form.append(propName, value)
      }
    }

    return new Promise((resolve, reject) => {
      form.submit(`https://www.selfawb.ro/${url}`, (err, _res) => {
        if (err) {
          return reject(err)
        }

        const body: string[] | Uint8Array[] = []

        _res.on('data', (chunk) => {
          body.push(chunk)
        })

        _res.on('end', () => {
          if (options.responseType === 'text') {
            return resolve(body.join(''))
          }

          if (options.responseType === 'blob') {
            return resolve(Buffer.concat(body as Uint8Array[]))
          }

          resolve(body)
        })

        _res.on('error', () => reject(body))
      })
    })
  }
}
