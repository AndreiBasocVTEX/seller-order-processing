// language=Handlebars
const newOrderTemplate = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN"
            "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:v="urn:schemas-microsoft-com:vml"
          style="-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; box-sizing: border-box; width: 100%; height: 100%; margin: 0; padding: 0; background: #f1f1f1 !important;">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
        <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>{{_accountInfo.TradingName}}</title>

    </head>
    <body style="-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; box-sizing: border-box; width: 100%; height: 90%; margin: 5px; background: #f1f1f1 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0"
           style="box-sizing: border-box; margin: 0; padding: 0; background: #f1f1f1; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; height: 100%; line-height: 100% !important;">
        <tr style="box-sizing: border-box !important;">
            <td align="left" valign="top"
                style="font-size: 14px; line-height: 20px; box-sizing: border-box; border-collapse: collapse; text-align: left !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; ">
                <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0"
                       style="margin-top: 2rem !important; margin-bottom: 2rem !important; box-sizing: border-box; max-width: 40rem; width: 100%; background-color: #fff; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"
                       bgcolor="#fff">
                    <tr style="box-sizing: border-box !important;">
                        <td style="padding-left: 2rem; padding-right: 2rem; font-size: 14px; line-height: 20px; box-sizing: border-box; border-collapse: collapse; border-bottom-style: solid; border-bottom-width: 1px; border-color: #eee; width: 100%; padding-bottom: 2rem; text-align: center !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"
                            align="center">
                            <h1 style="margin: 2rem 0 10px 0; font-size: 40px; line-height: 48px; box-sizing: border-box !important;">
                                You have a new order!</h1>
                            <h3 style="margin: 0; font-size: 20px; line-height: 28px; text-transform: uppercase; box-sizing: border-box !important;">
                                Marketplace</h3>
                        </td>
                    </tr>
                    <tr style="box-sizing: border-box !important;">
                        <td style="padding-left: 2rem; padding-right: 2rem; font-size: 14px; line-height: 20px; box-sizing: border-box; border-collapse: collapse; text-align: left; width: 100%; padding-bottom: 2rem; padding-top: 1rem !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"
                            align="left">
                            <p style="display: inline-block; margin-top: 2rem !important;">
                                <strong>VTEX ID: {{orderId}}</strong><br/>
                                <strong>MarketPlace ID: {{ vendorOrderId }}</strong>
                            </p>
                            <a style="display: inline-block; float: right; margin-top: 2rem !important; padding: 0.5rem 1.25rem;
                                      text-decoration: none; font-weight: bold;
                                      background-color: #134cd8; border-color: #134cd8; border-radius: 0.25rem; color: white "
                               href="https://{{hostname}}.myvtex.com/admin/order-details/{{orderId}}">
                                VEZI COMANDA
                            </a>
                            <div>
                                <h3>Order data</h3>
                                <p style="margin: 0;">Order date: {{creationDate}}</p>
                                <p style="margin: 0;">Payment method: {{ paymentMethod }}</p>
                                <p style="margin: 0;">Delivery method: Curier standard</p>
                                <p style="margin: 0;">Delivery estimate: {{ deliveryEstimate }}</p>
                            </div>
                            <div>
                                <h3>Delivery address</h3>
                                <p style="margin: 0;">Name: {{shippingData.address.receiverName}}</p>
                                <p style="margin: 0;">Phone: {{clientProfileData.phone}}</p>
                                <p style="margin: 0;">Address: {{shippingData.address.street}}</p>
                                <p style="margin: 0;">Town: {{shippingData.address.city}}, County {{county}}</p>
                            </div>
                            <div>
                                <h3>Billing data</h3>
                                <p style="margin: 0;">Person type: {{#if clientProfileData.isCorporate}}
                                    Persoana juridica {{else}} Persoana fizica {{/if}}</p>
                                <p style="margin: 0;">Name: {{#if
                                        clientProfileData.isCorporate}} {{clientProfileData.corporateName}} {{else}} {{clientProfileData.firstName}} {{clientProfileData.lastName}} {{/if}}</p>
                                <p style="margin: 0;">Address: {{invoiceData.address.street}}</p>
                                <p style="margin: 0;">Town: {{invoiceData.address.city}}, County {{county}}</p>
                            </div>
                        </td>
                    </tr>
                    <tr style="box-sizing: border-box !important;">
                        <td style=" padding-left: 2rem; padding-right: 2rem;font-size: 14px; line-height: 20px; box-sizing: border-box; border-collapse: collapse; text-align: left; border-top-style: solid; border-top-width: 1px; border-bottom-style: solid; border-bottom-width: 1px; border-color: #eee; border-width: .5rem; width: 100%; padding-top: 2rem; padding-bottom: 2rem !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"
                            align="left">
                            <h3 style="font-size: 24px; line-height: 36px; box-sizing: border-box; margin-top: 0 !important;">
                                Produse</h3>
                            <div style="box-sizing: border-box; border-radius: 2px; max-width: 100%; background-color: #eee; padding: 1rem; margin-bottom: 1rem !important;">
                                {{#each items}}
                                    <div style="display:flex; justify-content: space-between;
                                    margin: 15px 0;">
                                        <div>
                                            <p style="display: inline-block; margin: 0; font-size: 12px;  text-transform: uppercase; box-sizing: border-box !important;">
                                                {{this.name}}
                                            </p>
                                        </div>
                                        <div  style="display:flex; justify-content: space-between; width:12%">
                                            <p style="display: inline-block; float: right; margin: 0; font-size: 12px; text-transform: uppercase; box-sizing: border-box !important;">
                                                x{{this.quantity}}
                                            </p>
                                            <p style="display: block; text-align: right; margin: 0; font-size: 12px; box-sizing: border-box !important;">{{this.price}}
                                                Lei</p>
                                        </div>

                                    </div>
                                {{/each}}
                                <div style="text-align: right; margin: 0;">
                                    <p style="margin: 0; font-size: 14px; box-sizing: border-box !important;">
                                        Transport: {{ transportPrice }} Lei</p>
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; box-sizing: border-box !important;">
                                        Total: {{value}} Lei</p>
                                </div>
                            </div>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    </body>
    </html>
`

export default newOrderTemplate
