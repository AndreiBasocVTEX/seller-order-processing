import { json } from 'co-body';
import { IVtexOrder } from '../../vtex/dto/order.dto';
import { NotifyInvoiceDTO } from "../../vtex/dto/invoice.dto";
import { CarrierValues } from '../../shared/enums/carriers.enum';
import { TrackingInfoDTO } from '../../shared/clients/carrier-client';
import {
  TrackAndInvoiceRequestDTO,
} from '../dto/order-api';
import { VtexAuthData } from '../../shared/dto/VtexAuthData';
import { formatError } from '../utils/formatError';
import { getVtexAppSettings } from '../utils/getVtexAppSettings';


export async function trackAndInvoiceMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const {
    vtex: {
      logger, route: { params },
    }, clients: { vtexOrder: vtexOrderClient, carrier: carrierClient },
  } = ctx;

  const orderId = params.orderId as string;

  const invoiceData: TrackAndInvoiceRequestDTO = await json(ctx.req);

  const { invoice, tracking } = invoiceData;

  try {
    const settings = await getVtexAppSettings(ctx);

    const carrier = carrierClient.getCarrierClientByName(
      ctx,
      tracking.provider as CarrierValues
    );

    const vtexAuthData: VtexAuthData = {
      vtex_appKey: settings.vtex_appKey,
      vtex_appToken: settings.vtex_appToken,
    };

    let trackingInfoPayload: TrackingInfoDTO;

    if (tracking.generate) {
      const order: IVtexOrder = await vtexOrderClient.getVtexOrderData(
        vtexAuthData,
        orderId
      );

      trackingInfoPayload = await carrier.requestAWBForInvoice({
        settings,
        order,
        trackingRequest: tracking,
      });
    } else {
      trackingInfoPayload = {
        courier: tracking.provider,
        trackingNumber: tracking.params.trackingNumber as string,
        trackingUrl: tracking.params.trackingUrl ?? '',
      };
    }

    if (invoice.provider === 'smartbill') {
      // add Smartbill integration
    } else {
      trackingInfoPayload = {
        ...trackingInfoPayload,
        ...invoice.params,
      };
    }

    // TODO: finish this
    const notifyInvoiceRequest: NotifyInvoiceDTO = {
      ...trackingInfoPayload,
      type: 'Output',
      invoiceNumber: 'string',
      items: [],
      issuanceDate: '',
      invoiceValue: 0,
    };

    const invoiceInfo = await vtexOrderClient.trackAndInvoice(
      vtexAuthData,
      orderId,
      notifyInvoiceRequest
    );

    ctx.status = 200;
    ctx.body = {
      invoiceInfo,
      trackAndInvoiceDetails: {
        orderId,
        trackingNumber: trackingInfoPayload.trackingNumber,
        trackingUrl: trackingInfoPayload.trackingUrl,
        courier: trackingInfoPayload.courier,
        invoiceNumber: invoice.params.invoiceNumber,
        invoiceUrl: invoice.params.invoiceUrl,
      },
    };
  } catch (e) {
    logger.error(formatError(e));

    ctx.status = 500;
    ctx.body = e;
  }

  await next();
}
