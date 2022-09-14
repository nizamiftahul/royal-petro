export * from './auth'

import { jsonPlugin } from './json'

export { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
export const settings = {
  localIP: [] as string[],
  mode: 'dev' as 'dev' | 'prod',
  sidkey: '' as string,
}
// process.env.TZ = 'Asia/Jakarta'
