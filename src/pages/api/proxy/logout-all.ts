import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { logoutAll } from '@/services'

export default createHandler(HttpMethod.POST, logoutAll)
