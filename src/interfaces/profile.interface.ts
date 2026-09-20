export type PayFrequency = 'Biweekly' | 'Monthly'

export interface Profile {
  id: number
  username: string
  isActive: boolean
  isGoogleAccount: boolean
  enable2FA: boolean
  email: string
  lastName: string
  firstName: string
  createdAt: string
  payFrequency: PayFrequency
  needsPercent: number
  wantsPercent: number
  savingsPercent: number
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  username?: string
  payFrequency?: PayFrequency
  needsPercent?: number
  wantsPercent?: number
  savingsPercent?: number
}
