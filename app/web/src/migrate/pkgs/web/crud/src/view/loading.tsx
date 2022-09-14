import { css } from '@emotion/react'
import { Label, Spinner, SpinnerSize } from '@fluentui/react'
import { ReactElement } from 'react'
export const Loading = ({
  children,
  show,
  pointerEvents,
}: {
  pointerEvents?: boolean
  children?: ReactElement
  show?: boolean
}) => {
  return (
    <div
      className="flex items-center flex-col justify-center"
      css={css`
        background: rgba(255, 255, 255, 0.6);
        transition: all 0.3s;
        ${pointerEvents !== true &&
        css`
          pointer-events: none;
        `}
        position: absolute !important;
        opacity: ${show === undefined || !!show ? 1 : 0};
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        z-index: 20;

        label {
          background: white;
          border-radius: 10px;
          padding: 20px;
          color: #005ecc;
        }
      `}
    >
      <Label className="flex flex-col items-center justify-center m-3  shadow-md">
        {children ? (
          children
        ) : (
          <>
            <Spinner size={SpinnerSize.large} className="pb-2" />
            Loading
          </>
        )}
      </Label>
    </div>
  )
}
