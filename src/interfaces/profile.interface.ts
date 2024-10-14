export interface Profile {
  id: number
  username: string
  isActive: boolean
  isGoogleAccount: boolean
  activationToken: string | null
  enable2FA: boolean
  twoFASecret: string | null
  email: string
  lastName: string
  firstName: string
}
