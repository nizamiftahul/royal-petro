import { IBaseUrl } from 'web-init'

export default (props: IBaseUrl) => {
  const host = 'localhost'
  return `http://${host}:3200/`
}
