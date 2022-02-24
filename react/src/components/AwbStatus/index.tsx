import type {FC} from 'react'
import React, {useEffect, useState} from 'react'
import {Button, Spinner, Tooltip} from 'vtex.styleguide'
import {useIntl} from 'react-intl'

import type {IAwbStatusProps} from '../../types/awbStatus'
import {getOrderAwbStatus} from '../../utils/api'
import type {AttachmentPackages} from '../../typings/normalizedOrder'

const AwbStatus: FC<IAwbStatusProps> = ({orderId, initialData, size}) => {
  const [awbStatus, setAwbStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const intl = useIntl()

  const setInitialStatus = (data: AttachmentPackages | null) => {
    const orderDeliveryStatus = data?.courierStatus?.data?.description

    if (orderDeliveryStatus) {
      setAwbStatus(orderDeliveryStatus)
    } else if (data?.courierStatus?.finished) {
      setAwbStatus('Comanda a fost livrata')
    } else if (data) {
      setAwbStatus('Comanda nu a fost livrata')
    }

    setIsLoading(false)
  }

  const updateStatus = async () => {
    const data = await getOrderAwbStatus(orderId)

    const lastEvent = data?.events?.length && data?.events[0]

    if (lastEvent) {
      setAwbStatus(lastEvent.description)
    } else if (data) {
      switch (data.isDelivered) {
        case true:
          setAwbStatus(
            intl.formatMessage({
              id: 'seller-dashboard.order-status.order-was-delivered',
            })
          )
          break

        case false:
          setAwbStatus(
            intl.formatMessage({
              id: 'seller-dashboard.order-status.order-was-not-delivered',
            })
          )
          break

        default:
          break
      }
    }

    setIsLoading(false)
  }

  const handleUpdateStatus = () => {
    setIsLoading(true)
    updateStatus()
  }

  useEffect(() => {
    if (!initialData) {
      updateStatus()
    } else {
      setInitialStatus(initialData)
    }
  }, [])

  switch (size) {
    case 'small':
      return (
        <div
          className="flex justify-center items-center pr1 w-100"
        >
          {isLoading ? (
            <Spinner size={20}/>
          ) : awbStatus ? (
            <Tooltip label={awbStatus}>
              <div className="br-pill bg-muted-2 tc white-90 truncate fw4 ph4 pv2 f7 w-100">
                {awbStatus}
              </div>
            </Tooltip>
          ) : (
            <div className="br-pill bg-muted-2 w5 white-90 fw4 pv2 tc f7 truncate w-100">
              {intl.formatMessage({
                id: 'order-detail.common.no-data',
              })}
            </div>
          )}
        </div>
      )

    case 'large':
      return (
        <div className="flex flex-column">
          <div className="flex items-center">
            <p className="fw5 mr2">
              {intl.formatMessage({
                id: 'seller-dashboard.table-column.status',
              })}{' '}
              AWB:{' '}
            </p>
            <div className="flex justify-center items-center">
              {isLoading ? (
                <div
                  className="flex justify-center"
                  style={{minWidth: '12rem'}}
                >
                  <Spinner size={20}/>
                </div>
              ) : awbStatus ? (
                <Tooltip label={awbStatus}>
                  <div className="mw5 br-pill bg-muted-2 tc white-90 fw4 ph4 pv2 truncate f7">
                    {awbStatus}
                  </div>
                </Tooltip>
              ) : (
                <div className="mw5 br-pill bg-muted-2 tc white-90 fw4 ph4 pv2 truncate f7">
                  {intl.formatMessage({
                    id: 'order-detail.common.no-data',
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="self-end">
            <Tooltip
              label={intl.formatMessage({
                id: 'seller-dashboard.table-column.update-status',
              })}
            >
              <Button
                size="small"
                disabled={isLoading}
                onClick={handleUpdateStatus}
              >
                Update status
              </Button>
            </Tooltip>
          </div>
        </div>
      )

    default:
      return null
  }
}

export default AwbStatus
