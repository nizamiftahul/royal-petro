import Admin from 'src/migrate/pkgs/web/crud/src/CRUD'
import { page } from 'web-init'
import { useLocal } from 'web-utils'
import { BaseWindow } from 'types/window'
declare const window: BaseWindow
export default page({
  url: '/books',
  component: ({}) => {
    return (
      <>
        <div className="flex self-stretch flex-col items-start justify-start bg-white">
          <Admin
            content={{
              books: {
                table: 'books',
                title: 'Master Book',
                list: {
                  action: {
                    custom: [
                      () => {
                        return <div>TEST 1</div>
                      },
                      () => {
                        return <div>TEST 1</div>
                      },
                      () => {
                        return <div>TEST 1</div>
                      },
                      () => {
                        return <div>TEST 1</div>
                      },
                    ],
                  },
                  table: {
                    columns: [
                      [
                        'title',
                        {
                          title: 'Judul',
                          width: 150,
                        },
                      ],
                      [
                        'subtitle',
                        {
                          title: 'Sub Judul',
                          width: 150,
                        },
                      ],
                      [
                        'authors.name',
                        {
                          title: 'Author',
                          value: (row) => {
                            return (
                              <>
                                {row.authors.name} - {row.authors.date_of_birth}
                              </>
                            )
                          },
                        },
                      ],
                    ],
                  },
                  params: {
                    orderBy: {
                      id: 'desc',
                    },
                    include: {
                      authors: true,
                    },
                  },
                },
                form: {
                  //   tabs: ({ tabs }) => {
                  //     return [...tabs]
                  //   },
                  alter: {
                    title: {
                      title: 'Judul',
                    },
                    subtitle: {
                      title: 'Sub Judul',
                    },
                    authors: {
                      title: 'Author',
                    },
                  },
                  layout: [['title', 'subtitle', 'authors', []]],
                },
              },
            }}
          />
        </div>
      </>
    )
  },
})
