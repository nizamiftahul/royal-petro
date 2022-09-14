import { Spinner, SpinnerSize } from '@fluentui/react'
import { Context, useContext, useEffect, useRef } from 'react'
import { IBaseListContext } from 'src/migrate/pkgs/web/ext/types/__list'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { BaseWindow } from 'types/window'
import { waitUntil } from 'web-utils'
import { BaseFilterTopBar } from './filter/BaseFilterTopBar'
declare const window: BaseWindow
export const BaseFilterWeb = ({ ctx }: { ctx: Context<IBaseListContext> }) => {
  const _ = useRef({
    init: false,
  })

  const meta = _.current
  const render = useRender()
  useEffect(() => {
    ;(async () => {
      await waitUntil(
        () =>
          state.filter.columns && !state.db.loading && !state.db.partialLoading
      )
      meta.init = true
      state.filter.render = render
      render()
    })()
  }, [])

  const state = useContext(ctx)
  if (!meta.init)
    return (
      <div className="flex items-center">
        <div
          className="flex items-center text-xs text-gray-400 space-x-2"
          css={css`
            height: 30px;
          `}
        >
          <Spinner size={SpinnerSize.small} />
          <span>Loading</span>
        </div>
      </div>
    )
  return <BaseFilterTopBar ctx={ctx} />
}
