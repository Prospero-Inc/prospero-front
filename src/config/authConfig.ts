import { HttpMethod } from '@/enums'
import apiService from '@/lib/apiService'
import { AuthOptions, User, PagesOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

interface UserExtended extends User {
  accessToken?: string
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
        if (!credentials) return null

        const { email, password } = credentials
        const response = await apiService.request<UserExtended>({
          endPoint: '/auth/login',
          method: HttpMethod.POST,
          data: {
            email,
            password
          }
        })

        if (response)
          return {
            id: response.id,
            name: response.name,
            email: response.email,
            image: response.image,
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
