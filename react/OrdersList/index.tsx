/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { FC } from 'react'
import axios from 'axios'
import {
  Button,
  Table,
  Tag,
  Link,
  // ActionMenu,
  Tooltip,
  Pagination,
  // Toggle,
  Totalizer,
  // InputSearch,
  // FilterBar,
} from 'vtex.styleguide'
import { FormattedCurrency } from 'vtex.format-currency'

import RequestAwbModal from '../requestAwbModal'
// import fancourier from '../logos/fancourier.png'
// import cargus from '../logos/cargus.png'
// import innoship from '../logos/innoship.png'
// import sameday from '../logos/sameday.png'
import '../src/style.css'
import type { IOrder } from '../typings/order'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Save = require('@vtex/styleguide/lib/icon/Save').default
// eslint-disable-next-line @typescript-eslint/no-var-requires
const VisibilityOn = require('@vtex/styleguide/lib/icon/VisibilityOn').default

interface ITrackingObj {
  [orderId: string]: string
}
interface IOrderAwb {
  orderId: string
  orderValue: string
  courier: string
  payMethod?: any
  invoiceNumber?: string
}
const OrdersList: FC = () => {
  const [currentRowData, setCurrentRowData] = useState<IOrder>()

  const [searchValue, setSearchValue] = useState('')
  const [isClosed, setIsClosed] = useState(false)
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

  // console.log(trackingNum)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTrackingNumbers = useCallback((orders: any[]) => {
    console.log('fetchedTrackingNumbers OK!', orders)

    orders.forEach(async (el) => {
      const { data }: { data: any } = await axios.get(
        `/api/oms/pvt/orders/${el.orderId}`
      )

      const lastOrder = data.packageAttachment.packages.length - 1

      console.log('PPPPPPPPP', data.packageAttachment)
      // console.log('AAAAAAAAA', data.openTextField.value)

      setOrderAwb((prevState) => {
        return [
          ...prevState,
          {
            orderId: el.orderId.toString(),
            // potentially has to be first element of the array
            orderValue:
              data.packageAttachment?.packages[lastOrder]?.trackingNumber ||
              'Genereaza AWB & Factura',
            courier:
              data.packageAttachment?.packages[lastOrder]?.courier || null,
            payMethod: data.openTextField?.value,
            invoiceNumber:
              data.packageAttachment?.packages[lastOrder]?.invoiceNumber ||
              'No invoice',
          },
        ]
      })
      // }
    })
  }, [])

  const getItems = useCallback(
    async (newParams) => {
      let url = `/api/oms/pvt/orders?_stats=1&f_creationdate&page=${newParams.paging.currentPage}&per_page=${newParams.paging.perPage}` // &_=${Date.now()}

      // console.log('url_searchval', url, searchValue)

      if (searchValue !== '') {
        url += `&q=${searchValue}`
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
        // console.log('getItems', data.list)
        console.log('getItemsDATA', data)
      } catch (err) {
        console.log(err)
      }
    },
    [fetchTrackingNumbers, searchValue]
  )

  type SchemeDataType = {
    rowData: IOrder
    cellData: IOrder
  }
  const displayStatus = (cellData: string) => {
    if (cellData === 'ready-for-handling') {
      return (
        <>
          <Tooltip label="Ready for handling" position="bottom">
            <div
              style={{
                backgroundColor: '#44c767',
                borderRadius: '14px',
                display: 'inline-block',
                color: '#fff',
                fontSize: '14px',
                padding: '4px 26px',
                fontWeight: '500',
              }}
            >
              RFH
            </div>
          </Tooltip>
        </>
      )
    }

    if (cellData === 'waiting-for-sellers-confirmation') {
      return (
        <>
          <Tooltip label="Waiting for sellers confirmation" position="bottom">
            <div
              style={{
                backgroundColor: '#44c767',
                borderRadius: '14px',
                display: 'inline-block',
                color: '#fff',
                fontSize: '14px',
                padding: '4px 26px',
                fontWeight: '500',
              }}
            >
              WFSC
            </div>
          </Tooltip>
        </>
      )
    }

    if (cellData === 'payment-approved') {
      return <Tag type="success">Paid</Tag>
    }

    if (cellData === 'canceled') {
      return (
        <Tag bgColor="#FF4136" color="#fff">
          Canceled
        </Tag>
      )
    }

    if (cellData === 'invoiced') {
      return (
        <Tag bgColor="#00449E" color="#fff">
          Invoiced
        </Tag>
      )
    }

    if (cellData === 'handling') {
      return (
        <Tag bgColor="#357EDD" color="#fff">
          Handling
        </Tag>
      )
    }

    if (cellData === 'payment-pending') {
      return (
        <Tag bgColor="#98b13d" color="#fff">
          $ Pending
        </Tag>
      )
    }

    if (cellData === 'cancellation-requested') {
      return (
        <>
          <Tooltip label="Cancellation requested" position="bottom">
            <div
              style={{
                backgroundColor: '#FF725C',
                borderRadius: '14px',
                display: 'inline-block',
                color: '#fff',
                fontSize: '14px',
                padding: '4px 30px',
                fontWeight: '500',
              }}
            >
              CR
            </div>
          </Tooltip>
        </>
      )
    }

    return <span>missing tag</span>
  }

  const printAwb = useCallback(
    async (orderId: string): Promise<any> => {
      const printOrder = orderAwb.find((order) => order?.orderId === orderId)
      const typeOfResponse =
        printOrder?.courier === 'Innoship' ? undefined : 'blob'

      console.log('printAwbOrder', orderAwb)
      console.log('printAWBservice', printOrder?.courier)
      try {
        const { data } = await axios.get(
          `/_${printOrder?.courier.toLowerCase()}/printPDF`,
          {
            params: {
              awbTrackingNumber: printOrder?.orderValue.toString(),
            },
            responseType: typeOfResponse,
          }
        )

        let buffer
        let blob

        console.log(data.contents)
        if (printOrder?.courier === 'Innoship') {
          buffer = Buffer.from(data.contents, 'base64')
          blob = new Blob([buffer], { type: 'application/pdf' })
        } else {
          blob = new Blob([data], { type: 'application/pdf' })
        }

        const blobURL = URL.createObjectURL(blob)

        window.open(blobURL)
      } catch (e) {
        console.log(e)
      }
    },
    [orderAwb]
  )

  const getLabelOrder = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (labelOrder) => labelOrder?.orderId === rowData?.orderId
      )

      // console.log('INFOLABEL', order)

      return order
        ? `${order.courier ? order.courier : ' '} ${order.orderValue}`
        : null
    },
    [orderAwb]
  )

  const getInvoiceNumber = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (labelOrder) => labelOrder?.orderId === rowData?.orderId
      )

      return order ? `${order.invoiceNumber ? order.invoiceNumber : ' '}` : null
    },
    [orderAwb]
  )

  const getPayMethod = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (payOrder) => payOrder?.orderId === rowData?.orderId
      )

      return order ? order.payMethod?.match(/\b(\w+)$/g)[0] : ''
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
    console.log('PAG_NEXT', newParams)
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
    console.log('PAG_PREV', newParams)
  }

  const handleRowsChange = useCallback((e: unknown, value: number) => {
    console.log(e)
    const newParams = {
      ...paginationParams,
      paging: { ...paginationParams.paging, perPage: Number(value) },
    }

    setPaginationParams(newParams)
    getItems(newParams)
  }, [])

  useEffect(() => {
    getItems(paginationParams)
  }, [trackingNum])

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
      console.log('SEARCH_V', searchValue)
    },
    [paginationParams, searchValue]
  )

  const handleInputSearchClear = useCallback(() => {
    setSearchValue('')
    setPaginationParams({
      ...paginationParams,
      currentItemFrom: 1 * paginationParams.paging.perPage,
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
    console.log('clicked+searchVal', searchValue)
    setPaginationParams({
      ...paginationParams,
      currentItemFrom: 1 * paginationParams.paging.perPage,
      currentItemTo: 2 * paginationParams.paging.perPage,
      paging: {
        total: paginationParams.paging.total,
        currentPage: 1,
        perPage: paginationParams.paging.perPage,
        pages: paginationParams.paging.pages,
      },
    })
    getItems(paginationParams)
  }, [getItems, paginationParams, searchValue]) // getProductsList

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
          title: 'Elefant #',
          width: 90,
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
        orderId: {
          title: 'VTEX #',
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
          cellRenderer: ({
            cellData,
            rowData,
          }: {
            cellData: string
            rowData: IOrder
          }): JSX.Element => {
            return (
              <Link href={`/admin/app/order-details/${rowData.orderId}`}>
                {new Intl.DateTimeFormat('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: false,
                  timeZone: 'Europe/Bucharest',
                }).format(new Date(cellData))}
              </Link>
            )
          },
        },
        ShippingEstimatedDateMax: {
          title: 'Shipping ETA',
          width: 120,
          cellRenderer: ({
            cellData,
            rowData,
          }: {
            cellData: string
            rowData: IOrder
          }): JSX.Element => {
            return (
              <Link href={`/admin/app/order-details/${rowData.orderId}`}>
                {' '}
                {new Intl.DateTimeFormat('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'Europe/Bucharest',
                }).format(new Date(cellData))}
              </Link>
            )
          },
        },
        clientName: {
          title: 'Receiver',
          width: 150,
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
          cellRenderer: ({ rowData }: { rowData: IOrder }): JSX.Element => {
            return (
              <Link href={`/admin/app/order-details/${rowData.orderId}`}>
                {getPayMethod(rowData)}
              </Link>
            )
          },
        },
        awbShipping: {
          title: 'AWB Shipping',
          width: 350,
          cellRenderer: ({ rowData }: SchemeDataType) => {
            return (
              <>
                <Button
                  variation="secondary"
                  block
                  disabled={rowData.status === 'canceled'}
                  onClick={() => {
                    setCurrentRowData(rowData)
                    setIsClosed(!isClosed)
                  }}
                >
                  {getLabelOrder(rowData)}
                </Button>
              </>
            )
          },
        },
        awbStatus: {
          title: 'AWB Status',
          width: 250,
          cellRenderer: ({ rowData }: SchemeDataType) => {
            return (
              <>
                <Button
                  variation="secondary"
                  block
                  disabled={rowData.status === 'canceled'}
                  onClick={() => {
                    // console.log('333333', rowData.status)
                    printAwb(rowData.orderId)
                  }}
                >
                  <span style={{ paddingRight: '10px' }}>
                    {' '}
                    <VisibilityOn />
                  </span>
                  {'Update Status'}
                </Button>
              </>
            )
          },
        },
        Invoice: {
          title: 'Factura',
          width: 250,
          cellRenderer: ({ rowData }: SchemeDataType) => {
            return (
              <>
                <Button
                  variation="secondary"
                  block
                  disabled={rowData.status === 'canceled'}
                  onClick={() => {
                    printAwb(rowData.orderId)
                  }}
                >
                  <span style={{ paddingRight: '10px' }}>
                    {' '}
                    <Save />
                  </span>
                  {getInvoiceNumber(rowData)}
                </Button>
              </>
            )
          },
        },
      },
    }),
    [
      getPayMethod,
      getLabelOrder,
      trackingNum,
      isClosed,
      orderAwb,
      printAwb,
      getInvoiceNumber,
    ]
  )

  return (
    <div className="f6 lh-copy">
      {/* <div className="mb5">
        <div style={{ width: '50%' }}>
          <InputSearch
            placeholder="Cautati numarul comenzii, destinatarul, plata"
            value={searchValue}
            size="regular"
            onChange={handleInputSearchChange}
            onClear={handleInputSearchClear}
            onSubmit={handleInputSearchSubmit}
          />
        </div>
      </div> */}
      {/* <FilterBar
        alwaysVisibleFilters={['status']}
        statements={statements}
        onChangeStatements={(st: any) => {
          setStatements({ st })
        }}
        options={{
          orderStatus: {
            label: 'asd',
          },
          verbs: [
            {
              label: '111',
            },
          ],
        }}
      /> */}
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
              Math.round(
                (paginationParams.stats.stats.totalValue.Sum /
                  100 /
                  paginationParams.stats.stats.totalValue.Count) *
                  100
              ) / 100
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
        bulkActions={{
          texts: {
            secondaryActionsLabel: 'Actions',
            rowsSelected: (qty: React.ReactNode) => (
              <React.Fragment>Selected rows: {qty}</React.Fragment>
            ),
            selectAll: 'Select all',
            allRowsSelected: (qty: React.ReactNode) => (
              <React.Fragment>All rows selected: {qty}</React.Fragment>
            ),
          },
          totalItems: paginationParams.paging.total,
          onChange: (params: unknown) => console.log(params),
          others: [
            {
              label: 'GENEREAZA AWB',
              handleCallback: (params: unknown) => console.log(params),
            },
            {
              label: 'GENEREAZA AWB',
              handleCallback: (params: unknown) => console.log(params),
            },
          ],
        }}
        toolbar={{
          fields: {
            label: 'Toggle visible fields',
            showAllLabel: 'Show All',
            hideAllLabel: 'Hide All',
            onToggleColumn: (params: any) => {
              console.log(params.toggledField)
              console.log(params.activeFields)
            },
            onHideAllColumns: (activeFields: any) => console.log(activeFields),
            onShowAllColumns: (activeFields: any) => console.log(activeFields),
          },
          density: {
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
      <RequestAwbModal
        rowData={currentRowData}
        isClosed={isClosed}
        setIsClosed={setIsClosed}
        // service={service}
        setTrackingNum={setTrackingNum}
        setOrderAwb={setOrderAwb}
      />
    </div>
  )
}

export default OrdersList
