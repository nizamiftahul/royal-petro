import { css } from '@emotion/react'
import { useContext } from 'react'
import { IBaseFieldProps } from 'src/migrate/pkgs/web/ext/types/__form'
import NiceValue from 'src/migrate/pkgs/web/crud/src/legacy/NiceValue'
export const WInfo = ({ ctx, name }: IBaseFieldProps) => {
  const form = useContext(ctx)
  const field = form.config.fields[name]
  if (!field) return null
  const state = field.state

  let children =
    typeof state.value === 'object' ? (
      <NiceValue value={state.value} />
    ) : (
      state.value
    )

  if (typeof field.state.label === 'function') {
    children = field.state.label(form.db.data)
  }

  return <WBox disabled>{children}</WBox>
}
export const WBox = ({
  children,
  className,
  disabled,
}: {
  children: any
  className?: string
  disabled?: boolean
}) => {
  return (
    <div
      css={css`
        border: 1px solid #ccc;
      `}
      className="flex items-center  px-2 bg-gray-100 rounded-sm "
    >
      {children}
    </div>
  )
}
