import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useStore } from 'effector-react'
import Image from 'next/image'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { RootState } from '../../src/app/reducers'
import {
    updateModalDashboard,
    updateModalNewSsi,
    updateShowZilpay,
    $showZilpay,
    // $dashboardState,
} from '../../src/store/modal'
import { DashboardLabel, ZilPay } from '..'
import { toast } from 'react-toastify'
import { useTranslation } from 'next-i18next'
import sunIco from '../../src/assets/icons/sun.svg'
import moonIco from '../../src/assets/icons/moon.svg'
import { UpdateIsLight } from '../../src/app/actions'

function Component() {
    const dispatch = useDispatch()
    const net = useSelector((state: RootState) => state.modal.net)
    const loginInfo = useSelector((state: RootState) => state.modal)
    const styles = loginInfo.isLight ? stylesLight : stylesDark
    const showZilpay = useStore($showZilpay)
    const { t } = useTranslation()

    const onConnect = () => {
        if (loginInfo.zilAddr) {
            updateModalDashboard(true)
            updateModalNewSsi(false)
        } else {
            updateShowZilpay(true)
        }
        toast.info(t('Browsing on {{net}}', { net: net }), {
            position: 'bottom-right',
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            toastId: 4,
        })
    }

    useEffect(() => {
        if (loginInfo.zilAddr !== null) {
            updateShowZilpay(false)
        }
    }, [loginInfo.zilAddr])

    return (
        <div className={styles.wrapper}>
            {loginInfo.isLight ? (
                <div
                    onClick={() => dispatch(UpdateIsLight(false))}
                    className={styles.toggleDark}
                >
                    <Image width={30} src={moonIco} alt="toggle-ico" />
                </div>
            ) : (
                <div
                    onClick={() => dispatch(UpdateIsLight(true))}
                    className={styles.toggleLight}
                >
                    <Image width={30} src={sunIco} alt="toggle-ico" />
                </div>
            )}
            <div>
                {loginInfo.address && loginInfo.zilAddr ? (
                    <>
                        <div className={styles.wrapperIcon} onClick={onConnect}>
                            <div className={styles.txtLoggedIn}>
                                {t('LOGGED_IN')}
                            </div>
                        </div>
                        {net === 'testnet' && <DashboardLabel />}
                    </>
                ) : loginInfo.zilAddr ? (
                    <div className={styles.wrapperIcon} onClick={onConnect}>
                        <div className={styles.tooltip}>
                            <div className={styles.txtConnected}>
                                {t('Log in')}
                            </div>
                            <span className={styles.tooltiptext}>
                                <div
                                    style={{
                                        fontSize: '8px',
                                    }}
                                >
                                    {/* @todo-i pop up box not fitting properly on browser mobile
                                    */}
                                    {t('Log in for full functionality.')}
                                </div>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.wrapperIcon} onClick={onConnect}>
                        <div className={styles.txtConnect}>{t('CONNECT')}</div>
                    </div>
                )}
            </div>
            {showZilpay && <ZilPay />}
        </div>
    )
}

export default Component
