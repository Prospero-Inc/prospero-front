interface IBudgetResponse {
  message: string
  distribution: Distribution
}

interface Distribution {
  fixedExpenses: number
  variableExpenses: number
  savings: number
}

export type { IBudgetResponse, Distribution }
