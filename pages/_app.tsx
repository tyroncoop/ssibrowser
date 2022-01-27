import '../styles/global.css'
import '../styles/css/fontawesome-all.min.css'
import '../styles/css/main.css'
import '../styles/css/noscript.css'
import '../styles/scss/variables/_breakpoints.scss'
import '../styles/scss/variables/_colors.scss'
import '../styles/scss/_normalizer.scss'
import '../styles/scss/application.scss'

import type { AppProps } from 'next/app'

function SSIBrowser({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />
}

export default SSIBrowser