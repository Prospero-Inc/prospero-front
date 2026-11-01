import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { resetPassword } from '@/services/userService'

// Called as /proxy/reset-password?token=<token from the emailed link>.
export default createHandler(HttpMethod.POST, resetPassword)
