import { useStore } from 'effector-react'
import React, { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import {
    SearchBar,
    NewSSIModal,
    TransactionStatus,
    GetStartedModal,
    BuyNFTModal,
    DashboardModal,
    AddFundsModal,
    WithdrawalModal,
    NewMotionsModal,
    InvestorModal,
} from '../'
import { $menuOn } from '../../src/store/menuOn'
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
import styles from './styles.module.scss'

function Header() {
    const url = window.location.pathname.toLowerCase()
    const menuOn = useStore($menuOn)
    const modalDashboard = useStore($modalDashboard)
    const modalNewSsi = useStore($modalNewSsi)
    const modalTx = useStore($modalTx)
    const modalGetStarted = useStore($modalGetStarted)
    const modalBuyNft = useStore($modalBuyNft)
    const modalAddFunds = useStore($modalAddFunds)
    const modalWithdrawal = useStore($modalWithdrawal)
    const modalNewMotions = useStore($modalNewMotions)
    const modalInvestor = useStore($modalInvestor)
    const [headerClassName, setHeaderClassName] = useState(
        url === '/' ? 'first-load' : 'header'
    )
    const [contentClassName, setContentClassName] = useState(
        url === '/' ? 'first-load' : 'content'
    )
    const [innerClassName, setInnerClassName] = useState(
        url === '/' ? 'first-load' : 'inner'
    )
    let path
    if (
        (url.includes('es') ||
            url.includes('cn') ||
            url.includes('id') ||
            url.includes('ru')) &&
        url.split('/').length === 2
    ) {
        path = url
            .replace('es', '')
            .replace('cn', '')
            .replace('id', '')
            .replace('ru', '')
    } else {
        path = url
            .replace('/es', '')
            .replace('/cn', '')
            .replace('/id', '')
            .replace('/ru', '')
    }
    const searchBarMargin = path === '/' ? '-10%' : '15%'

    useEffect(() => {
        setTimeout(() => {
            setHeaderClassName('header')
            setContentClassName('content')
            setInnerClassName('inner')
        }, 10)
    })

    return (
        <>
            <div id={headerClassName}>
                <div
                    style={{ marginTop: searchBarMargin }}
                    className={contentClassName}
                >
                    <ToastContainer
                        className={styles.containerToast}
                        closeButton={false}
                        progressStyle={{ backgroundColor: '#eeeeee' }}
                    />
                    {!menuOn &&
                        !modalTx &&
                        !modalGetStarted &&
                        !modalNewSsi &&
                        !modalBuyNft &&
                        !modalAddFunds &&
                        !modalWithdrawal &&
                        !modalNewMotions &&
                        !modalInvestor &&
                        !modalDashboard && (
                            <div className={innerClassName}>
                                <SearchBar />
                            </div>
                        )}
                </div>
            </div>
            {!menuOn && !modalTx && !modalDashboard && (
                <>
                    <NewSSIModal />
                    <GetStartedModal />
                    <BuyNFTModal />
                    <AddFundsModal />
                    <WithdrawalModal />
                    <NewMotionsModal />
                    <InvestorModal />
                </>
            )}
            {!menuOn && !modalTx && <DashboardModal />}
            {!menuOn && <TransactionStatus />}
        </>
    )
}

export default Header
