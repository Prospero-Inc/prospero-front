import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { activateAccount } from '@/services'

export default createHandler<unknown, unknown>(HttpMethod.GET, activateAccount)
