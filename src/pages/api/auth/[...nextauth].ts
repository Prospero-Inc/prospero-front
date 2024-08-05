import { config } from '@/config'
import NextAuth from 'next-auth/next'

export default NextAuth({
  ...config
})
