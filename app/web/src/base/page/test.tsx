import Admin from 'src/migrate/pkgs/web/crud/src/CRUD'
import { page } from 'web-init'
import { useLocal } from 'web-utils'
import { BaseWindow } from 'types/window'
declare const window: BaseWindow
export default page({
  url: '/test',
  component: ({}) => {
    return (
      <>
        <div className="flex self-stretch flex-col items-start justify-start bg-white">
          <Admin
            content={{
              authors: {
                table: 'authors',
                title: 'Master Author',
                list: {
                  table: {
                    columns: [
                      [
                        'name',
                        {
                          title: 'Nama',
                        },
                      ],
                      [
                        'date_of_birth',
                        {
                          title: 'Tanggal Lahir',
                        },
                      ],
                    ],
                  },
                  params: {},
                },
                form: {
                  //   tabs: ({ tabs }) => {
                  //     return [...tabs]
                  //   },
                  alter: {
                    name: {
                      title: 'Nama Pengarang',
                    },
                    date_of_birth: {
                      title: 'tanggal Lahir',
                    },
                    books: {
                      title: 'Buku',
                      fieldProps: {
                        list: {
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
                            ],
                          },
                        },
                        form: {
                          alter: {
                            title: {
                              title: 'Judul',
                            },
                            subtitle: {
                              title: 'Sub Judul',
                            },
                          },
                          layout: [['title', 'subtitle', [], []]],
                        },
                      },
                    },
                  },
                  layout: [['name', 'date_of_birth'], 'books', 'flms'],
                },
              },
            }}
          />
        </div>
      </>
    )
  },
})
