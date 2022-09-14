import { dirs, log } from 'boot'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { pathExists, readdir } from 'fs-extra'
import { join } from 'path'
import * as dbs from '../../../../app/dbs/index'
import ext from '../../../../app/ext/src/index'

const dir = join(dirs.app.web, 'src', 'api')
const apis = [] as [string, (args: any) => Promise<void> | void][]

export const declareApi = async (
  server: FastifyInstance,
  mode: 'dev' | 'prod',
  baseurl: string
) => {
  initApi(server, mode, baseurl)
}

const initApi = async (
  server: FastifyInstance,
  mode: 'dev' | 'prod',
  baseurl: string
) => {
  let count = 0
  if (await pathExists(dir)) {
    for (let i of await readdir(dir)) {
      count++
      const api = require(join(dir, i)).default
      apis[i] = api
      if (api) {
        const handler = async (req: any, reply: any) => {
          await api[1]({
            req,
            reply,
            db: dbs['db'],
            mode,
            baseurl,
            server,
            dirs,
            ext: ext,
            session: req.session,
          })
        }
        server.get(api[0], handler)
        server.post(api[0], handler)
        server.options(api[0], handler)
      } else {
        console.log(apis, i)
      }
    }
  }
  setTimeout(() => {
    log('platfrom', `API route loaded: ${count}`)
  }, 500)
}
