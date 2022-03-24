import type { IOContext, InstanceOptions } from '@vtex/api'
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
import { payloadToFormData } from '../../core/helpers/body-parser.helper'
import type { FormDataPayload } from '../../core/models/form-data.model'
import { ValidationError } from '../../core/helpers/error.helper'
import type { ObjectLiteral } from '../../core/models/object-literal.model'

export default class FancourierClient extends CarrierClient {
  protected requiredSettingsFields = [
    'fancourier__isEnabled',
    'fancourier__username',
    'fancourier__password',
    'fancourier__clientId',
    'fancourier__warehouseId',
  ]

  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, 'http://www.selfawb.ro/', options)
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
    logger,
  }: CreateTrackingRequest): Promise<{
    resStatus: string
    lineNumber: string
    rate: string
    trackingNumber: string
  }> {
    logger?.info({
      function: 'Request AWB',
      carrier: 'Fancourier',
      message: `Fancourier data to create payload`,
      trackingParams: params,
    })

    const fancourierOrderPayload = await createFancourierOrderPayload(
      order,
      settings.fancourier__warehouseId,
      params
    )

    logger?.info({
      function: 'RequestAWB',
      carrier: 'Fancourier',
      message: `Payload to generate AWB for order with ID ${order.orderId}`,
      fancourierOrderPayload,
    })

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

    logger?.info({
      function: 'RequestAWB',
      carrier: 'Fancourier',
      message: `Fancourier file data`,
      fileData,
    })

    const csv = new ObjectsToCsv(fileData)
    const csvData = await csv.toString()

    logger?.info({
      function: 'RequestAWB',
      carrier: 'Fancourier',
      message: `Fancourier CSV data`,
      csvData,
    })

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

    logger?.info({
      function: 'RequestAWB',
      carrier: 'Fancourier',
      message: `Fancourier generate AWB response`,
      lineNumber,
      resStatus,
      trackingNumber,
      rate,
    })

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
    logger,
  }: GetTrackingLabelRequest): Promise<unknown> {
    logger?.info({
      function: 'trackingLabel',
      carrier: 'Fancourier',
      message: `Request to create tracking label`,
      trackingNumber,
      paperSize,
    })

    return this.requestToFanCourier(
      'view_awb_integrat_pdf.php',
      {
        client_id: settings.fancourier__clientId,
        user_pass: settings.fancourier__password,
        username: settings.fancourier__username,
        nr: trackingNumber,
        page: paperSize,
      },
      { responseType: 'arraybuffer' }
    )
  }

  public async createTracking(request: CreateTrackingRequest) {
    const { logger } = request

    logger?.info({
      function: 'createTracking',
      carrier: 'Fancourier',
      message: `Request to create tracking`,
      request,
    })

    const { trackingNumber } = await this.requestAWB(request)

    logger?.info({
      function: 'createTracking',
      carrier: 'Fancourier',
      message: `Fancourier AWB tracking number`,
      trackingNumber,
    })

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
    logger,
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

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Fancourier',
      message: `Fancourier tracking history`,
      AWBHistory: updatedAwbInfo,
    })

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

    logger?.info({
      function: 'getTrackingStatus',
      carrier: 'Fancourier',
      message: `Fancourier tracking events and delivery status`,
      deliveryStatus: isDelivered,
      trackingEvents,
    })

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
    options: { responseType: 'text' | 'arraybuffer' }
  ) {
    if (!url) {
      throw new ValidationError({ message: 'URL is required' })
    }

    const acceptTypeByResponse = {
      text: 'text/html',
      arraybuffer: 'application/pdf',
    }

    const form = payloadToFormData(payload)
    const formBody = form.getBuffer().toString()
    const formBoundary = form.getBoundary()

    return this.http.post<string | Buffer>(url, formBody, {
      ...options,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
        'Accept-Type': acceptTypeByResponse[options.responseType],
      },
    })
  }
}
