import { defineEventHandler, getRouterParam, setResponseStatus } from 'nitro/h3'
import { probeShareStatus } from '../../../utils/shareProxy'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    setResponseStatus(event, 400)
    return { code: 'INVALID_SHARE_ID', message: 'Missing share id' }
  }
  return probeShareStatus(id)
})
