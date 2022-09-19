import React, { useEffect, useState } from 'react'
import * as tyron from 'tyron'
import { useStore } from 'effector-react'
import { toast } from 'react-toastify'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { $resolvedInfo } from '../../../../src/store/resolvedInfo'
import { RootState } from '../../../../src/app/reducers'
import toastTheme from '../../../../src/hooks/toastTheme'
import Ivms101 from './Ivms101'
import VC from './VC'
import { useTranslation } from 'next-i18next'
import { ZilPayBase } from '../../../ZilPay/zilpay-base'
import { setTxId, setTxStatusLoading } from '../../../../src/app/actions'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../src/store/modal'
import TransferOwnership from './TransferOwnership'
import Pause from '../../Pause'
import UpdatePublicEncryption from './UpdatePublicEncryption'
import smartContract from '../../../../src/utils/smartContract'
import Spinner from '../../../Spinner'
import CloseIcoReg from '../../../../src/assets/icons/ic_cross.svg'
import CloseIcoBlack from '../../../../src/assets/icons/ic_cross_black.svg'
import { updateDonation } from '../../../../src/store/donation'
import wallet from '../../../../src/hooks/wallet'

function Component({ type }) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { getSmartContract } = smartContract()
    const { checkPause } = wallet()
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const net = useSelector((state: RootState) => state.modal.net)
    const CloseIco = isLight ? CloseIcoBlack : CloseIcoReg

    const [txName, setTxName] = useState('')
    const [paused, setPaused] = useState(false)
    const [loading, setLoading] = useState(type === 'wallet' ? true : false)
    const [loadingIssuer, setLoadingIssuer] = useState(false)
    const [issuerName, setIssuerName] = useState('')
    const [issuerDomain, setIssuerDomain] = useState('')
    const [issuerInput, setIssuerInput] = useState('')
    const [savedIssuer, setSavedIssuer] = useState(false)

    const toggleActive = (id: string) => {
        updateDonation(null)
        resetState()
        if (id === txName) {
            setTxName('')
        } else {
            if (paused) {
                if (id === 'Unpause') {
                    setTxName(id)
                } else {
                    toast.warn('To continue, unpause your SBT xWallet.', {
                        position: 'top-right',
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                        toastId: 1,
                    })
                }
            } else {
                setTxName(id)
            }
        }
    }

    const handleSubmit = async (value: any) => {
        setLoading(true)
        const res: any = await getSmartContract(
            resolvedInfo?.addr!,
            'pending_username'
        )
        setLoading(false)
        if (resolvedInfo !== null) {
            if (res.result.pending_username === '') {
                toast.error('There is no pending username', {
                    position: 'top-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                    toastId: 12,
                })
            } else {
                try {
                    const zilpay = new ZilPayBase()
                    const txID = value

                    dispatch(setTxStatusLoading('true'))
                    updateModalTxMinimized(false)
                    updateModalTx(true)
                    let tx = await tyron.Init.default.transaction(net)

                    await zilpay
                        .call({
                            contractAddress: resolvedInfo?.addr!,
                            transition: txID,
                            params: [],
                            amount: String(0),
                        })
                        .then(async (res) => {
                            dispatch(setTxId(res.ID))
                            dispatch(setTxStatusLoading('submitted'))
                            try {
                                tx = await tx.confirm(res.ID)
                                if (tx.isConfirmed()) {
                                    dispatch(setTxStatusLoading('confirmed'))
                                    window.open(
                                        `https://v2.viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                    )
                                } else if (tx.isRejected()) {
                                    dispatch(setTxStatusLoading('failed'))
                                }
                            } catch (err) {
                                dispatch(setTxStatusLoading('rejected'))
                                updateModalTxMinimized(false)
                                updateModalTx(true)
                                toast.error(t(String(err)), {
                                    position: 'top-right',
                                    autoClose: 2000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: toastTheme(isLight),
                                })
                            }
                        })
                } catch (error) {
                    updateModalTx(false)
                    dispatch(setTxStatusLoading('idle'))
                    toast.error(t(String(error)), {
                        position: 'top-right',
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                        toastId: 12,
                    })
                }
            }
        } else {
            toast.error('some data is missing.', {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 12,
            })
        }
    }

    const handleIssuer = async () => {
        setLoadingIssuer(true)
        const input = String(issuerInput).toLowerCase()
        let username_ = ''
        let domain_ = ''
        if (input.includes('@')) {
            const [domain = '', username = ''] = input.split('@')
            username_ = username.replace('.did', '')
            domain_ = domain
        } else {
            if (input.includes('.')) {
                toast.error(t('Invalid'), {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                })
            } else {
                username_ = input
            }
        }
        setIssuerName(username_)
        setIssuerDomain(domain_)
        await tyron.SearchBarUtil.default
            .fetchAddr(net, username_, domain_)
            .then(async (addr) => {
                // setAddr only if this smart contract has version "SBTxWallet"
                const res: any = await getSmartContract(addr, 'version')
                if (res.result.version.includes('SBTxWallet')) {
                    setSavedIssuer(true)
                } else {
                    toast.error('Only SBTxWallet are allowed', {
                        position: 'top-right',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                        toastId: 1,
                    })
                }
            })
            .catch(() => {
                //@todo-i-fixed add continue/saved and do this verification then
                // add @todo-i#2 to this verification
                toast.error(t('Invalid'), {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                    toastId: 1,
                })
            })
        setLoadingIssuer(false)
    }

    const resetState = () => {
        setIssuerName('')
        setIssuerDomain('')
        setIssuerInput('')
        setSavedIssuer(false)
    }

    const fetchPause = async () => {
        setLoading(true)
        const res = await checkPause()
        setPaused(res)
        setLoading(false)
    }

    useEffect(() => {
        if (resolvedInfo !== null && type === 'wallet') {
            fetchPause()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className={styles.wrapper}>
            {txName !== '' && (
                <div
                    className={styles.closeWrapper}
                    onClick={() => toggleActive('')}
                />
            )}
            {loading ? (
                <Spinner />
            ) : (
                <div className={styles.content}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '10%',
                        }}
                    >
                        <div
                            style={{
                                textAlign: 'left',
                                marginTop: '10%',
                            }}
                        >
                            {type === 'public' ? (
                                <></>
                            ) : (
                                <h1>
                                    SBT
                                    <span
                                        style={{
                                            textTransform: 'lowercase',
                                            color: '#ffff32',
                                        }}
                                    >
                                        x
                                    </span>
                                    Wallet
                                </h1>
                            )}
                        </div>
                    </div>
                    <div className={styles.cardWrapper}>
                        {type === 'public' ? (
                            <>
                                <div className={styles.cardActiveWrapper}>
                                    <div
                                        onClick={() => toggleActive('Ivms101')}
                                        className={
                                            txName === 'Ivms101'
                                                ? styles.cardActive
                                                : styles.card
                                        }
                                    >
                                        <div>UPLOAD TRAVEL RULE</div>
                                    </div>
                                    {txName === 'Ivms101' && (
                                        <div className={styles.cardRight}>
                                            <div
                                                className={
                                                    styles.closeIcoWrapper
                                                }
                                            >
                                                <div
                                                    onClick={() =>
                                                        toggleActive('')
                                                    }
                                                    className={styles.closeIco}
                                                >
                                                    <Image
                                                        width={10}
                                                        src={CloseIco}
                                                        alt="close-ico"
                                                    />
                                                </div>
                                            </div>
                                            <Ivms101
                                                txName={txName}
                                                handleIssuer={handleIssuer}
                                                savedIssuer={savedIssuer}
                                                setSavedIssuer={setSavedIssuer}
                                                loading={loadingIssuer}
                                                issuerInput={issuerInput}
                                                setIssuerInput={setIssuerInput}
                                                issuerName={issuerName}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardActiveWrapper}>
                                    <div
                                        onClick={() =>
                                            toggleActive(
                                                'Verifiable_Credential'
                                            )
                                        }
                                        className={
                                            txName === 'Verifiable_Credential'
                                                ? styles.cardActive
                                                : styles.card
                                        }
                                    >
                                        <div>MINT SBT</div>
                                    </div>
                                    {txName === 'Verifiable_Credential' && (
                                        <div className={styles.cardRight}>
                                            <div
                                                className={
                                                    styles.closeIcoWrapper
                                                }
                                            >
                                                <div
                                                    onClick={() =>
                                                        toggleActive('')
                                                    }
                                                    className={styles.closeIco}
                                                >
                                                    <Image
                                                        width={10}
                                                        src={CloseIco}
                                                        alt="close-ico"
                                                    />
                                                </div>
                                            </div>
                                            <VC
                                                txName={txName}
                                                handleIssuer={handleIssuer}
                                                issuerName={issuerName}
                                                issuerDomain={issuerDomain}
                                                setIssuerInput={setIssuerInput}
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {paused ? (
                                    <div className={styles.cardActiveWrapper}>
                                        <div
                                            onClick={() =>
                                                toggleActive('Unpause')
                                            }
                                            className={styles.cardActive}
                                        >
                                            <div>UNPAUSE</div>
                                        </div>
                                        {txName === 'Unpause' && (
                                            <div className={styles.cardRight}>
                                                <div
                                                    className={
                                                        styles.closeIcoWrapper
                                                    }
                                                >
                                                    <div
                                                        onClick={() =>
                                                            toggleActive('')
                                                        }
                                                        className={
                                                            styles.closeIco
                                                        }
                                                    >
                                                        <Image
                                                            width={10}
                                                            src={CloseIco}
                                                            alt="close-ico"
                                                        />
                                                    </div>
                                                </div>
                                                <Pause
                                                    pause={false}
                                                    xwallet="sbt"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.cardActiveWrapper}>
                                        <div
                                            onClick={() =>
                                                toggleActive('Pause')
                                            }
                                            className={
                                                txName === 'Pause'
                                                    ? styles.cardActive
                                                    : styles.card
                                            }
                                        >
                                            <div>PAUSE</div>
                                        </div>
                                        {txName === 'Pause' && (
                                            <div className={styles.cardRight}>
                                                <div
                                                    className={
                                                        styles.closeIcoWrapper
                                                    }
                                                >
                                                    <div
                                                        onClick={() =>
                                                            toggleActive('')
                                                        }
                                                        className={
                                                            styles.closeIco
                                                        }
                                                    >
                                                        <Image
                                                            width={10}
                                                            src={CloseIco}
                                                            alt="close-ico"
                                                        />
                                                    </div>
                                                </div>
                                                <Pause
                                                    pause={true}
                                                    xwallet="sbt"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={styles.cardActiveWrapper}>
                                    <div
                                        onClick={() =>
                                            toggleActive(
                                                'UpdatePublicEncryption'
                                            )
                                        }
                                        className={
                                            txName === 'UpdatePublicEncryption'
                                                ? styles.cardActive
                                                : styles.card
                                        }
                                    >
                                        <div>UPDATE PUBLIC ENCRYPTION</div>
                                    </div>
                                    {txName === 'UpdatePublicEncryption' && (
                                        <div className={styles.cardRight}>
                                            <div
                                                className={
                                                    styles.closeIcoWrapper
                                                }
                                            >
                                                <div
                                                    onClick={() =>
                                                        toggleActive('')
                                                    }
                                                    className={styles.closeIco}
                                                >
                                                    <Image
                                                        width={10}
                                                        src={CloseIco}
                                                        alt="close-ico"
                                                    />
                                                </div>
                                            </div>
                                            <UpdatePublicEncryption />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardActiveWrapper}>
                                    <div
                                        onClick={handleSubmit}
                                        className={styles.card}
                                    >
                                        <div>CLAIM SBTxWALLET</div>
                                    </div>
                                </div>
                                <div className={styles.cardActiveWrapper}>
                                    <div
                                        onClick={() =>
                                            toggleActive('TransferOwnership')
                                        }
                                        className={
                                            txName === 'TransferOwnership'
                                                ? styles.cardActive
                                                : styles.card
                                        }
                                    >
                                        <div>TRANSFER OWNERSHIP</div>
                                    </div>
                                    {txName === 'TransferOwnership' && (
                                        <div className={styles.cardRight}>
                                            <div
                                                className={
                                                    styles.closeIcoWrapper
                                                }
                                            >
                                                <div
                                                    onClick={() =>
                                                        toggleActive('')
                                                    }
                                                    className={styles.closeIco}
                                                >
                                                    <Image
                                                        width={10}
                                                        src={CloseIco}
                                                        alt="close-ico"
                                                    />
                                                </div>
                                            </div>
                                            <TransferOwnership />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Component
