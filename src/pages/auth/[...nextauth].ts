import { HttpMethod } from '@/enums'
import apiService from '@/lib/apiService'
import NextAuth, { User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

interface UserExtended extends User {
  accessToken?: string
}

interface SignInCredentials {
  email: string
  password: string
}
const providers = [
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

      const response = await apiService.request<UserExtended>({
        endPoint: '/auth/signin',
        method: HttpMethod.POST,
        data: credentials
      })

      if (response && response.accessToken) return response

      return null
    }
  })
]
const pages = {
  signIn: '/auth/login',
  signOut: '/auth/signout'
  // Puedes agregar más páginas personalizadas si es necesario
}

export default NextAuth({
  providers,
  pages,
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.accessToken = user.accessToken

      return token
    },
    async session({ session, token }) {
      if (token.accessToken) session.accessToken = token.accessToken

      return session
    }
  }
})
