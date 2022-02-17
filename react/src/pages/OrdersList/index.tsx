/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
import axios from 'axios'
import {
  Checkbox,
  DatePicker,
  FilterBar,
  IconDownload,
  Link,
  Pagination,
  Table,
  Tag,
  Tooltip,
  Totalizer,
} from 'vtex.styleguide'
import { FormattedCurrency } from 'vtex.format-currency'

import RequestAwbModal from '../../components/AwbModal'
import '../../public/style.css'
import type { IOrder } from '../../typings/order'
import type {
  IStatement,
  IDatePickerProp,
  IOrderAwb,
  ITrackingObj,
} from '../../types/common'
import AwbStatus from '../../components/AwbStatus'
import { getOrderStatus } from '../../utils/normalizeData/orderDetails'
import InvoiceButton from '../../components/InvoiceButton'
import { disabledCouriers } from '../../utils/constants'

const OrdersList: FC = () => {
  const [awbUpdate, setAwbUpdate] = useState(false)
  const [dateUrl, setDateUrl] = useState('')
  const [filterUrl, setFilterUrl] = useState('')
  const [filterStatus, setFilterStatus] = useState<IStatement[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [trackingNum, setTrackingNum] = useState<ITrackingObj>({})
  const [orderAwb, setOrderAwb] = useState<IOrderAwb[]>([])
  const [paginationParams, setPaginationParams] = useState({
    items: [],
    currentItemFrom: 1,
    currentItemTo: 2,
    itemsLength: 0,
    paging: {
      total: 0,
      currentPage: 1,
      perPage: 15,
      pages: 1,
    },
    stats: {
      stats: {
        totalValue: { Sum: 1, Count: 1 },
      },
    },
  })

  const [isLoading, setIsLoading] = useState(true)

  const fetchTrackingNumbers = useCallback((orders: IOrder[]) => {
    orders.forEach(async (el: IOrder) => {
      const { data }: { data: IOrder } = await axios.get(
        `/api/oms/pvt/orders/${el.orderId}`
      )

      const lastOrder = data.packageAttachment.packages.length - 1

      setOrderAwb((prevState: IOrderAwb[]): IOrderAwb[] => {
        return [
          ...prevState,
          {
            orderId: el.orderId.toString(),
            orderValue:
              data.packageAttachment?.packages[lastOrder]?.trackingNumber ||
              'Generează AWB & Factura',
            courier: data.packageAttachment?.packages[lastOrder]?.courier,
            payMethod: data.openTextField?.value,
            invoiceNumber:
              data.packageAttachment?.packages[lastOrder]?.invoiceNumber,
            invoiceKey: data.packageAttachment?.packages[lastOrder]?.invoiceKey,
            invoiceUrl: data.packageAttachment?.packages[lastOrder]?.invoiceUrl,
          },
        ]
      })
    })
  }, [])

  const resetOrdersData = (
    orderId: string,
    invoiceKey: string | null,
    invoiceNumber: string,
    invoiceUrl: string | null
  ) => {
    let updatedOrderAwb = orderAwb.find((order) => order.orderId === orderId)
    const filteredListOrderAwb = orderAwb.filter(
      (order) => order.orderId !== orderId
    )

    if (updatedOrderAwb) {
      updatedOrderAwb = {
        ...updatedOrderAwb,
        invoiceKey,
        invoiceNumber,
        invoiceUrl,
      }
      setOrderAwb([...filteredListOrderAwb, updatedOrderAwb])
    }
  }

  const getItems = useCallback(
    async (newParams) => {
      let url = `/api/oms/pvt/orders?_stats=1&page=${newParams.paging.currentPage}&per_page=${newParams.paging.perPage}`

      if (searchValue !== '') {
        url += `&q=${searchValue}`
      }

      if (filterUrl.length) {
        url += `&f_status=${filterUrl}`
      }

      if (dateUrl) {
        url += `&f_creationDate=creationDate:[${dateUrl}]`
      }

      try {
        const { data } = await axios.get(url, {
          headers: { Accept: 'application/json' },
          params: {},
        })

        setIsLoading(false)
        setPaginationParams({
          ...newParams,
          items: data.list,
          paging: data.paging,
          stats: data.stats,
          currentItemTo: data.paging.perPage * data.paging.currentPage,
        })
        fetchTrackingNumbers(data.list)
      } catch (err) {
        console.log(err)
      }
    },
    [filterStatus, fetchTrackingNumbers, searchValue]
  )

  type SchemeDataType = {
    rowData: IOrder
    cellData: IOrder
  }
  const displayStatus = (cellData: string) => {
    const orderStatus = getOrderStatus(cellData)

    if (orderStatus?.shortText) {
      return (
        <>
          <Tooltip label={orderStatus.longText} position="bottom">
            <span>
              <Tag bgColor={orderStatus.bgColor} color={orderStatus.color}>
                <span className="fw3 f7 ph4">{orderStatus.shortText} </span>
              </Tag>
            </span>
          </Tooltip>
        </>
      )
    }

    if (orderStatus && !orderStatus.shortText) {
      return (
        <Tag bgColor={orderStatus.bgColor} color={orderStatus.color}>
          <span className="fw3 f7 helvetica"> {orderStatus.longText} </span>
        </Tag>
      )
    }

    return <span>missing tag</span>
  }

  const displayAwbInfoButton = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (labelOrder: IOrderAwb) => labelOrder?.orderId === rowData?.orderId
      )

      if (order?.courier && order?.orderValue) {
        return (
          <>
            <IconDownload />
            <span className="ml4">
              {order.courier} {order.orderValue}
            </span>
          </>
        )
      }

      return <>{order?.orderValue}</>
    },
    [orderAwb]
  )

  const getInvoiceNumber = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (labelOrder: IOrderAwb) => labelOrder?.orderId === rowData?.orderId
      )

      return order ? `${order.invoiceNumber ? order.invoiceNumber : ' '}` : ''
    },
    [orderAwb]
  )

  const getPayMethod = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (payOrder: IOrderAwb) => payOrder?.orderId === rowData?.orderId
      )

      if (order?.payMethod) {
        const orderMatched = order.payMethod.match(/\b(\w+)$/g) as string[]

        return orderMatched[0] || ''
      }

      return ''
    },
    [orderAwb]
  )

  const getElefantOrderId = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (payOrder: IOrderAwb) => payOrder?.orderId === rowData?.orderId
      )

      if (order?.payMethod) {
        const orderMatched = order.payMethod.match(/\d/g) as string[]

        return orderMatched.join('') || ''
      }

      return ''
    },
    [orderAwb]
  )

  const handleNextClick = () => {
    const { currentPage } = paginationParams.paging
    const { currentItemTo } = paginationParams
    const { perPage } = paginationParams.paging
    const newParams = {
      ...paginationParams,
      currentItemFrom: currentPage * perPage,
      currentItemTo: currentItemTo * perPage,
      paging: { ...paginationParams.paging, currentPage: currentPage + 1 },
    }

    setPaginationParams(newParams)
    getItems(newParams)
  }

  const handlePrevClick = () => {
    const { currentPage } = paginationParams.paging
    const { currentItemTo } = paginationParams
    const { perPage } = paginationParams.paging
    const newParams = {
      ...paginationParams,
      paging: { ...paginationParams.paging, currentPage: currentPage - 1 },
      currentItemFrom: (currentPage - 2) * perPage,
      currentItemTo: currentItemTo * perPage,
    }

    setPaginationParams(newParams)
    getItems(newParams)
  }

  const handleRowsChange = useCallback((_e: unknown, value: number) => {
    const newParams = {
      ...paginationParams,
      paging: { ...paginationParams.paging, perPage: Number(value) },
    }

    setPaginationParams(newParams)
    getItems(newParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputSearchChange = useCallback(
    (e: any) => {
      setSearchValue(e.target.value)
      setPaginationParams({
        ...paginationParams,
        paging: {
          total: paginationParams.paging.total,
          currentPage: 1,
          perPage: paginationParams.paging.perPage,
          pages: paginationParams.paging.pages,
        },
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginationParams, searchValue]
  )

  const handleInputSearchClear = useCallback(() => {
    setSearchValue('')
    setPaginationParams({
      ...paginationParams,
      currentItemFrom: paginationParams.paging.perPage,
      currentItemTo: 2 * paginationParams.paging.perPage,
      paging: {
        total: paginationParams.paging.total,
        currentPage: 1,
        perPage: paginationParams.paging.perPage,
        pages: paginationParams.paging.pages,
      },
    })
    getItems(paginationParams)
  }, [getItems, paginationParams])

  const handleInputSearchSubmit = useCallback(() => {
    setPaginationParams({
      ...paginationParams,
      currentItemFrom: paginationParams.paging.perPage,
      currentItemTo: 2 * paginationParams.paging.perPage,
      paging: {
        total: paginationParams.paging.total,
        currentPage: 1,
        perPage: paginationParams.paging.perPage,
        pages: paginationParams.paging.pages,
      },
    })
    getItems(paginationParams)
  }, [getItems, paginationParams, searchValue])

  const tableOrdersSchema = useMemo(
    () => ({
      properties: {
        status: {
          title: 'Status',
          width: 100,
          cellRenderer: ({ cellData }: { cellData: string }): JSX.Element => {
            return displayStatus(cellData)
          },
        },
        marketPlaceOrderId: {
          title: 'Marketplace #',
          width: 110,
          cellRenderer: ({
            rowData,
          }: {
            cellData: string
            rowData: IOrder
          }): JSX.Element => {
            return (
              <div className="center">
                <Link href={`/admin/app/order-details/${rowData.orderId}`}>
                  {getElefantOrderId(rowData)}
                </Link>
              </div>
            )
          },
        },
        orderId: {
          title: 'VTEX #',
          hidden: true,
          width: 170,
          cellRenderer: ({
            cellData,
            rowData,
          }: {
            cellData: string
            rowData: IOrder
          }): JSX.Element => {
            return (
              <Link href={`/admin/app/order-details/${rowData.orderId}`}>
                {cellData}
              </Link>
            )
          },
        },
        creationDate: {
          title: 'Creation Date',
          width: 140,
          cellRenderer: ({ cellData }: { cellData: string }): string => {
            return new Intl.DateTimeFormat('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: false,
              timeZone: 'Europe/Bucharest',
            }).format(new Date(cellData))
          },
        },
        ShippingEstimatedDateMax: {
          title: 'Shipping ETA',
          width: 120,
          cellRenderer: ({ cellData }: { cellData: string }): string => {
            return new Intl.DateTimeFormat('en-GB', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              timeZone: 'Europe/Bucharest',
            }).format(new Date(cellData))
          },
        },
        clientName: {
          title: 'Receiver',
          width: 150,
        },
        totalItems: {
          title: 'Items',
          width: 70,
          cellRenderer: ({ cellData }: SchemeDataType) => {
            return (
              <span className="f6 lh-copy">
                <Tag
                  style={{ fontSize: '14px', lineHeight: '1.15rem' }}
                  size="small"
                >
                  {cellData}
                </Tag>
              </span>
            )
          },
        },
        totalValue: {
          title: 'Total Value',
          width: 100,
          cellRenderer: ({ cellData }: SchemeDataType) => {
            return <FormattedCurrency key={cellData} value={+cellData / 100} />
          },
        },
        paymentNames: {
          title: 'Pay Method',
          width: 100,
          cellRenderer: ({ rowData }: { rowData: IOrder }): string => {
            return getPayMethod(rowData)
          },
        },
        awbShipping: {
          title: 'AWB Shipping',
          width: 250,
          cellRenderer: ({ rowData }: SchemeDataType) => {
            return (
              <>
                <RequestAwbModal
                  setTrackingNum={setTrackingNum}
                  setOrderAwb={setOrderAwb}
                  neededOrderId={rowData.orderId}
                  onAwbUpdate={setAwbUpdate}
                  resetOrdersData={resetOrdersData}
                />
              </>
            )
          },
        },
        awbStatus: {
          title: 'AWB Status',
          width: 250,
          cellRenderer: ({ rowData }: SchemeDataType) => {
            const rowAwbInfo = orderAwb.find(
              (order) => order?.orderId === rowData.orderId
            )

            const courierInfo = rowAwbInfo?.courier

            if (
              (courierInfo && rowAwbInfo?.orderId) ||
              (rowAwbInfo?.courier && awbUpdate)
            ) {
              if (courierInfo && !disabledCouriers.includes(courierInfo)) {
                return <AwbStatus orderId={rowAwbInfo.orderId} size="small" />
              }
            }

            return null
          },
        },
        Invoice: {
          title: 'Factura',
          width: 250,
          cellRenderer: ({ rowData }: SchemeDataType) => {
            const orderAwbById = orderAwb.find(
              (awbEl) => awbEl.orderId === rowData.orderId
            )

            return (
              orderAwbById && (
                <InvoiceButton
                  orderId={rowData.orderId}
                  invoiceKey={orderAwbById?.invoiceKey}
                  invoiceNumber={orderAwbById?.invoiceNumber}
                  invoiceUrl={orderAwbById?.invoiceUrl}
                  orderStatus={rowData.status}
                />
              )
            )
          },
        },
      },
    }),
    [
      awbUpdate,
      getPayMethod,
      displayAwbInfoButton,
      trackingNum,
      orderAwb,
      getInvoiceNumber,
    ]
  )

  function DatePickerRangeObject({ value, onChange }: IDatePickerProp) {
    return (
      <div className="flex flex-column w-100">
        <br />
        <DatePicker
          label="from"
          value={value?.from || new Date()}
          onChange={(date: Date) => {
            onChange({ ...(value || {}), from: date })
          }}
          locale="en-GB"
        />
        <br />
        <DatePicker
          label="to"
          value={value?.to || new Date()}
          onChange={(date: Date) => {
            onChange({ ...(value || {}), to: date })
          }}
          locale="en-GB"
        />
      </div>
    )
  }

  function StatusSelectorObject({
    value,
    onChange,
  }: {
    value: Record<string, boolean>
    onChange: (value: Record<string, boolean>) => void
  }) {
    const initialValue: Record<string, boolean> = {
      canceled: true,
      handling: true,
      'payment-approved': true,
      'ready-for-handling': true,
      'waiting-for-sellers-confirmation': true,
      'cancellation-requested': true,
      invoiced: true,
      ...(value || {}),
    }

    const toggleValueByKey = (key: string) => {
      return {
        ...(value || initialValue),
        [key]: value ? !value[key] : false,
      }
    }

    return (
      <div>
        {Object.keys(initialValue).map((opt, index) => {
          return (
            <div className="mb3" key={`class-statment-object-${opt}-${index}`}>
              <Checkbox
                checked={value ? value[opt] : initialValue[opt]}
                id={`status-${opt}`}
                label={opt}
                name="status-checkbox-group"
                onChange={() => {
                  const newValue = toggleValueByKey(`${opt}`)

                  onChange(newValue)
                }}
                value={opt}
              />
            </div>
          )
        })}
      </div>
    )
  }

  const handleFiltersChange = useCallback((filterStatements: IStatement[]) => {
    if (!filterStatements?.length) {
      setFilterUrl('')
      setDateUrl('')
    }

    filterStatements.forEach((statement: IStatement) => {
      if (!statement?.object) return
      const { subject, object } = statement

      if (filterStatements.length > 1) {
        switch (subject) {
          case 'status':
            {
              const url = Object.entries(object)
                .filter(([key, value]) => {
                  return value ? key.toLowerCase() : ''
                })
                .join(',')

              setFilterUrl(url)
            }

            break

          case 'creationdate':
            {
              const from =
                object?.from?.toISOString?.() ?? new Date().toISOString()

              const to = object?.to?.toISOString?.() ?? new Date().toISOString()

              setDateUrl(`${from} TO ${to}`)
            }

            break

          default:
            break

            return
        }
      }

      if (filterStatements.length === 1) {
        switch (subject) {
          case 'status':
            {
              const url = Object.entries(object)
                .filter(([key, value]) => {
                  return value ? key.toLowerCase() : ''
                })
                .join(',')

              setDateUrl('')
              setFilterUrl(url)
            }

            break

          case 'creationdate':
            {
              const from =
                object?.from?.toISOString?.() ?? new Date().toISOString()

              const to = object?.to?.toISOString?.() ?? new Date().toISOString()

              setFilterUrl('')
              setDateUrl(`${from} TO ${to}`)
            }

            break

          default:
            break
        }
      }
    })
    setFilterStatus(filterStatements)
  }, [])

  useEffect(() => {
    getItems(paginationParams)
  }, [
    getItems,
    filterStatus,
    trackingNum,
    handleFiltersChange,
    dateUrl,
    filterUrl,
  ])

  return (
    <div className="f6 lh-copy">
      <FilterBar
        alwaysVisibleFilters={['status', 'creationdate']}
        statements={filterStatus}
        clearAllFiltersButtonLabel="Clear Filters"
        onChangeStatements={handleFiltersChange}
        options={{
          creationdate: {
            label: 'Creation date',
            renderFilterLabel: (statement: IStatement) => {
              if (!statement || !statement.object) {
                return 'All'
              }

              return `${
                statement.verb === 'between'
                  ? `between ${statement.object.from} and ${statement.object.to}`
                  : `is ${statement.object}`
              }`
            },
            verbs: [
              {
                value: 'between',
                object: (props: IDatePickerProp) => (
                  <DatePickerRangeObject {...props} />
                ),
              },
            ],
          },
          status: {
            label: 'Status',
            renderFilterLabel: (statement: IStatement) => {
              if (!statement || !statement.object) {
                return 'All'
              }

              const keys = statement.object ? Object.keys(statement.object) : []
              const isAllTrue = !keys.some(
                (key: string) => !statement.object[key]
              )

              const isAllFalse = !keys.some(
                (key: string) => statement.object[key]
              )

              const trueKeys = keys.filter(
                (key: string) => statement.object[key]
              )

              let trueKeysLabel = ''

              trueKeys.forEach((key: string, index: number) => {
                trueKeysLabel += `${key}${
                  index === trueKeys.length - 1 ? '' : ', '
                }`
              })

              return `${
                isAllTrue ? 'All' : isAllFalse ? 'None' : `${trueKeysLabel}`
              }`
            },
            verbs: [
              {
                label: 'includes',
                value: 'includes',
                object: (props: {
                  value: Record<string, boolean>
                  onChange: (value: Record<string, boolean>) => void
                }) => {
                  return <StatusSelectorObject {...props} />
                },
              },
            ],
          },
        }}
      />
      <Totalizer
        horizontalLayout
        items={[
          {
            label: 'Comenzi',
            value: paginationParams.paging.total,
            inverted: true,
          },
          {
            label: 'Prețul mediu de comandă',
            value: `${
              paginationParams.stats.stats.totalValue.Sum
                ? Math.round(
                    paginationParams.stats.stats.totalValue.Sum /
                      paginationParams.stats.stats.totalValue.Count
                  ) / 100
                : '0'
            } Lei`,
            inverted: true,
          },
          {
            label: 'Brut',
            value: `${paginationParams.stats.stats.totalValue.Sum / 100} Lei`,
            inverted: true,
          },
        ]}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <div className="pagination" style={{ width: '300px' }}>
          <Pagination
            rowsOptions={[15, 25, 50, 100]}
            currentItemFrom={paginationParams.currentItemFrom}
            currentItemTo={paginationParams.currentItemTo}
            textOf="of"
            textShowRows="Pe pagina"
            totalItems={paginationParams.paging.total}
            onRowsChange={handleRowsChange}
            onNextClick={handleNextClick}
            onPrevClick={handlePrevClick}
          />
        </div>
      </div>
      <Table
        loading={isLoading}
        density="medium"
        fullWidth
        items={paginationParams.items}
        schema={tableOrdersSchema}
        toolbar={{
          fields: {
            alignMenu: 'right',
            label: 'Toggle visible fields',
            showAllLabel: 'Show All',
            hideAllLabel: 'Hide All',
          },
          density: {
            alignMenu: 'right',
            buttonLabel: 'Line density',
            lowOptionLabel: 'Low',
            mediumOptionLabel: 'Medium',
            highOptionLabel: 'High',
          },
          inputSearch: {
            placeholder: 'Cautati numarul comenzii, destinatarul, plata',
            value: searchValue,
            onChange: handleInputSearchChange,
            onClear: handleInputSearchClear,
            onSubmit: handleInputSearchSubmit,
          },
        }}
      />
    </div>
  )
}

export default OrdersList
