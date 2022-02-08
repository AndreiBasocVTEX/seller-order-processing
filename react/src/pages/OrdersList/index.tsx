/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FC } from 'react'
/* eslint-disable no-console */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Button,
  Checkbox,
  DatePicker,
  FilterBar,
  IconDownload,
  Input,
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
import type { IOrderAwb, ITrackingObj } from '../../types/common'
import AwbStatus from '../../components/AwbStatus'

const OrdersList: FC = () => {
  const [awbUpdate, setAwbUpdate] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [statements, setStatements] = useState([])
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

  const fetchTrackingNumbers = useCallback((orders: any[]) => {
    console.log('fetchedTrackingNumbers OK!', orders)

    orders.forEach(async (el) => {
      const { data }: { data: any } = await axios.get(
        `/api/oms/pvt/orders/${el.orderId}`
      )

      const lastOrder = data.packageAttachment.packages.length - 1

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
            packageAttachment: data.packageAttachment,
          },
        ]
      })
    })
  }, [])

  const getItems = useCallback(
    async (newParams) => {
      let url = `/api/oms/pvt/orders?_stats=1&f_creationdate&page=${newParams.paging.currentPage}&per_page=${newParams.paging.perPage}` // &_=${Date.now()}

      if (searchValue !== '') {
        url += `&q=${searchValue}`
      }

      if (filterStatus !== '') {
        url += `&f_status=${filterStatus}`
      }

      console.log('GETITEMS_URL', url, 'filterStatus:', filterStatus)

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
    [fetchTrackingNumbers, searchValue, filterStatus]
  )

  type SchemeDataType = {
    rowData: IOrder
    cellData: IOrder
  }
  const displayStatus = (cellData: string) => {
    console.log(cellData)
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

  const printInvoice = async (invoiceNumber: string) => {
    const { data } = await axios.get(
      `/opa/orders/${invoiceNumber}/get-invoice`,
      {
        params: {
          paperSize: 'A4',
        },
        responseType: 'blob',
      }
    )

    const blob = new Blob([data], { type: 'application/pdf' })
    const blobURL = URL.createObjectURL(blob)

    window.open(blobURL)
  }

  const printAwb = useCallback(
    async (orderId: string): Promise<any> => {
      const printOrder = orderAwb.find((order) => order?.orderId === orderId)
      const typeOfResponse =
        printOrder?.courier === 'Innoship' ? undefined : 'blob'

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

  const displayAwbInfoButton = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (labelOrder) => labelOrder?.orderId === rowData?.orderId
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
        (labelOrder) => labelOrder?.orderId === rowData?.orderId
      )

      return order ? `${order.invoiceNumber ? order.invoiceNumber : ' '}` : ''
    },
    [orderAwb]
  )

  const getPayMethod = useCallback(
    (rowData: IOrder) => {
      const order = orderAwb.find(
        (payOrder) => payOrder?.orderId === rowData?.orderId
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
        (payOrder) => payOrder?.orderId === rowData?.orderId
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
  }

  const handleRowsChange = useCallback((e: unknown, value: number) => {
    console.log(e)
    const newParams = {
      ...paginationParams,
      paging: { ...paginationParams.paging, perPage: Number(value) },
    }

    setPaginationParams(newParams)
    getItems(newParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    getItems(paginationParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            // console.log('STATUS,CELLDATA', cellData)

            // return <span className="nowrap">{cellData}</span>
            return displayStatus(cellData)
          },
        },
        marketPlaceOrderId: {
          title: 'Elefant #',
          width: 90,
          cellRenderer: ({
            // cellData,
            rowData,
          }: {
            cellData: string
            rowData: IOrder
          }): JSX.Element => {
            return (
              <Link href={`/admin/app/order-details/${rowData.orderId}`}>
                {getElefantOrderId(rowData)}
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
          width: 350,
          cellRenderer: ({ rowData }: SchemeDataType) => {
            return (
              <>
                <RequestAwbModal
                  setTrackingNum={setTrackingNum}
                  setOrderAwb={setOrderAwb}
                  neededOrderId={rowData.orderId}
                  onAwbUpdate={setAwbUpdate}
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

            if (rowAwbInfo?.courier || (rowAwbInfo?.courier && awbUpdate)) {
              return <AwbStatus orderId={rowAwbInfo.orderId} size="small" />
            }

            return null
          },
        },
        Invoice: {
          title: 'Factura',
          width: 250,
          cellRenderer: ({ rowData }: SchemeDataType) => {
            const invoiceNumber = getInvoiceNumber(rowData)

            if (invoiceNumber !== 'No invoice') {
              return (
                <Tooltip label={invoiceNumber}>
                  <Button
                    variation="secondary"
                    block
                    disabled={rowData.status === 'canceled'}
                    onClick={() => {
                      printInvoice(rowData.orderId)
                    }}
                  >
                    <span style={{ paddingRight: '10px' }}>
                      {' '}
                      <IconDownload />
                    </span>

                    <span className="mw-100 truncate">{invoiceNumber}</span>
                  </Button>
                </Tooltip>
              )
            }

            return null
          },
        },
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      getPayMethod,
      displayAwbInfoButton,
      trackingNum,
      orderAwb,
      printAwb,
      getInvoiceNumber,
    ]
  )

  const renderSimpleFilterLabel = (statement: any) => {
    if (!statement) {
      // you should treat empty object cases only for alwaysVisibleFilters
      return 'Any'
    }

    return `${
      statement.verb === '='
        ? 'is'
        : statement.verb === '!='
        ? 'is not'
        : 'contains'
    }`
  }

  const SimpleInputObject = ({ value, onChange }: any) => {
    return (
      <Input
        value={value || ''}
        onChange={(e: any) => onChange(e.target.value)}
      />
    )
  }

  const getSimpleVerbs = () => {
    return [
      {
        label: 'is',
        value: '=',
        object: (props: any) => <SimpleInputObject {...props} />,
      },
      {
        label: 'is not',
        value: '!=',
        object: (props: any) => <SimpleInputObject {...props} />,
      },
      {
        label: 'contains',
        value: 'contains',
        object: (props: any) => <SimpleInputObject {...props} />,
      },
    ]
  }

  function DatePickerRangeObject({ value, onChange }: any) {
    return (
      <div className="flex flex-column w-100">
        <br />
        <DatePicker
          label="from"
          value={(value && value.from) || new Date()}
          onChange={(date: any) => {
            onChange({ ...(value || {}), from: date })
          }}
          locale="pt-BR"
        />
        <br />
        <DatePicker
          label="to"
          value={(value && value.to) || new Date()}
          onChange={(date: any) => {
            onChange({ ...(value || {}), to: date })
          }}
          locale="pt-BR"
        />
      </div>
    )
  }

  function StatusSelectorObject({ value, onChange }: any) {
    const initialValue = {
      'Window to cancelation': true,
      Canceling: true,
      Canceled: true,
      'Payment pending': true,
      'Payment approved': true,
      'Ready for handling': true,
      'Handling shipping': true,
      'Ready for invoice': true,
      Invoiced: true,
      Complete: true,
      ...(value || {}),
    }

    const toggleValueByKey = (key: any) => {
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

  return (
    <div className="f6 lh-copy">
      <FilterBar
        alwaysVisibleFilters={['status', 'invoicedate']}
        statements={statements}
        clearAllFiltersButtonLabel="Clear Filters"
        onChangeStatements={(st: any) => {
          console.log('onchangeStatements', st)
          setStatements(st)
        }}
        options={{
          id: {
            label: 'ID',
            renderFilterLabel: renderSimpleFilterLabel,
            verbs: getSimpleVerbs(),
          },
          invoicedate: {
            label: 'Invoiced date',
            renderFilterLabel: (st: any) => {
              if (!st || !st.object) {
                return 'All'
              }

              return `${
                st.verb === 'between'
                  ? `between ${st.object.from} and ${st.object.to}`
                  : `is ${st.object}`
              }`
            },
            verbs: [
              {
                value: 'between',
                object: (props: any) => <DatePickerRangeObject {...props} />,
              },
            ],
          },
          status: {
            label: 'Status',
            renderFilterLabel: (st: any) => {
              if (!st || !st.object) {
                // you should treat empty object cases only for alwaysVisibleFilters
                return 'All'
              }

              const keys = st.object ? Object.keys(st.object) : [] // {} !!!!
              const isAllTrue = !keys.some((key: any) => !st.object[key])
              const isAllFalse = !keys.some((key: any) => st.object[key])
              const trueKeys = keys.filter((key: any) => st.object[key])
              let trueKeysLabel = ''

              trueKeys.forEach((key: any, index: any) => {
                trueKeysLabel += `${key}${
                  index === trueKeys.length - 1 ? '' : ', '
                }`
              })
              console.log(
                'filterData',
                'keys',
                keys,
                'isAllTrue',
                isAllTrue,
                'isAllFalse',
                isAllFalse,
                'trueKeys:',
                trueKeys,
                'trueKeysLabel:',
                trueKeysLabel
              )
              setFilterStatus('canceled')

              return `${
                isAllTrue ? 'All' : isAllFalse ? 'None' : `${trueKeysLabel}`
              }`
            },
            verbs: [
              {
                label: 'includes',
                value: 'includes',
                object: (props: any) => {
                  console.log('VERBSPROPS', props)

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
              console.log('VISIBILITY_PARAMS', params)
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
    </div>
  )
}

export default OrdersList
