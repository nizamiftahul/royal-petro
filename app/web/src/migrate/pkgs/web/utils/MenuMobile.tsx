import { Icon } from '@fluentui/react'
import { FC, Fragment } from 'react'
import { menuIcon } from 'src/migrate/app/web/src/menu.icon'
import { fuzzyMatch, useLocal } from 'web-utils'

export const MenuMobile: FC<{ auth: any; meta: any }> = ({ auth, meta }) => {
  const menus =
    auth.user.p_role && meta[auth.user.p_role.name]
      ? meta[auth.user.p_role.name]
      : meta['viewer']

  const m = useLocal({
    show: null as any,
  })

  let icon = ''
  if (m.show) {
    for (let [menu, [iconName]] of Object.entries(menuIcon)) {
      if (fuzzyMatch(m.show.title, menu)) {
        icon = iconName
      }
    }
  }

  const walk = (e: any) => {
    if (e.url === location.pathname) return true
    if (e.children) {
      for (let i of e.children) {
        if (walk(i)) {
          return true
        }
      }
    }
    return false
  }

  return (
    <>
      <div
        className="flex flex-col absolute transition-all"
        css={css`
          bottom: 60px;
          left: 0px;
          right: 0px;

          box-shadow: 0px -4px 3px rgba(50, 50, 50, 0.25);
          background: white;
          border-top: 1px solid #ececeb;

          ${m.show && m.show.children
            ? css`
                opacity: 1;
                height: 50%;
                min-height: 300px;
              `
            : css`
                opacity: 0;
                height: 0;
              `}
        `}
      >
        {m.show && m.show.children && (
          <>
            <div
              className="text-md flex flex-row"
              css={css`
                background: #fafafa;
                padding: 10px 0px;
                border-bottom: 1px solid #ccc;
              `}
            >
              <Icon
                iconName={icon as string}
                css={css`
                  margin: 2px 10px -2px 8px;
                  font-size: 18px;
                `}
              />
              <div>{m.show.title}</div>
            </div>

            <div className="flex-1  overflow-auto">
              <TreeView
                level={0}
                menu={m.show}
                onClick={() => {
                  m.show = null
                  m.render()
                }}
              />
            </div>
          </>
        )}
      </div>
      <div
        className="flex flex-row items-stretch self-stretch lg:hidden relative overflow-auto"
        css={css`
          height: 65px;
          margin-bottom: -5px;
          border-top: 1px solid #ccc;
        `}
      >
        <div className="absolute flex flex-row items-stretch justify-center self-stretch flex-1 h-full min-w-full">
          {menus.map((e, idx) => {
            for (let [menu, [iconName]] of Object.entries(menuIcon)) {
              if (fuzzyMatch(e.title, menu)) {
                const isShow = m.show === e
                const isActive = walk(e)

                return (
                  <div
                    key={e.title}
                    className="flex items-center justify-center"
                    css={css`
                      ${isShow &&
                      css`
                        background: #e9fde9;
                      `}

                      ${isActive &&
                      css`
                        color: green;
                        border-top: 4px solid green;
                      `}
                    `}
                    onClick={() => {
                      if (e.children) {
                        if (m.show === e) {
                          m.show = null
                        } else {
                          m.show = e
                        }
                      } else {
                        m.show = e
                        navigate(e.url)
                      }
                      m.render()
                    }}
                  >
                    <Icon
                      key={idx}
                      iconName={iconName as string}
                      css={css`
                        padding: 0px 22px;
                        font-size: 30px;
                      `}
                    />
                  </div>
                )
              }
            }
          })}

          <div className="items-center flex">
            <button
              css={css`
                border: 0px;
                min-height: auto;
                padding: 7px 20px;
                margin-right: 10px;
                color: white;
                font-size: 16px;
                border-radius: 3px;
                > span {
                  font-weight: medium;
                }
              `}
              className={`m-btn cursor-pointer hover:opacity-50 flex flex-col items-center justify-center  bg-red-600   hover:bg-red-600`}
              onClick={async () => {
                await auth.logout()
                navigate('/')
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const TreeView: FC<{ menu: any; level: number; onClick: () => void }> = ({
  menu,
  level,
  onClick,
}) => {
  return (
    <>
      {(menu.children || []).map((e, key) => {
        let active = e.url === location.pathname
        return (
          <Fragment key={e.url + '--' + key}>
            <div
              className={`level-${level}`}
              css={css`
                padding: 13px 10px;
                padding-left: ${level * 10 + 10}px;
                border-bottom: 1px solid #ddd;

                ${active &&
                css`
                  color: green;
                  background: #e9fde9;
                `}

                ${!e.url &&
                css`
                  padding: 3px 10px;
                  color: #fff;
                  background: #aaa;
                  border-bottom: 0px;
                `}
              `}
              onClick={() => {
                if (e.url) {
                  navigate(e.url)
                  onClick()
                }
              }}
            >
              {e.title}
            </div>
            {e.children && (
              <TreeView menu={e} level={level + 1} onClick={onClick} />
            )}
          </Fragment>
        )
      })}
    </>
  )
}
