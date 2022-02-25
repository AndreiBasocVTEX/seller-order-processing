import React, { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button, IconDownload, Tooltip } from 'vtex.styleguide'
import type { AxiosError } from 'axios'
import axios from 'axios'
import { useIntl } from 'react-intl'

import { SMARTBILL } from '../../utils/constants'
import type { InvoiceButtonProps } from '../../types/common'
import ErrorPopUpMessage from '../ErrorPopUpMessage'
import { parseErrorResponse } from '../../utils/errorParser'

const InvoiceButton: FC<InvoiceButtonProps> = ({
  orderId,
  invoiceKey,
  invoiceNumber,
  invoiceUrl,
  orderStatus,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [invoiceAvailable, setInvoiceAvailable] = useState<string | null>(null)
  const [axiosError, setAxiosError] = useState({
    isError: false,
    errorMessage: '',
    errorDetails: '',
  })

  const intl = useIntl()

  const isFactureUrlAvailable = (
    invoiceType?: string | null
  ): string | null => {
    if (invoiceType === SMARTBILL) {
      return SMARTBILL
    }

    if (invoiceNumber) {
      return invoiceUrl || 'noUrl'
    }

    if (invoiceUrl) {
      return invoiceUrl
    }

    return null
  }

  const printInvoice = async (_orderId: string) => {
    setIsLoading(true)
    const data = await axios
      .get(`/opa/orders/${_orderId}/get-invoice`, {
        params: {
          paperSize: 'A4',
        },
        responseType: 'blob',
      })
      .then((res) => {
        return res.data
      })
      .catch(async (error: AxiosError<Blob>) => {
        if (!error.response) {
          return
        }

        const response = await parseErrorResponse(error.response)

        const errorData = {
          message: response.message,
          details: response.details,
        }

        setAxiosError({
          ...axiosError,
          isError: true,
          errorDetails: errorData.details,
          errorMessage: String(errorData.message),
        })
      })

    if (data && !axiosError.isError) {
      const blob = new Blob([data], { type: 'application/pdf' })
      const blobURL = URL.createObjectURL(blob)

      window.open(blobURL)
    }

    setIsLoading(false)
  }

  const removeAxiosError = () => {
    setAxiosError({
      ...axiosError,
      isError: false,
    })
  }

  useEffect(() => {
    setInvoiceAvailable(isFactureUrlAvailable(invoiceKey))
    setIsLoading(false)
  }, [orderId, invoiceKey])

  const invoiceButton = () => (
    <Button
      variation="secondary"
      block
      isLoading={isLoading}
      disabled={orderStatus === 'canceled' || invoiceAvailable === 'noUrl'}
      onClick={(e: Event) => {
        e.stopPropagation()
        invoiceAvailable && invoiceAvailable !== SMARTBILL
          ? window.open(`https://${invoiceAvailable}`)
          : printInvoice(orderId)
      }}
    >
      <div className="tl">
        <span className="pr3">
          <IconDownload />
        </span>
      </div>

      <span className="w-100 pr3 tc truncate f6">{invoiceNumber}</span>
    </Button>
  )

  return (
    <>
      {invoiceAvailable ? (
        invoiceAvailable !== 'noUrl' ? (
          <Tooltip
            label={
              invoiceKey === 'smartbill'
                ? ` ${intl.formatMessage({
                    id: 'seller-dashboard.table-column.download-invoice',
                  })} ${invoiceKey} ${invoiceNumber}`
                : `${intl.formatMessage({
                    id: 'seller-dashboard.table-column.download-invoice',
                  })} ${invoiceNumber}`
            }
          >
            {invoiceButton()}
          </Tooltip>
        ) : (
          invoiceButton()
        )
      ) : null}
      {axiosError.isError && (
        <ErrorPopUpMessage
          errorMessage={axiosError.errorMessage}
          errorDetails={axiosError.errorDetails}
          resetError={removeAxiosError}
        />
      )}
    </>
  )
}

export default InvoiceButton
