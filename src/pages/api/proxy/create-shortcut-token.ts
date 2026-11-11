import { HttpMethod } from '@/enums'
import createHandler from '@/lib/createHandler'
import { createShortcutToken } from '@/services/shortcuts'

export default createHandler(HttpMethod.POST, createShortcutToken)
