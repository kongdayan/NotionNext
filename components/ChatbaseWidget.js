import Script from 'next/script'
import { useEffect, useState } from 'react'

export default function Chatbase({ chatbotId }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!window.chatbase || window.chatbase('getState') !== 'initialized') {
      const queue = (...args) => {
        queue.q.push(args)
      }
      queue.q = []
      window.chatbase = new Proxy(queue, {
        get: (target, property) =>
          property === 'q' ? target.q : (...args) => target(property, ...args)
      })
    }
    setReady(true)
  }, [])
  if (!ready) return null
  return (
    <Script
      id={chatbotId}
      src='https://www.chatbase.co/embed.min.js'
      strategy='lazyOnload'
      domain='www.chatbase.co'
    />
  )
}
