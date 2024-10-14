import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { activate2FA } from '@/services' // Asegúrate de que `registerUser` esté definido

export default createHandler(HttpMethod.GET, activate2FA)
