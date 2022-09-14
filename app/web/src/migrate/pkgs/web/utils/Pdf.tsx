/** @jsx jsx */
import { jsx } from '@emotion/react'
import React, { ReactElement, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { waitUntil } from 'web-utils'
import { useRender } from './src/useRender'
import { api } from '../../../pkgs/web/utils/src/api'
import Loading from '../crud/src/legacy/Loading'

(window as any).pdfStateID = 10000

export const Pdf: React.FC<{
  fileName?: string
  loading?: boolean
  header?: ReactElement
  footer?: ReactElement
  landscape?: boolean
  margin?: { top?: number; left?: number; right?: number; bottom?: number }
}> = ({ children, header, loading, footer, landscape, margin }) => {
  const _ = useRef({
    id: `pdf-${(window as any).pdfStateID++}`,
    ready: false,
    contentEl: null as null | HTMLDivElement,
    renderTimeout: 0 as any,
    pdfURL: '',
  })
  const meta = _.current
  const render = useRender()

  useEffect(() => {
    if (!document.getElementById(meta.id)) {
      const div = document.createElement('div')
      div.id = meta.id
      div.style.display = 'none'
      meta.contentEl = document.body.appendChild(div)
    } else {
      meta.contentEl = document.getElementById(meta.id) as HTMLDivElement
    }
    render()
  }, [])

  useEffect(() => {
    if (meta.renderTimeout) {
      clearTimeout(meta.renderTimeout)
    }
    meta.renderTimeout = setTimeout(async () => {
      await waitUntil(
        () => meta.contentEl?.querySelector('.pdf-content')?.innerHTML
      )
      const id = meta.id.substr(4)

      const footer = meta.contentEl?.querySelector(
        '.pdf-footer'
      ) as HTMLDivElement
      const header = meta.contentEl?.querySelector(
        '.pdf-header'
      ) as HTMLDivElement

      const processBase64 = async (el: HTMLDivElement) => {
        if (el) {
          const promises: Promise<void>[] = []
          el.querySelectorAll('img').forEach((img) => {
            promises.push(
              new Promise<void>((resolve) => {
                img.crossOrigin = 'Anonymous'
                img.onload = function () {
                  if (img.src.indexOf('data:image/png;base64') < 0) {
                    var canvas = document.createElement(
                      'CANVAS'
                    ) as HTMLCanvasElement
                    var ctx = canvas.getContext('2d')
                    canvas.height = img.naturalHeight
                    canvas.width = img.naturalWidth
                    if (ctx) {
                      ctx.drawImage(img, 0, 0)
                      img.src = canvas.toDataURL()
                      resolve()
                    }
                  }
                }
              })
            )
          })
          await Promise.all(promises)
        }
      }

      if (header) await processBase64(header)
      if (footer) await processBase64(footer)

      const html = meta.contentEl?.querySelector('.pdf-content')?.innerHTML

      await api(`/__pdf/gen/${id}`, {
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <link rel="stylesheet" href="/pdf.css">
            <title>Document</title>
        </head>
        <body>
        ${html}
            
        </body>
        </html>`,
        header: header?.innerHTML,
        footer: footer?.innerHTML,
        landscape,
        margin,
      })
      meta.pdfURL = `/__pdf/dl/${id}?` + new Date().getTime()
      render()
    }, 100)
  }, [children])

  return (
    <div className="flex flex-1 relative">
      {(!meta.pdfURL || !!loading) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loading />
        </div>
      )}
      {!loading && (
        <>
          {meta.pdfURL && (
            <div className="flex-1 w-full h-full flex">
              <embed
                src={`${meta.pdfURL}`}
                type="application/pdf"
                className="flex-1 bg-white"
              ></embed>
            </div>
          )}
          {meta.contentEl &&
            createPortal(
              <>
                <div className="pdf-header">{header}</div>
                <div className="pdf-footer">{footer}</div>
                <div className="pdf-content">{children}</div>
              </>,
              meta.contentEl
            )}
        </>
      )}
    </div>
  )
}
