interface OrderStatsPaging {
  total: number
  pages: number
  currentPage: number
  perPage: number
}

export interface StatsOrderData {
  orderId: string
}

interface StatsTotal {
  Count: number
  Max: number
  Mean: number
  Min: number
  Missing: number
  StdDev: number
  Sum: number
  SumOfSquares: number
}

export interface OrderStats {
  list: [StatsOrderData]
  paging: OrderStatsPaging
  stats: {
    stats: {
      totalValue: StatsTotal
      totalItems: StatsTotal
    }
  }
}
