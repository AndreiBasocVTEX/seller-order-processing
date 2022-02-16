import React, { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Button, IconDownload, Tooltip } from 'vtex.styleguide'
import type { AxiosError } from 'axios'
import axios from 'axios'

import { SMARTBILL } from '../../utils/constants'
import type { InvoiceButtonProps } from '../../types/common'
import ErrorPopUpMessage from '../ErrorPopUpMessage'

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

        const response = error.response

        const errorResponse = await new Promise<{
          message: string
          details: string
        }>((resolve) => {
          const fileReader = new FileReader()

          fileReader.readAsText(response.data)
          fileReader.onload = () => {
            const errorJSON = JSON.parse(fileReader.result as string) as {
              message: string
              stack: string
            }

            resolve({
              message: errorJSON.message,
              details: errorJSON.stack,
            })
          }
        })

        const errorData = {
          message: errorResponse.message,
          details: errorResponse.details,
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
      onClick={() => {
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
          <Tooltip label={invoiceNumber}>{invoiceButton()}</Tooltip>
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
