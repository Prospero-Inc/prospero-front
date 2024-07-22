import { HttpMethod } from '@/enums'
import apiService from '@/lib/apiService'
import { AuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

interface UserExtended extends User {
  accessToken?: string
}

interface UserResponse {
  user: User
  accessToken: string
}

interface SignInCredentials {
  email: string
  password: string
}
export const config: AuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'example@example.com'
        },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (
        credentials: SignInCredentials | undefined
      ): Promise<UserExtended | null> => {
        if (!credentials) throw new Error('No credentials provided')

        const { email, password } = credentials
        const response = await apiService.request<UserResponse>({
          endPoint: '/auth/login',
          method: HttpMethod.POST,
          data: {
            email,
            password
          }
        })
        if (response)
          return {
            ...response.user,
            accessToken: response.accessToken
          }

        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/signout'
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.accessToken = user.accessToken

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken

      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  }
}
