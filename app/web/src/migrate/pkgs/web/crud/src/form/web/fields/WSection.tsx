import { css } from '@emotion/react'
import { Label } from '@fluentui/react'
import { useContext } from 'react'
import { niceCase } from 'src/migrate/pkgs/web/utils/src/niceCase'
import { IBaseFieldProps } from 'src/migrate/pkgs/web/ext/types/__form'
export const WSection = ({ ctx, name }: IBaseFieldProps) => {
  const form = useContext(ctx)
  const field = form.config.fields[name]
  if (!field) return null
  const state = field.state
  return (
    <>
      <div
        className="flex self-stretch items-stretch select-none relative px-1 -mx-2"
        css={css`
          padding-top: 10px;
          min-height: 36px;
        `}
      >
        <div className="absolute z-0 inset-x-0 border-0 border-b mt-4 border-gray-300"></div>
        <Label className="absolute bg-white z-10 px-1 text-sm text-gray-400">
          {niceCase(name)}
        </Label>
      </div>
    </>
  )
}
