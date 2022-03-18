import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { Link, Table, Tag, Tooltip } from 'vtex.styleguide'
import { useIntl } from 'react-intl'

import type {
  TablePaginationParams,
  TableTotalizerData,
  TableFilterParams,
} from '../../types/common'
import { getOrderDataById, getOrderStats } from '../../utils/api'
import { normalizeOrderData } from '../../utils/normalizeData/orderDetails'
import type {
  OrderDetailsData,
  FormattedOrderStatus,
  ClientProfileData,
  OrderItem,
} from '../../typings/normalizedOrder'
import TableTotalizer from '../../components/OrderList/TableTotalizer'
import type { IOrder } from '../../typings/order'
import RequestAwbModal from '../../components/AwbModal'
import AwbStatus from '../../components/AwbStatus'
import InvoiceButton from '../../components/InvoiceButton'
import type { StatsOrderData } from '../../typings/orderStats'
import TablePagination from '../../components/OrderList/TablePagination'
import TableFilters from '../../components/OrderList/TableFilters'
import '../../public/style.css'
import { alwaysAvailableProviders, deliveryStatus } from '../../utils/constants'
import type { Providers } from '../../typings/Providers'
import { retrieveActiveProviders } from '../../utils/providers.util'

const OrdersList: FC = () => {
  const [totalizerData, setTotalizerData] = useState<TableTotalizerData>({
    ordersAmount: 0,
    ordersAverageValue: 0,
    ordersTotalValue: 0,
  })

  const intl = useIntl()
  const paramPage =
    Number(new URL(window.location.href).searchParams.get('page')) || 1

  const paramPerPage =
    Number(new URL(window.location.href).searchParams.get('perPage')) || 15

  const [tableLoading, setTableLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [tableItems, setTableItems] = useState<OrderDetailsData[]>([])
  const [
    paginationParams,
    setPaginationParams,
  ] = useState<TablePaginationParams>({
    page: paramPage,
    perPage: paramPerPage,
    itemsFrom: paramPerPage * paramPage - paramPerPage || 1,
    itemsTo: paramPerPage * paramPage,
  })

  const [filterParams, setFilterParams] = useState<TableFilterParams>({
    search: '',
    status: '',
    date: '',
  })

  const [awbUpdated, setAwbUpdated] = useState(false)
  const [activeProviders, setActiveProviders] = useState<Providers>(
    alwaysAvailableProviders
  )

  const getOrdersDetails = async (orderList: [StatsOrderData]) => {
    const ordersPromises: Array<Promise<IOrder>> = orderList.map((order) =>
      getOrderDataById(order.orderId)
    )

    const normalizedOrders: OrderDetailsData[] = await Promise.all(
      ordersPromises
    ).then((orders) => orders.map(normalizeOrderData))

    setTableItems(normalizedOrders)
  }

  const updateTotalizerData = (
    ordersAmount: number,
    ordersAverageValue: number,
    ordersTotalValue: number
  ) => {
    setTotalizerData({
      ordersAmount,
      ordersAverageValue,
      ordersTotalValue,
    })
  }

  useEffect(() => {
    retrieveActiveProviders().then(
      ({ activeAwbCouriers, activeInvoiceCouriers }) => {
        setActiveProviders({
          ...activeProviders,
          awbServices: [...activeAwbCouriers, ...activeProviders.awbServices],
          invoiceServices: [
            ...activeInvoiceCouriers,
            ...activeProviders.invoiceServices,
          ],
        })
      }
    )
  }, [])

  const tableOrdersSchema = {
    properties: {
      formattedOrderStatus: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.status',
        }),
        width: 100,
        cellRenderer: ({
          cellData,
        }: {
          cellData: FormattedOrderStatus
        }): JSX.Element => {
          return (
            <>
              <Tooltip label={cellData?.longText} position="bottom">
                <div>
                  <Tag bgColor={cellData?.bgColor} color={cellData?.color}>
                    {cellData?.shortText ? (
                      <span className="fw3 f7 ph4">{cellData?.shortText}</span>
                    ) : (
                      <span className="fw3 f7 helvetica">
                        {cellData?.longText}
                      </span>
                    )}
                  </Tag>
                </div>
              </Tooltip>
            </>
          )
        },
      },
      vendorOrderId: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.market-place',
        }),
        width: 110,
        cellRenderer: ({
          cellData,
          rowData,
        }: {
          cellData: string
          rowData: OrderDetailsData
        }): JSX.Element => {
          return (
            <Tooltip
              label={`${intl.formatMessage({
                id: 'seller-dashboard.table-column.order-status',
              })} ${cellData}`}
            >
              <div className="center">
                <Link
                  href={`/admin/order-details/${rowData.orderId}`}
                  target="_parent"
                >
                  {cellData}
                </Link>
              </div>
            </Tooltip>
          )
        },
      },
      orderId: {
        title: 'VTEX #',
        hidden: true,
        cellRenderer: ({
          cellData,
          rowData,
        }: {
          cellData: string
          rowData: OrderDetailsData
        }): JSX.Element => {
          return (
            <Tooltip
              label={`${intl.formatMessage({
                id: 'seller-dashboard.table-column.order-status',
              })} ${cellData}`}
            >
              <div className="center">
                <Link href={`/admin/order-details/${rowData.orderId}`}>
                  {cellData}
                </Link>
              </div>
            </Tooltip>
          )
        },
      },
      creationDate: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.creation-date',
        }),
        width: 130,
      },
      shippingEstimatedDate: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.shipping-eta',
        }),
        width: 100,
      },
      clientProfileData: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.receiver',
        }),
        cellRenderer: ({
          cellData,
          rowData,
        }: {
          cellData: ClientProfileData
          rowData: OrderDetailsData
        }): JSX.Element => {
          return (
            <span>
              {cellData.isCorporate
                ? cellData.corporateName
                : rowData.shippingData.address.receiverName}
            </span>
          )
        },
      },
      items: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.items',
        }),
        width: 50,
        cellRenderer: ({ cellData }: { cellData: OrderItem[] }) => {
          return (
            <Tooltip
              label={intl.formatMessage({
                id: 'seller-dashboard.table-column.order-items-number',
              })}
            >
              <span className="f6 lh-copy">
                <Tag
                  style={{ fontSize: '14px', lineHeight: '1.15rem' }}
                  size="small"
                >
                  {cellData.length}
                </Tag>
              </span>
            </Tooltip>
          )
        },
      },
      value: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.total-value',
        }),
        width: 80,
        cellRenderer: ({
          cellData,
        }: {
          cellData: OrderDetailsData['value']
        }) => {
          return <span>{cellData / 100} Lei</span>
        },
      },
      openTextField: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.pay-method',
        }),
        cellRenderer: ({
          cellData,
        }: {
          cellData: OrderDetailsData['openTextField']
        }) => {
          return <span>{cellData.value}</span>
        },
      },
      packageAttachment: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.awb-shipping',
        }),
        width: 200,
        cellRenderer: ({ rowData }: { rowData: OrderDetailsData }) => {
          return rowData.status === deliveryStatus.WINDOW_TO_CANCEL ? null : (
            <div
              tabIndex={0}
              role="button"
              className="w-100"
              onClick={(e) => {
                e.stopPropagation()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.stopPropagation()
              }}
            >
              <RequestAwbModal
                order={rowData}
                onAwbUpdate={setAwbUpdated}
                availableProviders={activeProviders}
              />
            </div>
          )
        },
      },
      invoiceData: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.awb-invoice',
        }),
        width: 200,
        cellRenderer: ({ rowData }: { rowData: OrderDetailsData }) => {
          return (
            <InvoiceButton
              orderId={rowData.orderId}
              invoiceKey={
                rowData.packageAttachment.packages?.invoiceKey ?? null
              }
              invoiceNumber={rowData.packageAttachment.packages?.invoiceNumber}
              invoiceUrl={rowData.packageAttachment.packages?.invoiceUrl}
              orderStatus={rowData.status}
            />
          )
        },
      },
      shippingData: {
        title: intl.formatMessage({
          id: 'seller-dashboard.table-column.awb-status',
        }),
        cellRenderer: ({ rowData }: { rowData: OrderDetailsData }) => {
          const {
            orderId,
            packageAttachment: { packages },
          } = rowData

          return (
            packages?.courier && (
              <AwbStatus
                orderId={orderId}
                initialData={packages}
                size="small"
              />
            )
          )
        },
      },
    },
  }

  const fetchOrders = async () => {
    const { page, perPage } = paginationParams
    const { search, status, date } = filterParams

    const data = await getOrderStats({ page, perPage, search, status, date })

    if (!data) {
      return
    }

    const {
      list,
      stats: {
        stats: { totalValue },
      },
    } = data

    updateTotalizerData(
      totalValue.Count,
      Math.round(totalValue.Mean) / 100,
      totalValue.Sum / 100
    )
    await getOrdersDetails(list)
  }

  const updateURL = () => {
    const url = new URL(window.location.href)

    url.searchParams.set('page', paginationParams.page.toString())
    url.searchParams.set('perPage', paginationParams.perPage.toString())

    window.history.pushState({ path: url.toString() }, '', url.toString())
  }

  useEffect(() => {
    fetchOrders().finally(() => setAwbUpdated(false))
  }, [paginationParams, filterParams, awbUpdated])

  useEffect(() => {
    if (awbUpdated) {
      setTableLoading(true)
      fetchOrders().finally(() => setAwbUpdated(false))
    }
  }, [awbUpdated])

  useEffect(() => {
    setTableLoading(true)
  }, [filterParams])

  useEffect(() => {
    const { search, status, date } = filterParams

    if (tableItems?.length === paginationParams.perPage) {
      setTableLoading(false)
    }

    if (search || status || date) {
      setTableLoading(false)
    }
  }, [tableItems])

  useEffect(() => {
    updateURL()
  }, [paginationParams])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchValue(e.target.value)

  const handleSearchInputClear = () => {
    setTableLoading(true)
    setFilterParams({ ...filterParams, search: '' })
    setSearchValue('')
    setPaginationParams({
      ...paginationParams,
      page: 1,
      perPage: 15,
      itemsFrom: 1,
      itemsTo: 15,
    })
  }

  const handleSearchInputSubmit = () => {
    setTableLoading(true)
    setFilterParams({ ...filterParams, search: searchValue })
    setPaginationParams({
      ...paginationParams,
      page: 1,
      perPage: 15,
      itemsFrom: 1,
    })
  }

  const onRowClick = ({ rowData }: { rowData: { orderId: string } }) => {
    window.parent.location.href = `/admin/order-details/${rowData.orderId}`
  }

  return (
    <div className="f6">
      <TableFilters
        filterParams={filterParams}
        setFilterParams={setFilterParams}
      />
      <TableTotalizer totalizerData={totalizerData} />
      <TablePagination
        paginationParams={paginationParams}
        totalizerData={totalizerData}
        handleTableLoading={setTableLoading}
        handlePaginationParams={setPaginationParams}
      />
      <Table
        onRowClick={onRowClick}
        fullWidth
        loading={tableLoading}
        schema={tableOrdersSchema}
        items={tableItems}
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
            placeholder: intl.formatMessage({
              id: 'seller-dashboard.filter-bar.input-placeholder',
            }),
            value: searchValue,
            onChange: handleSearchInputChange,
            onClear: handleSearchInputClear,
            onSubmit: handleSearchInputSubmit,
          },
        }}
      />
    </div>
  )
}

export default OrdersList
