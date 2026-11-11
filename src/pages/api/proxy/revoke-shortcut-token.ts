import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { revokeShortcutToken } from '@/services/shortcuts'

export default createHandler(HttpMethod.POST, revokeShortcutToken)
