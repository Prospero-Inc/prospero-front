import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { forgotPassword } from '@/services' // Asegúrate de que `registerUser` esté definido

export default createHandler<{ email: string }, unknown>(
  HttpMethod.PATCH,
  forgotPassword
)
