import { Icon, Label, SearchBox } from '@fluentui/react'
import { useState } from 'react'
import { menuIcon } from 'src/migrate/app/web/src/menu.icon'
import { fuzzyMatch } from 'src/migrate/pkgs/web/crud/src/form/web/fields/PureSelect'
import { useRender } from 'src/migrate/pkgs/web/utils/src/useRender'
import { BaseWindow } from 'types/window'
import { useGlobal, useLocal } from 'web-utils'

type IMenuSingle = {
  idx: number
  title: string
  url?: string
  opened?: boolean
  active?: boolean
  hidden?: boolean
  render?: () => void
  siblings: IMenuSingle[]
  children: IMenuSingle[]
  parent: IMenuSingle
}

declare const window: BaseWindow

type IMenuMeta = {
  active: number[]
  renderTimeout: ReturnType<typeof setTimeout>
}

export const Menu = ({
  data,
  className,
  style,
}: {
  data: IMenuSingle[]
  className?: string
  style?: any
}) => {
  const local = useLocal(
    {
      hide_menu: [] as string[],
      port_name: '' as any,
    },
    async () => {
      const hide_menu_raw = await db.m_config.findFirst({
        where: { key: 'hide_menu_title' },
        select: {
          value: true,
        },
      })
      const port = await db.m_config.findFirst({
        where: { key: 'key' },
        select: {
          value: true,
        },
      })
      if (hide_menu_raw && hide_menu_raw.value) {
        local.hide_menu = hide_menu_raw.value as any
        local.port_name = port?.value?.key as any
        local.render()
      }
    }
  )

  if (!(window as any).menuView) {
    ;(window as any).menuView = {
      active: [],
      renderTimeout: 0 as any,
    }
  }
  let menus = data
  const meta = (window as any).menuView
  const _render = useRender()
  const [search, setSearch] = useState('')
  const render = (force?: boolean) => {
    if (force) {
      _render()
      return
    }
    if (meta.renderTimeout) {
      clearTimeout(meta.renderTimeout)
    }
    meta.renderTimeout = setTimeout(() => {
      _render()
    }, 1000)
  }
  console.log(local.port_name)
  if (local.port_name === 'petroport') {
    const editMenu = menus[0].children[0].children
    const resultMenu = editMenu.find((item) => {
      if (item?.url?.includes('berthing-realization')) {
        item['title'] = 'Berthing Process'
      }
      if (item?.url?.includes('finished-berthing')) {
        item['title'] = 'Berthing Realization'
      }
    })

    console.log(editMenu)
  }

  const walk = (menus: IMenuSingle[], parent?: IMenuSingle) => {
    for (let menu of menus) {
      if (menu.title && local.hide_menu.indexOf(menu.title) >= 0) {
        menu.hidden = true
      }

      menu.active = false
      menu.opened = false
      if (parent) menu.parent = parent
      if (
        !!menu.url &&
        menu.url.length > 1 &&
        location.pathname.startsWith(menu.url) &&
        location.pathname[menu.url.length] !== '-'
      ) {
        menu.active = true
        let cur = menu
        while (cur.parent) {
          cur = cur.parent
          cur.active = true
          cur.opened = true
        }
      }
      if (menu.children) {
        walk(menu.children, menu)
      }
    }
  }
  walk(menus)

  return (
    <div className="flex flex-1 flex-col self-stretch" style={style}>
      <SearchBox
        placeholder="Search Menu"
        disableAnimation={true}
        value={search}
        onChange={(_, value) => {
          setSearch(value || '')
        }}
        className="searchbox"
        css={css`
          background: none;
          border: 0px;
          .ms-SearchBox-iconContainer {
            display: none;
          }
        `}
      />

      <div
        className={`${
          className || ''
        } relative self-stretch flex flex-1 overflow-auto`}
        ref={(e) => {
          if (e && meta.scroll) {
            e.scrollTop = meta.scroll
          }
        }}
        onScroll={(e) => {
          meta.scroll = (e.target as HTMLDivElement).scrollTop
        }}
      >
        <div className="absolute inset-0 menu-container">
          <MenuTree
            menus={menus}
            meta={meta}
            level={0}
            search={search}
            render={render}
          />
        </div>
      </div>
    </div>
  )
}

export const MenuTree = ({
  menus,
  meta,
  parent,
  level,
  search,
  render,
}: {
  level: number
  menus: IMenuSingle[]
  meta: IMenuMeta
  search: string
  parent?: IMenuSingle
  render: (force?: boolean) => void
}) => {
  return (
    <div
      className={`${
        !!search ? 'flatten' : ''
      } menu-tree flex flex-col items-stretch`}
    >
      {menus.map((e, idx) => {
        e.idx = idx
        if (parent) e.parent = parent
        e.siblings = menus

        return (
          <MenuSingle
            key={idx}
            menu={e}
            render={render}
            meta={meta}
            search={search}
            level={level}
          />
        )
      })}
    </div>
  )
}

export const MobileText = (props) => {
  return <div {...props} />
}

export const MenuSingle = ({
  menu,
  meta,
  render,
  level,
  search,
}: {
  level: number
  menu: IMenuSingle
  meta: IMenuMeta
  search: string
  render: (force?: boolean) => void
}) => {
  const Text = Label
  const _render = useRender()

  menu.render = _render

  const icon = (name: string) => {
    for (let [menu, [iconName]] of Object.entries(menuIcon)) {
      if (fuzzyMatch(name, menu)) {
        // const mt = typeof marginTop === 'number' ? marginTop || 0 : 0
        return (
          <Icon
            iconName={iconName as string}
            css={css`
              margin-right: 5px;
            `}
          />
        )
      }
    }
    return null
  }

  let text = (
    <Text
      className={`
      ${
        !!menu.children ? 'has-children' : 'no-children'
      } menu-title cursor-pointer flex items-center`}
    >
      {level === 0 && icon(menu.title)}
      {menu.title}
    </Text>
  )
  if (!!search) {
    if (!fuzzyMatch(search, menu.title) || menu.children) text = <></>
  }

  if (menu.hidden) return null
  return (
    <div
      className={`menu-item flex flex-col cursor-pointer ${
        menu.active ? 'active' : ''
      } ${!menu.opened && !search ? 'collapsed' : ''}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (menu.children) {
          menu.opened = !menu.opened
          menu.active = !!menu.opened
          let cur = menu
          for (let i of cur.siblings) {
            if (i !== menu) i.opened = false
            if (menu && menu.render) menu.render()
          }
        } else if (menu.url) {
          window.navigate(menu.url)
          render(true)
        }
      }}
    >
      {text}
      <div
        className={`${menu.opened || !!search ? 'flex' : 'hidden'} flex-col`}
      >
        {menu.children && (
          <MenuTree
            menus={menu.children}
            meta={meta}
            search={search}
            parent={menu}
            render={render}
            level={level + 1}
          />
        )}
      </div>
    </div>
  )
}

export default Menu
