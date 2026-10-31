import localFont from 'next/font/local'

// Montserrat (OFL, ./fonts/OFL-LICENSE.txt), only the weights the UI uses.
// Local files instead of next/font/google so the build never depends on
// reaching Google; next/font still self-hosts, preloads and swaps it in.
const montserrat = localFont({
  src: [
    { path: './fonts/montserrat-latin-400-normal.woff2', weight: '400' },
    { path: './fonts/montserrat-latin-600-normal.woff2', weight: '600' },
    { path: './fonts/montserrat-latin-700-normal.woff2', weight: '700' }
  ],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif']
})

export const fonts = {
  heading: montserrat.style.fontFamily,
  body: montserrat.style.fontFamily
}
