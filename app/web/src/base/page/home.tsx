import Admin from 'src/migrate/pkgs/web/crud/src/CRUD'
import { page } from 'web-init'
import { useLocal } from 'web-utils'
import { BaseWindow } from 'types/window'
declare const window: BaseWindow
export default page({
  url: '/',
  component: ({}) => {
    // const declare_meta = () => {
    //   const meta = {}
    //   return meta
    // }
    // const init_meta = () => {
    //   return async () => {}
    // }
    // const meta = useLocal(declare_meta(), init_meta())
    return <>Home</>
  },
})
