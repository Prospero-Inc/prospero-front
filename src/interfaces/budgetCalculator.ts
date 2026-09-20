interface IBudgetResponse {
  message: string
  distribution: Distribution
}

interface Distribution {
  necesidad: number
  deseo: number
  ahorro: number
}

export type { IBudgetResponse, Distribution }
