import { defineEventHandler } from 'nitro/h3'
import { probeShareUpstream } from '../../utils/shareProxy'

export default defineEventHandler(async () => {
  return probeShareUpstream()
})
