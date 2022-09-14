import { initializeIcons } from '@fluentui/react'
import 'react-responsive-carousel/lib/styles/carousel.min.css'
import { registerSW } from 'virtual:pwa-register'
import { start } from 'web-init'
import baseUrl from './baseurl'
import './index.css'
initializeIcons('/fonts/')

const w = window as any
start({
  registerSW,
  baseUrl,
  dbDelay: w.mode === 'dev' ? 0 : 0, // simulasikan kelemotan saat dev
})
