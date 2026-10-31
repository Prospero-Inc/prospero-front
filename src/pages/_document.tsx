import { theme } from '@/themes'
import { ColorModeScript } from '@chakra-ui/react'
import { type DocumentProps, Head, Html, Main, NextScript } from 'next/document'

const SPLASH_CSS = `
/* Splash de arranque: HTML estático fuera de #__next, visible desde el
   primer paint hasta que React hidrata (_app.tsx lo desvanece y lo quita).
   Mismo morado que manifest.background_color, así el splash nativo de
   Android y este se ven como una sola pantalla. */
#app-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: #5352ed;
  color: #fff;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  transition: opacity 300ms ease, visibility 300ms ease;
  /* Red de seguridad: si la app no llega a hidratar, no tapar la página. */
  animation: app-splash-timeout 0s linear 10s forwards;
}
#app-splash.is-hidden { opacity: 0; visibility: hidden; }
#app-splash img { width: 96px; height: 96px; border-radius: 22px; animation: app-splash-pulse 1.4s ease-in-out infinite; }
#app-splash .app-splash-name { font-size: 22px; font-weight: 700; letter-spacing: 0.02em; }
#app-splash .app-splash-bar { width: 120px; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.25); overflow: hidden; }
#app-splash .app-splash-bar::after { content: ''; display: block; width: 40%; height: 100%; border-radius: 2px; background: #fff; animation: app-splash-slide 1.1s ease-in-out infinite; }
@keyframes app-splash-pulse { 50% { transform: scale(0.94); } }
@keyframes app-splash-slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
@keyframes app-splash-timeout { to { opacity: 0; visibility: hidden; } }
@media (prefers-reduced-motion: reduce) {
  #app-splash img, #app-splash .app-splash-bar::after { animation: none; }
  #app-splash { transition: none; }
}
`

export default function Document({ locale }: DocumentProps) {
  return (
    // Screen readers and the browser's translation offer rely on this.
    <Html lang={locale ?? 'es'}>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#5352ED" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Prospero" />
        <style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />
      </Head>
      <body>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <div id="app-splash" aria-hidden="true">
          <img src="/icons/icon-192.png" alt="" width={96} height={96} />
          <span className="app-splash-name">Prospero</span>
          <div className="app-splash-bar" />
        </div>
        <noscript>
          <style>{'#app-splash{display:none}'}</style>
        </noscript>
        <Main />

        <NextScript />
      </body>
    </Html>
  )
}
