import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { updateProfile } from '@/services/request-profile'

export default createHandler(HttpMethod.PATCH, updateProfile)
