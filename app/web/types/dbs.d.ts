import type * as dbs from 'dbs'

declare global {
  type DBItem<T extends { findFirst: any }> = Exclude<
    Awaited<ReturnType<T['findFirst']>>,
    null
  >
  const db: typeof dbs.db & { query: (sql: string) => Promise<any> }
}
  