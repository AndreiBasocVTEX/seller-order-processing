import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { Button, Spinner, Tooltip, IconVisibilityOn } from 'vtex.styleguide'

import type { IAwbStatusProps } from '../../types/awbStatus'
import { getOrderAwbStatus } from '../../utils/api'

const AwbStatus: FC<IAwbStatusProps> = ({ orderId, size }) => {
  const [awbStatus, setAwbStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getAwbStatus = async () => {
    const data = await getOrderAwbStatus(orderId)

    const lastEvent = data?.events?.length && data?.events[0]

    if (lastEvent) {
      setAwbStatus(lastEvent.description)
    } else if (data) {
      switch (data.isDelivered) {
        case true:
          setAwbStatus('Comanda a fost livrata')
          break

        case false:
          setAwbStatus('Comanda nu a fost livrata')
          break

        default:
          break
      }
    }

    setIsLoading(false)
  }

  const handleUpdateStatus = () => {
    setIsLoading(true)
    getAwbStatus()
  }

  useEffect(() => {
    getAwbStatus()
  }, [])

  switch (size) {
    case 'small':
      return (
        <div className="flex items-center mw-100">
          <div className="mr2">
            <Button
              size="small"
              disabled={isLoading}
              onClick={handleUpdateStatus}
            >
              <IconVisibilityOn />
            </Button>
          </div>
          <div
            style={{ minWidth: '8rem' }}
            className="flex justify-center items-center pr1"
          >
            {isLoading ? (
              <Spinner size={20} />
            ) : awbStatus ? (
              <Tooltip label={awbStatus}>
                <div className="br-pill bg-muted-2 tc mw-100 white-90 truncate fw4 ph4 pv2">
                  {awbStatus}
                </div>
              </Tooltip>
            ) : (
              <div className="br-pill bg-muted-2 tc mw-100 white-90 truncate fw4 ph4 pv2">
                Lipsa date
              </div>
            )}
          </div>
        </div>
      )

    case 'large':
      return (
        <div className="flex flex-column">
          <div className="flex items-center">
            <p className="fw5 mr2">Status AWB: </p>
            <div className="flex justify-center items-center">
              {isLoading ? (
                <div
                  className="flex justify-center"
                  style={{ minWidth: '12rem' }}
                >
                  <Spinner size={20} />
                </div>
              ) : awbStatus ? (
                <Tooltip label={awbStatus}>
                  <div className="mw5 br-pill bg-muted-2 tc white-90 fw4 ph4 pv2 truncate">
                    {awbStatus}
                  </div>
                </Tooltip>
              ) : (
                <div className="mw5 br-pill bg-muted-2 tc white-90 fw4 ph4 pv2 truncate">
                  Lipsa date
                </div>
              )}
            </div>
          </div>
          <div className="self-end">
            <Button
              size="small"
              disabled={isLoading}
              onClick={handleUpdateStatus}
            >
              Update status
            </Button>
          </div>
        </div>
      )

    default:
      return null
  }
}

export default AwbStatus
