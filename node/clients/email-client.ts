import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

interface EmailData {
  TemplateName: string
  applicationName: string
  logEvidence: boolean
  jsonData: {
    to: {
      name: string
      email: string
      subject: string
    }
    [field: string]: any
  }
}

export default class EmailClient extends ExternalClient {
  private routes = {
    sendMail: () => `/pvt/sendmail`,
  }

  constructor(context: IOContext, options?: InstanceOptions) {
    super(
      `http://${context.account}.vtexcommercestable.com.br/api/mail-service`,
      context,
      {
        ...options,
        headers: {
          ...options?.headers,
          VtexIdclientAutCookie: context.authToken,
        },
      }
    )
  }

  public async sendMail(data: EmailData) {
    return this.http.post(this.routes.sendMail(), data)
  }
}
