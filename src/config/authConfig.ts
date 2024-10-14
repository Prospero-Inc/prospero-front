import { HttpMethod } from '@/enums'
import { externalApiService } from '@/lib/apiService'
import { AuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

interface UserExtended extends User {
  accessToken?: string
}

interface UserResponse {
  user: User
  accessToken: string
}

export const config: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'example@example.com'
        },
        password: { label: 'Password', type: 'password' },
        lang: { label: 'Language', type: 'text' }
      },
      authorize: async (
        credentials: Record<'email' | 'password' | 'lang', string> | undefined
      ): Promise<UserExtended | null> => {
        if (!credentials) throw new Error('No credentials provided')
        const { email, password, lang } = credentials
        const response = await externalApiService.request<UserResponse>({
          endPoint: '/auth/login',
          method: HttpMethod.POST,
          data: {
            email,
            password
          },
          headers: {
            'x-lang': lang
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
    // forgot password?

    // reset password?
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
