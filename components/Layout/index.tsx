import { ReactNode, useEffect } from 'react'
import { useStore } from 'effector-react'
import Head from 'next/head'
import { Header, Footer, Menu, Dashboard } from '..'
import { $menuOn } from '../../src/store/menuOn'
import { $loading } from '../../src/store/loading'
import {
    $modalDashboard,
    $modalNewSsi,
    $modalTx,
    $modalGetStarted,
    $modalBuyNft,
    $modalAddFunds,
    $modalWithdrawal,
    $modalNewMotions,
    $modalInvestor,
} from '../../src/store/modal'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from '../../src/app/reducers'

interface LayoutProps {
    children: ReactNode
}

function LayoutSearch(props: LayoutProps) {
    const { children } = props
    const { asPath } = useRouter()
    const Router = useRouter()
    const language = useSelector((state: RootState) => state.modal.lang)
    const menuOn = useStore($menuOn)
    const loading = useStore($loading)
    const modalDashboard = useStore($modalDashboard)
    const modalNewSsi = useStore($modalNewSsi)
    const modalTx = useStore($modalTx)
    const modalGetStarted = useStore($modalGetStarted)
    const modalBuyNft = useStore($modalBuyNft)
    const modalAddFunds = useStore($modalAddFunds)
    const modalWithdrawal = useStore($modalWithdrawal)
    const modalNewMotions = useStore($modalNewMotions)
    const modalInvestor = useStore($modalInvestor)

    useEffect(() => {
        Router.push({}, asPath, { locale: language })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language])

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <Head>
                <title>TYRON</title>
            </Head>
            <div id="bg" />
            <div id="wrapper">
                <Header />
                {loading && !modalNewSsi ? (
                    <i
                        style={{ color: '#ffff32' }}
                        className="fa fa-lg fa-spin fa-circle-notch"
                        aria-hidden="true"
                    ></i>
                ) : (
                    <>
                        {!menuOn &&
                            !modalNewSsi &&
                            !modalTx &&
                            !modalGetStarted &&
                            !modalBuyNft &&
                            !modalAddFunds &&
                            !modalDashboard &&
                            !modalWithdrawal &&
                            !modalNewMotions &&
                            !modalInvestor &&
                            children}
                    </>
                )}
                <Menu />
                <Dashboard />
                <Footer />
            </div>
        </div>
    )
}

export default LayoutSearch
