import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { login } from '@/services'

export default createHandler(HttpMethod.POST, login)
