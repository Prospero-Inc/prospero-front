import { HttpMethod } from '@/enums'
import { RegisterViewProps } from '@/interfaces'
import createHandler from '@/lib/createHandler'
import { registerUser } from '@/services' // Asegúrate de que `registerUser` esté definido
import { User } from 'next-auth'

export default createHandler<RegisterViewProps, User>(
  HttpMethod.POST,
  registerUser
)
