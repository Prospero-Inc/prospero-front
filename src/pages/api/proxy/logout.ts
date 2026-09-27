import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { logout } from '@/services'

export default createHandler(HttpMethod.POST, logout)
