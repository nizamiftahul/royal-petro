import Admin from 'src/migrate/pkgs/web/crud/src/CRUD'
import { page } from 'web-init'
import { useLocal } from 'web-utils'
import { BaseWindow } from 'types/window'
declare const window: BaseWindow
export default page({
  url: '/author',
  component: ({}) => {
    return (
      <>
        <div className="flex self-stretch flex-col items-start justify-start bg-white">
          Author
          {/* <Admin
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
                  //   alter: {
                  //     title: {
                  //       title: 'Judul',
                  //     },
                  //     subtitle: {
                  //       title: 'Sub Judul',
                  //     },
                  //     authors: {
                  //       title: 'Author',
                  //     },
                  //   },
                  layout: [['name', 'date_of_birth']],
                },
              },
            }}
          /> */}
        </div>
      </>
    )
  },
})
