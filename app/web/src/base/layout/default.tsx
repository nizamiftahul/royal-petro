import { PartialTheme, ThemeProvider } from '@fluentui/react'
import get from 'lodash.get'
import Menu from 'src/migrate/pkgs/web/utils/Menu'
import { MenuMobile } from 'src/migrate/pkgs/web/utils/MenuMobile'
import { BaseWindow } from 'types/window'
import { layout } from 'web-init'
import { useAuth, useGlobal, useLocal } from 'web-utils'
import { globalLayout } from '../global/layout'

declare const window: BaseWindow

const appTheme: PartialTheme = {
  defaultFontStyle: {
    fontFamily: ` 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto,
    'Helvetica Neue', sans-serif`,
  },
}

export default layout({
  component: ({ children }) => {
    const meta = useGlobal(globalLayout)

    return (
      <ThemeProvider
        theme={appTheme}
        className={`h-full w-full flex-1 flex self-stretch flex-col items-start justify-start`}
      >
        <div
          className="flex-1 flex items-stretch self-stretch"
          css={css`
            > div {
              flex: 1;
            }
          `}
        >
          {children}
        </div>
      </ThemeProvider>
    )
  },
})
