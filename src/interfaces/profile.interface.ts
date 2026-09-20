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
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  username?: string
}
