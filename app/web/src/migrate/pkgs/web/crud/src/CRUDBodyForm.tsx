import get from 'lodash.get'
import { Context, useContext } from 'react'
import { BaseWindow } from 'types/window'
import { niceCase } from 'src/migrate/pkgs/web/utils/src/niceCase'
import { IAdminSingle } from 'src/migrate/pkgs/web/ext/types/admin'
import { ICRUDContext } from 'src/migrate/pkgs/web/ext/types/__crud'
import { BaseForm } from './form/BaseForm'
declare const window: BaseWindow
export const CRUDBodyForm = ({
  content,
  ctx,
}: {
  content: IAdminSingle
  ctx: Context<ICRUDContext>
}) => {
  let layout = get(content, 'form.layout')

  if (typeof layout === 'function') {
    layout = [layout]
  }

  const state = useContext(ctx)
  return (
    <>
      <BaseForm
        id={'form'}
        parentCtx={ctx as any}
        table={content.table}
        alter={get(content, 'form.alter')}
        onSave={get(content, 'form.onSave')}
        onLoad={get(content, 'form.onLoad')}
        onInit={get(content, 'form.onInit')}
        import={get(content, 'form.import')}
        layout={layout}
        tabs={get(content, 'form.tabs')}
        split={get(content, 'form.split', {})}
        data={state.crud.formData}
        header={{
          enable: get(content, 'form.header.enable', true),
          back: ({ row }) => {
            ;(window as any).preventPopRender = true
            state.crud.setMode('list', row)
          },
          title: niceCase(state.crud.title),
          action:
            get(content, 'form.action') ||
            get(content, 'form.header.action', undefined),
        }}
      />
    </>
  )
}
