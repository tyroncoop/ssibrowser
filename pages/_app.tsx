import '../styles/global.css'
import '../styles/css/fontawesome-all.min.css'
import '../styles/css/main.css'
import '../styles/css/noscript.css'
import '../styles/scss/variables/_breakpoints.scss'
import '../styles/scss/variables/_colors.scss'
import '../styles/scss/_normalizer.scss'
import '../styles/scss/application.scss'

//import '/assets/webfonts/fa-brands-400.eot'
//import '/assets/webfonts/fa-brands-400.svg'
// import '/assets/webfonts/fa-brands-400.ttf'
// import '/assets/webfonts/fa-brands-400.woff'
// import '/assets/webfonts/fa-brands-400.woff2'
// import '/assets/webfonts/fa-regular-400.eot'
// import '/assets/webfonts/fa-regular-400.svg'
// import '/assets/webfonts/fa-regular-400.ttf'
// import '/assets/webfonts/fa-regular-400.woff'
// import '/assets/webfonts/fa-regular-400.woff2'
// import '/assets/webfonts/fa-solid-900.eot'
// import '/assets/webfonts/fa-solid-900.svg'
// import '/assets/webfonts/fa-solid-900.ttf'
// import '/assets/webfonts/fa-solid-900.woff'
// import '/assets/webfonts/fa-solid-900.woff2'

import type { AppProps } from 'next/app'

function SSIBrowser({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />
}

export default SSIBrowser