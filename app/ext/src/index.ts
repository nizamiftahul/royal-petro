import pptr from 'puppeteer'
import fs from 'fs-extra'
import path from 'path'
import dotenv from 'dotenv'
import { pipeline } from 'stream'
import util from 'util'
import { differenceInDays, parseISO, format } from 'date-fns'
export default {
  Password: require('./bcrypt'),
  pptr,
  fs,
  path,
  dotenv: dotenv,
  pump: util.promisify(pipeline),
  dateFns: { differenceInDays, format, parseISO },
}
