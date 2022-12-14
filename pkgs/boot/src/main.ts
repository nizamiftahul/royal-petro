import { Command, Option } from 'commander'
import { pathExists, writeFile, readFile, readdir, remove } from 'fs-extra'
import { join, resolve } from 'path'
import { autoload } from './autoload'
import { dbsAdd, reloadDbs } from './dbs/add'
import { dbsGenerate, dbsInspect as dbsInspect, dbsRepair } from './dbs/reload'
import { dbsRemove } from './dbs/remove'
import { dirs } from './dirs'
import { basePull } from './git/base-pull'
import { basePush } from './git/base-push'
import { buildProd } from './prod'
import { runDev, runPlatform, runPnpm } from './runner'
import PrettyError from 'pretty-error'
const program = new Command()

PrettyError.start()

program
  .name('node base')
  .description('Base Framework')
  .version('1.0.0')
  .argument('[debug]', 'run with debugging')
  .addOption(new Option('-p, --port <number>', 'port number'))
  .addOption(new Option('-f, --force', 'force vite refresh cache'))
  .action(async (arg, opt) => {
    const extPath = join(dirs.app.ext, 'src', 'index.ts')
    if (await pathExists(extPath)) {
      const ext = await readFile(extPath, 'utf-8')
      if (!ext) {
        await writeFile(extPath, 'export default {}')
      }
    }

    if (await pathExists(join(dirs.app.web))) {
      if (!(await pathExists(join(dirs.app.web, 'types', 'page.ts')))) {
        await writeFile(
          join(dirs.app.web, 'types', 'page.ts'),
          'export default {}'
        )
      }

      if (!(await pathExists(join(dirs.app.web, 'types', 'layout.ts')))) {
        await writeFile(
          join(dirs.app.web, 'types', 'layout.ts'),
          'export default {}'
        )
      }
    }

    await runDev(['dev'], opt.port || 3200, !!opt.force)
    autoload('dev')

    if (arg === 'debug') {
      runPlatform('dev', opt.port || 3200, true)
    } else {
      runPlatform('dev', opt.port || 3200)
    }
  })

const dbs = program.command('dbs').description('database configuration')
dbs
  .command('add')
  .alias('i')
  .argument('<name>', 'db connection name')
  .description('add new database')
  .action((name) => {
    dbsAdd(name)
  })
dbs
  .command('inspect')
  .argument('[name]', 'db connection name', 'db')
  .description('pull + generate database schema')
  .action(async (name) => {
    await dbsInspect(name)
    await reloadDbs()
  })
dbs
  .command('gen')
  .argument('[name]', 'db connection name', 'db')
  .description('generate database schema')
  .action(async (name) => {
    await dbsGenerate(name)
    await reloadDbs()
  })
dbs
  .command('remove')
  .alias('r')
  .argument('[name]', 'db connection name', 'db')
  .description('remove database')
  .action((name) => {
    dbsRemove(name)
  })

program
  .command('prod')
  .description('run as production')

  .argument('[serve]', 'skip build process, just run the server')
  .argument('[debug]', 'debug')
  .addOption(new Option('--port <number>', 'port number'))
  .action(async (serve, debug, _, a) => {
    await autoload('prod')
    
    if (
      (await pathExists(join(dirs.app.dbs, 'db'))) &&
      (await pathExists(join(dirs.app.dbs, 'db', 'prisma', 'schema.prisma'))) &&
      !(await pathExists(join(dirs.app.dbs, 'db', 'node_modules', '.prisma')))
    ) {
      if (!(await dbsRepair('db'))) {
        return
      }
    }

    if (serve !== 'serve') {
      await buildProd()
    }
    const opt = a.parent._optionValues
    runPlatform('prod', opt.port || 3200, debug === 'debug')
  })

program
  .command('i')
  .alias('add')
  .alias('install')
  .description('install npm <package> to [dir]')
  .argument('<dir>', 'directory')
  .argument('[package]', 'npm package to install')
  .action(async (...args) => {
    let dir = args.shift()
    const opt = args.pop()

    if (dir) {
      dir = join(dirs.root, ...dir.split('/'))
      if (!(await pathExists(dir))) {
        dir = dirs.app.web
      }
    }

    runPnpm(['i', ...opt.args.slice(1)], dir)
  })

program
  .command('clean')
  .description('clean node modules')

  .argument('[db]', 'also clean db node modules')
  .action(async () => {
    console.log('Cleaning node_modules')
    const rm = async (path: string[]) => {
      if (await pathExists(join(dirs.root, ...path))) {
        for (let i of await readdir(join(dirs.root, ...path))) {
          if (i === 'dbs') continue
          const nm = join(dirs.root, ...path, i, 'node_modules')
          if (await pathExists(nm)) {
            remove(nm)
          }
        }
      }
    }

    await remove(join(dirs.root, 'node_modules'))
    rm(['app'])
    rm(['app', 'patch'])
    rm(['pkgs'])
    rm(['pkgs', 'web'])
  })

program
  .command('r')
  .alias('remove')
  .alias('delete')
  .alias('uninstall')
  .description('Remove npm <package> from [dir]')
  .argument('[dir]', 'directory')
  .argument('<package>', 'npm package to install')
  .action((...args) => {
    const dir = args.shift()
    const opt = args.pop()
    runPnpm(['remove', ...opt.args.slice(1)], dir)
  })

const pkgs = program.command('royal').description('Upstream royal repository')
pkgs
  .command('pull')
  .description('pull new pkgs from repository')
  .action((name) => {
    basePull()
  })
pkgs
  .command('push')
  .description('push current pkgs to repository')
  .argument('[dir]', 'commit message')
  .action(async (...args: any[]) => {
    const opt = args.pop()
    basePush(opt.args)
  })

program.parse()
