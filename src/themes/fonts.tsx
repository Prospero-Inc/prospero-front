import localFont from 'next/font/local'

// Montserrat (OFL, ./fonts/OFL-LICENSE.txt), the variable latin file the
// design uses (docs/diseno-mobile.html): its in-between weights (550, 650)
// render as designed instead of snapping to 600/700. Local file instead of
// next/font/google so the build never depends on reaching Google; next/font
// still self-hosts, preloads and swaps it in.
const montserrat = localFont({
  src: './fonts/montserrat-latin-variable.woff2',
  weight: '100 900',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif']
})

export const fonts = {
  heading: montserrat.style.fontFamily,
  body: montserrat.style.fontFamily
}
