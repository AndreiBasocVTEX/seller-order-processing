/* eslint-disable no-console */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { FC } from 'react'
import axios from 'axios'
import {
  Button,
  Table,
  Tag,
  ActionMenu,
  Tooltip,
  Pagination,
  Toggle,
  Totalizer,
  InputSearch,
} from 'vtex.styleguide'
import { FormattedCurrency } from 'vtex.format-currency'

import fancourier from '../logos/fancourier.png'
import cargus from '../logos/cargus.png'
import innoship from '../logos/innoship.png'
// import ArrowUp from "@vtex/styleguide/lib/icon/ArrowUp"
// import ArrowDown from "@vtex/styleguide/lib/icon/ArrowDown
import '../src/style.css'
import type { IOrder } from '../typings/order'

const OrdersList: FC = () => {
  const [ordersList, setOrdersList] = useState<IOrder[]>([])
  /*
  const [paginationParams, setPaginationParams] = useState({
    currentItemFrom: 1,
    currentItemTo: 0,
    itemsLength: 0,
    paging: {
        total: 0,
        currentPage: 1,
        perPage: 15,
        pages: 1,
    }
  })
*/
  const courierOptions = [
    // useMemo
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={cargus}
          />{' '}
          Cargus
        </>
      ),
      onClick: () =>
        alert('sure, everybody knows that the bird is the word...'),
    },
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={innoship}
          />{' '}
          Innoship
        </>
      ),
      onClick: () =>
        alert('sure, everybody knows that the bird is the word...'),
    },
    {
      label: (
        <>
          <img
            alt="logo"
            style={{ width: '20px', paddingRight: '6px' }}
            src={fancourier}
          />{' '}
          Fan Courier
        </>
      ),
      onClick: () => alert('I’m sorry, Dave. I’m afraid I can’t do that.'),
    },
    {
      label: 'Download PDF',
      isDangerous: 'true',
      onClick: () => alert('The cake is a lie'),
    },
  ]

  const downloadOptions = [
    {
      label: 'Descarca AWB',
      onClick: () => alert('AWB Downloading'),
    },
    {
      label: 'Descarca Factura',
      onClick: () => alert('Invoice Downloading'),
    },
  ]

  const getOrdersList = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/oms/pvt/orders?f_creationdate`, {
        headers: { Accept: 'application/json' },
        params: {
          per_page: 200,
        },
      })

      data.list.forEach((el: IOrder): void => {
        el.totalValue /= 100
        // placeholders:
        el.orderId = `GCB-${(
          Math.floor(Math.random() * 9000000000000) + 1000000000000
        ).toString()}-01`
        el.awbShipping = 'CHR32534syfavc324'
        el.invoice = 'CHR32534syfavc324' // placeholders
        el.orderIdElefant = (
          Math.floor(Math.random() * 90000000) + 10000000
        ).toString()
        el.awbStatus = 'livrat'
      })
      setOrdersList(data.list)
      console.log(data.list)
    } catch (e) {
      console.log(e)
    }
  }, [])

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

    if (cellData === 'livrat') {
      return <Tag type="success">Shipped</Tag>
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
        orderIdElefant: {
          title: 'Elefant #',
          width: 90,
        },
        orderId: {
          title: 'VTEX #',
          width: 170,
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
            return <FormattedCurrency key={cellData} value={cellData} />
          },
        },
        paymentNames: {
          // Payment method ?
          title: 'Pay Method',
          width: 100,
        },
        awbShipping: {
          title: 'AWB Shipping',
          width: 200,
          cellRenderer: ({ cellData }: SchemeDataType) => {
            console.log(cellData)

            return (
              <ActionMenu
                label="Generate"
                buttonProps={{
                  variation: 'primary',
                  size: 'small',
                }}
                options={courierOptions}
              />
            )
          },
        },
        awbStatus: {
          title: 'AWB Status',
          width: 100,
          cellRenderer: ({ cellData }: { cellData: string }): JSX.Element => {
            return displayStatus(cellData)
          },
        },
        invoice: {
          title: 'Invoice',
          width: 150,
          cellRenderer: ({ cellData }: SchemeDataType) => {
            return (
              <Button
                style={{ width: '100%', justifyContent: 'end' }}
                variation="primary"
                className="self-end pl7"
                size="small"
                onClick={{ cellData }}
              >
                Generate
              </Button>
            )
          },
        },
      },
    }),
    []
  )

  useEffect(() => {
    getOrdersList()
  }, [getOrdersList])

  return (
    <div className="f6 lh-copy">
      <div className="mb5">
        <div style={{ width: '50%' }}>
          <InputSearch
            placeholder="Cautati numarul comenzii, destinatarul, plata"
            value=""
            size="regular"
            onChange={() => console.log('asd')}
          />
        </div>
      </div>
      <Totalizer
        horizontalLayout
        items={[
          {
            label: 'Orders',
            value: '566',
            inverted: true,
          },
          {
            label: 'Average Ticket',
            value: 'US$ 55.47',
            inverted: true,
          },
          {
            label: 'Gross',
            value: 'US$ 554.70',
            inverted: true,
          },
        ]}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          // alignItems: "center",
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            // alignItems: "flex-start",
            justifyContent: 'space-between',
          }}
        >
          <div
            className="dib pt5"
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '300px',
            }}
          >
            <Toggle
            // label={state.checked ? "Activated" : "Deactivated"}
            // checked={state.checked}
            // onChange={e => setState(prevState => ({ checked: !prevState.checked }))}
            />
            <span>&nbsp;&nbsp;Dezactivati actualizarea automata AWB</span>
          </div>
          <div className="pt5">
            <ActionMenu
              className="pt5"
              label="Descarca"
              buttonProps={{
                variation: 'secondary',
                size: 'small',
              }}
              options={downloadOptions}
            />
          </div>
          <div className="pagination" style={{ width: '300px' }}>
            <Pagination
              rowsOptions={[5, 10, 15, 20]}
              currentItemFrom={1}
              currentItemTo={10}
              textOf="of"
              textShowRows="Pe pagina"
              totalItems={20}
              // onNextClick: handleNextClick,
              // onPrevClick: handlePrevClick,
              // textShowRows: (formatMessage({id: messages.showRows.id})),
              // textOf: (formatMessage({id: messages.of.id})),
              // currentItemFrom: this.state.currentItemFrom,
              // currentItemTo: this.state.currentItemTo,
              // totalItems: paging.total,
            />
          </div>
        </div>
      </div>
      <Table
        density="medium"
        fullWidth
        items={ordersList}
        schema={tableOrdersSchema}
        // totalizers={[
        //   {
        //     label: 'Account balance',
        //     value: 23837,
        //   },
        //   {
        //     label: 'Tickets',
        //     value: '$ 36239,05',
        //     iconBackgroundColor: '#eafce3',
        //     icon: <ArrowUp color="#79B03A" size={14} />,
        //   },
        //
        //   {
        //     label: 'Outputs',
        //     value: '-$ 13.485,26',
        //     icon: <ArrowDown size={14} />,
        //   },
        //   {
        //     label: 'Sales',
        //     value: 23837,
        //     isLoading: true,
        //   },
        // ]}
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
          totalItems: 122,
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
      />
    </div>
  )
}

export default OrdersList
