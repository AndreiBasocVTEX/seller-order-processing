import { BillingsEnum } from '../../shared/enums/billings.enum'
import { getVtexAppSettings } from '../utils/getVtexAppSettings'

export async function getActiveProvidersHandler(ctx: Context) {
  const settings = await getVtexAppSettings(ctx)

  return {
    ...ctx.clients.carrier.getActiveCarriers(ctx),
    [BillingsEnum.SMARTBILL]: ctx.clients[BillingsEnum.SMARTBILL].isActive(
      settings
    ),
  }
}
