/* eslint-disable no-undef */
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isMobile, loadExternalResource } from '@/lib/utils'
import { useEffect } from 'react'

/**
 * 网页动画
 * @returns
 */
export default function Live2D() {
  const { theme, switchTheme } = useGlobal()
  const showPet = JSON.parse(siteConfig('WIDGET_PET'))
  const petLink = siteConfig('WIDGET_PET_LINK')
  const petSwitchTheme = siteConfig('WIDGET_PET_SWITCH_THEME')

  useEffect(() => {
    if (!showPet || isMobile()) return
    const initialize = () => {
      Promise.all([
        loadExternalResource(
          'https://cdn.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/live2d.min.js',
          'js'
        )
      ])
        .then(e => {
          if (typeof window?.loadlive2d !== 'undefined') {
            // https://github.com/xiazeyu/live2d-widget-models
            try {
              loadlive2d('live2d', petLink)
            } catch (error) {
              console.error('读取PET模型', error)
            }
          }
        })
        .catch(error => console.error('读取PET模型', error))
    }
    // Start the optional animation after the page has finished loading.
    let idleId
    let timeoutId
    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        if (window.requestIdleCallback) {
          idleId = window.requestIdleCallback(initialize, { timeout: 5000 })
        } else {
          initialize()
        }
      }, 3000)
    }
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })
    return () => {
      window.removeEventListener('load', schedule)
      window.clearTimeout(timeoutId)
      if (idleId !== undefined) window.cancelIdleCallback(idleId)
    }
  }, [theme, showPet, petLink])

  function handleClick() {
    if (petSwitchTheme) {
      switchTheme()
    }
  }

  if (!showPet) {
    return <></>
  }

  return (
    <canvas
      id='live2d'
      width='280'
      height='250'
      onClick={handleClick}
      className='cursor-grab'
      onMouseDown={e => e.target.classList.add('cursor-grabbing')}
      onMouseUp={e => e.target.classList.remove('cursor-grabbing')}
    />
  )
}
