import { css } from '@emotion/react'
import { shouldWrapFocus } from '@fluentui/react'
import { Context, useContext, useEffect } from 'react'
import Loading from 'src/migrate/pkgs/web/crud/src/legacy/Loading'
import { IAdminSingle } from 'src/migrate/pkgs/web/ext/types/admin'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import { BaseWindow } from 'types/window'
import { useGlobal, useLocal } from 'web-utils'
import { CRUDBodyForm } from './CRUDBodyForm'
import { CRUDBodyList } from './CRUDBodyList'
import { CRUDDrillBread } from './CRUDDrill'
import { CRUDGlobal } from './CRUDGlobal'
import {
  generateDrill,
  parseBreadParams as parseBreadParams,
} from './utils/drill'

declare const window: BaseWindow
const w = window as any

export const CRUDBody = ({
  content,
  ctx,
}: {
  content: IAdminSingle
  ctx: Context<ICRUDContext>
}) => {
  const glb = useGlobal(CRUDGlobal)
  const state = useContext(ctx)
  const meta = useLocal({
    init: false,
  })

  const { drill, DrillChild, shouldRenderDrill, drillTo } = generateDrill(
    glb,
    state
  )

  useEffect(() => {
    if (!state.crud.title) state.crud.title = content.title || ''
    if (!state.crud.mode)
      state.crud.mode = content.mode || ('list' as 'list' | 'form')

    meta.init = true
    meta.render()
  }, [])

  if (!meta.init) return <Loading />

  if (!shouldRenderDrill) {
    if (
      !state.tree.parent &&
      state.crud.content.hash === undefined &&
      location.hash.length > 1 &&
      state.crud.mode === 'list'
    ) {
      state.crud.mode = 'form'
      state.crud.formData = {
        __crudLoad: location.hash.substring(1),
      }
    }
  }

  if (drill && drill.breads) {
    for (let bread of drill.breads) {
      const rowLen = Object.keys(bread.params).length
      if (rowLen === 0 && bread.url) {
        parseBreadParams(bread, state)
      }
    }
  }

  if (state.crud.content.resetForm) {
    state.crud.content.resetForm = undefined
    meta.render()
  }

  return (
    <div
      className={
        (shouldRenderDrill ? 'list' : state.crud.mode) +
        ' admin-cms flex flex-1 absolute inset-0'
      }
      css={css`
        .admin-list,
        .admin-form,
        .admin-drill {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        &.form {
          > .admin-list {
            visibility: hidden;
          }
        }

        &.list {
          > .admin-form {
            visibility: hidden;
          }
        }
      `}
    >
      {shouldRenderDrill ? (
        <div
          className="flex flex-1 flex-col items-stretch"
          css={css`
            .form-back-btn i {
              margin-top: 2px;
              font-size: 12px !important;
            }
          `}
        >
          {drill && drill.detail && drill.detail.isRoot && (
            <CRUDDrillBread
              drill={drill}
              render={meta.render}
            />
          )}
          {DrillChild && (
            <div className="flex flex-col flex-1 items-stretch relative">
              <DrillChild parent={state} />
            </div>
          )}
        </div>
      ) : (
        <div className="admin-list flex flex-col">
          <CRUDBodyList ctx={ctx} content={content} />
        </div>
      )}
      <div className="admin-form flex flex-col items-stretch">
        {!state.crud.content.resetForm && (
          <CRUDBodyForm ctx={ctx} content={content} />
        )}
      </div>
    </div>
  )
}
