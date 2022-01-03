import { Apps } from '@vtex/api'

export const getVtexAppSettings = (ctx: Context) => {
  const apps = new Apps(ctx.vtex)

  return apps.getAppSettings(ctx.vtex.userAgent)
}
