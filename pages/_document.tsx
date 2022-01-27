import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const initialProps = await Document.getInitialProps(ctx)
        return { ...initialProps }
    }

    render() {
        return (
            <Html>
                <Head >
                    <link href="/fonts/webfonts/fa-brands-400.eot" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-brands-400.svg" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-brands-400.ttf" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-brands-400.woff" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-brands-400.woff2" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-regular-400.eot" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-regular-400.svg" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-regular-400.ttf" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-regular-400.woff" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-regular-400.woff2" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-solid-900.eot" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-solid-900.svg" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-solid-900.ttf" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-solid-900.woff" rel="stylesheet" />
                    <link href="/fonts/webfonts/fa-solid-900.woff2" rel="stylesheet" />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument