import * as tyron from 'tyron'
import { useStore } from 'effector-react'
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import {
    $resolvedInfo,
    updateResolvedInfo,
} from '../../../../../../src/store/resolvedInfo'
import { operationKeyPair } from '../../../../../../src/lib/dkms'
import { ZilPayBase } from '../../../../../ZilPay/zilpay-base'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { Donate, Spinner } from '../../../../..'
import { $donation, updateDonation } from '../../../../../../src/store/donation'
import {
    $domainAddr,
    $domainInput,
    $domainLegend,
    $domainLegend2,
    $domainTx,
    updateDomain,
    updateDomainAddr,
    updateDomainLegend,
    updateDomainLegend2,
    updateDomainTx,
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../../src/store/modal'
import { setTxStatusLoading, setTxId } from '../../../../../../src/app/actions'
import { RootState } from '../../../../../../src/app/reducers'
import { useTranslation } from 'next-i18next'
import routerHook from '../../../../../../src/hooks/router'
import ContinueArrow from '../../../../../../src/assets/icons/continue_arrow.svg'
import TickIco from '../../../../../../src/assets/icons/tick.svg'
import CloseIcoReg from '../../../../../../src/assets/icons/ic_cross.svg'
import CloseIcoBlack from '../../../../../../src/assets/icons/ic_cross_black.svg'
import smartContract from '../../../../../../src/utils/smartContract'
import { $arconnect } from '../../../../../../src/store/arconnect'
import { updateLoading } from '../../../../../../src/store/loading'
import toastTheme from '../../../../../../src/hooks/toastTheme'
import useArConnect from '../../../../../../src/hooks/useArConnect'

function Component() {
    const zcrypto = tyron.Util.default.Zcrypto()
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const { navigate } = routerHook()
    const { getSmartContract } = smartContract()
    const { connect } = useArConnect()
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const donation = useStore($donation)
    const didDomain = useStore($domainInput)
    const input = useStore($domainAddr)
    const domainLegend = useStore($domainLegend)
    const domainLegend2 = useStore($domainLegend2)
    const txName = useStore($domainTx)
    const net = useSelector((state: RootState) => state.modal.net)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const CloseIco = isLight ? CloseIcoBlack : CloseIcoReg

    const [loading, setLoading] = useState(false)

    const handleInputDomain = (event: { target: { value: any } }) => {
        updateDonation(null)
        updateDomainAddr('')
        updateDomainLegend('save')
        const input = event.target.value
        updateDomain(input)
    }

    const toggleActive = (id: string) => {
        updateDonation(null)
        updateDomainLegend2('save')
        if (id === txName) {
            updateDomainTx('')
        } else {
            updateDomainTx(id)
        }
    }

    const handleSaveDomain = async () => {
        if (
            didDomain !== '' &&
            didDomain !== 'did' &&
            !didDomain.includes('.')
        ) {
            updateDomainLegend('saved')
            // setLoading(true)
            // getSmartContract(resolvedInfo?.addr!, 'did_domain_dns').then(
            //     async (res) => {
            //         const key = Object.keys(res.result.did_domain_dns)
            //         if (key.some((val) => val === didDomain)) {
            //             toast.error(t('Domain already exist'), {
            //                 position: 'top-right',
            //                 autoClose: 2000,
            //                 hideProgressBar: false,
            //                 closeOnClick: true,
            //                 pauseOnHover: true,
            //                 draggable: true,
            //                 progress: undefined,
            //                 theme: toastTheme(isLight),
            //                 toastId: 5,
            //             })
            //             setLoading(false)
            //         } else {
            //             updateDomainLegend('saved')
            //             setLoading(false)
            //         }
            //     }
            // )
        } else {
            toast.warn(t('Invalid'), {
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
    }

    const handleSave = async () => {
        const addr = tyron.Address.default.verification(input)
        if (addr !== '') {
            updateDomainAddr(addr)
            updateDomainLegend2('saved')
        } else {
            toast.error(t('Wrong address.'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 2,
            })
        }
    }

    const handleInput = (event: { target: { value: any } }) => {
        updateDonation(null)
        updateDomainAddr('')
        updateDomainLegend2('save')
        updateDomainAddr(event.target.value)
    }

    const handleOnKeyPressAddr = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSave()
        }
    }

    const handleOnKeyPressDomain = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            handleSaveDomain()
        }
    }

    const handleDeploy = async () => {
        if (resolvedInfo !== null && net !== null) {
            const zilpay = new ZilPayBase()
            dispatch(setTxStatusLoading('true'))
            updateModalTxMinimized(false)
            updateModalTx(true)
            let tx = await tyron.Init.default.transaction(net)
            await zilpay
                .deployDomainBeta(net, username!)
                .then(async (deploy: any) => {
                    dispatch(setTxId(deploy[0].ID))
                    dispatch(setTxStatusLoading('submitted'))
                    try {
                        tx = await tx.confirm(deploy[0].ID)
                        if (tx.isConfirmed()) {
                            dispatch(setTxStatusLoading('confirmed'))
                            updateDonation(null)
                            window.open(
                                `https://viewblock.io/zilliqa/tx/${deploy[0].ID}?network=${net}`
                            )
                            let addr = deploy[0].ContractAddress
                            addr = zcrypto.toChecksumAddress(addr)
                            updateDomainAddr(addr)
                            updateDomainLegend2('saved')
                        } else if (tx.isRejected()) {
                            dispatch(setTxStatusLoading('failed'))
                            setTimeout(() => {
                                toast.error(t('Transaction failed.'), {
                                    position: 'top-right',
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: toastTheme(isLight),
                                })
                            }, 1000)
                        }
                    } catch (err) {
                        updateModalTx(false)
                        toast.error(String(err), {
                            position: 'top-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                        })
                    }
                })
                .catch((error) => {
                    dispatch(setTxStatusLoading('rejected'))
                    updateModalTxMinimized(false)
                    updateModalTx(true)
                    toast.error(String(error), {
                        position: 'top-right',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                    })
                })
        } else {
            toast.error('Some data is missing.', {
                position: 'top-right',
                autoClose: 6000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
            })
        }
    }

    const handleDeployVC = async () => {
        if (resolvedInfo !== null && net !== null) {
            const zilpay = new ZilPayBase()
            dispatch(setTxStatusLoading('true'))
            updateModalTxMinimized(false)
            updateModalTx(true)
            let tx = await tyron.Init.default.transaction(net)
            await zilpay
                .deployDomainBetaVC(net, username!, didDomain)
                .then(async (deploy: any) => {
                    dispatch(setTxId(deploy[0].ID))
                    dispatch(setTxStatusLoading('submitted'))
                    try {
                        tx = await tx.confirm(deploy[0].ID)
                        if (tx.isConfirmed()) {
                            dispatch(setTxStatusLoading('confirmed'))
                            updateDonation(null)
                            window.open(
                                `https://viewblock.io/zilliqa/tx/${deploy[0].ID}?network=${net}`
                            )
                            let addr = deploy[0].ContractAddress
                            addr = zcrypto.toChecksumAddress(addr)
                            updateDomainAddr(addr)
                            updateDomainLegend2('saved')
                        } else if (tx.isRejected()) {
                            dispatch(setTxStatusLoading('failed'))
                            setTimeout(() => {
                                toast.error(t('Transaction failed.'), {
                                    position: 'top-right',
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: toastTheme(isLight),
                                })
                            }, 1000)
                        }
                    } catch (err) {
                        updateModalTx(false)
                        toast.error(String(err), {
                            position: 'top-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                        })
                    }
                })
                .catch(() => {
                    dispatch(setTxStatusLoading('rejected'))
                    updateModalTxMinimized(false)
                    updateModalTx(true)
                    toast.warn('Review deployment', {
                        position: 'top-right',
                        autoClose: 6000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                    })
                })
        } else {
            toast.error('Some data is missing.', {
                position: 'top-right',
                autoClose: 6000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
            })
        }
    }

    const resolveDid = async (_username: string, _domain: string) => {
        updateLoading(true)
        const domainId = '0x' + (await tyron.Util.default.HashString(_username))
        await tyron.SearchBarUtil.default
            .fetchAddr(net, domainId, _domain)
            .then(async (addr) => {
                const res = await getSmartContract(addr, 'version')
                updateLoading(false)
                updateResolvedInfo({
                    name: _username,
                    domain: _domain,
                    addr: addr,
                    version: res?.result?.version,
                })
                switch (res?.result?.version?.slice(0, 8).toLowerCase()) {
                    case 'zilstake':
                        navigate(`/${_domain}@${username}/zil`)
                        break
                    case '.stake--':
                        navigate(`/${_domain}@${username}/zil`)
                        break
                    case 'zilxwall':
                        navigate(`/${_domain}@${username}/zil`)
                        break
                    case 'vcxwalle':
                        navigate(`/${_domain}@${username}/sbt`)
                        break
                    case 'sbtxwall':
                        navigate(`/${_domain}@${username}`)
                        break
                    default:
                        updateResolvedInfo({
                            name: _username,
                            domain: '',
                            addr: addr,
                            version: res?.result?.version,
                        })
                        navigate(`/${username}`)
                        break
                }
            })
            .catch((err) => {
                toast.error(String(err), {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                })
                updateLoading(false)
            })
    }

    const handleSubmit = async () => {
        try {
            let did_key =
                '0x000000000000000000000000000000000000000000000000000000000000000000'
            let encrypted = 'null'
            await connect().then(async () => {
                const arConnect = $arconnect.getState()
                if (arConnect) {
                    const result = await operationKeyPair({
                        arConnect: arConnect,
                        id: didDomain,
                        addr: resolvedInfo?.addr,
                    })
                    did_key = result.element.key.key
                    encrypted = result.element.key.encrypted
                }
            })
            //@todo-x-check: continue after the user select arconnect or rejects: tested action below only run after connect(),
            // but when reject arconnect atm we reload the page so can't continue
            if (resolvedInfo !== null && donation !== null) {
                const zilpay = new ZilPayBase()
                const txID = 'Dns'
                const addr = zcrypto.toChecksumAddress(input)
                let tyron_: tyron.TyronZil.TransitionValue
                tyron_ = await tyron.Donation.default.tyron(donation)

                const tx_params = await tyron.TyronZil.default.Dns(
                    addr,
                    didDomain,
                    did_key,
                    encrypted,
                    tyron_
                )
                const _amount = String(donation)
                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                let tx = await tyron.Init.default.transaction(net)
                await zilpay
                    .call({
                        contractAddress: resolvedInfo?.addr!,
                        transition: txID,
                        params: tx_params as unknown as Record<
                            string,
                            unknown
                        >[],
                        amount: _amount,
                    })
                    .then(async (res) => {
                        dispatch(setTxId(res.ID))
                        dispatch(setTxStatusLoading('submitted'))
                        try {
                            tx = await tx.confirm(res.ID)
                            if (tx.isConfirmed()) {
                                dispatch(setTxStatusLoading('confirmed'))
                                updateDonation(null)
                                window.open(
                                    `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                                )
                                // update prev is needed here?: yes, it would be better to use global navigation
                                // we already use navigate() on resolveDid() and that's enough

                                updateDomain('')
                                updateDomainLegend('save')
                                updateDomainLegend2('save')
                                updateDomainTx('')
                                resolveDid(username!, didDomain)
                            } else if (tx.isRejected()) {
                                dispatch(setTxStatusLoading('failed'))
                                setTimeout(() => {
                                    toast.error(t('Transaction failed.'), {
                                        position: 'top-right',
                                        autoClose: 3000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                        progress: undefined,
                                        theme: toastTheme(isLight),
                                    })
                                }, 1000)
                            }
                        } catch (err) {
                            updateModalTx(false)
                            toast.error(String(err), {
                                position: 'top-right',
                                autoClose: 3000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: toastTheme(isLight),
                            })
                        }
                    })
                    .catch((error) => {
                        dispatch(setTxStatusLoading('rejected'))
                        updateModalTxMinimized(false)
                        updateModalTx(true)
                        toast.error(String(error), {
                            position: 'top-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                        })
                    })
            }
        } catch (error) {
            toast.error(String(error), {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
            })
        }
    }

    // const listDomains = ['ZIL Staking xWallet', 'Soulbound xWallet'] // to add further xWallets

    return (
        <div style={{ textAlign: 'center' }}>
            {/*
            - dapp name depends on dapp input => if dapp = "zilstake" then title is ZIL Staking Wallet
            */}
            <section className={styles.container}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="Type subdomain"
                    onChange={handleInputDomain}
                    onKeyPress={handleOnKeyPressDomain}
                    value={$domainInput.getState()}
                />
                <code className={styles.txt}>@{username}.ssi</code>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '10px',
                    }}
                >
                    <div
                        className={domainLegend === 'save' ? 'continueBtn' : ''}
                        onClick={() => {
                            handleSaveDomain()
                        }}
                    >
                        {domainLegend === 'save' ? (
                            <>
                                {loading ? (
                                    <Spinner />
                                ) : (
                                    <Image src={ContinueArrow} alt="arrow" />
                                )}
                            </>
                        ) : (
                            <div style={{ marginTop: '5px' }}>
                                <Image width={40} src={TickIco} alt="tick" />
                            </div>
                        )}
                    </div>
                </div>
            </section>
            {domainLegend === 'saved' && (
                <>
                    <div>
                        {txName !== '' && (
                            <div
                                className={styles.closeWrapper}
                                onClick={() => toggleActive('')}
                            />
                        )}
                        <div className={styles.content}>
                            <div className={styles.cardWrapper}>
                                {/* {listDomains.map((val, i) => (
                                    <div
                                        key={i}
                                        className={styles.cardActiveWrapper}
                                    >
                                        <div
                                            onClick={() => {
                                                toggleActive(val)
                                            }}
                                            className={
                                                txName === val
                                                    ? styles.cardActive
                                                    : styles.card
                                            }
                                        >
                                            <div>{val}</div>
                                        </div>
                                        {txName === val && (
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
                                                <>
                                                    {domainLegend2 ===
                                                        'save' && (
                                                            <>
                                                                {val ===
                                                                    'ZIL Staking xWallet' ? (
                                                                    <div
                                                                        className={
                                                                            isLight
                                                                                ? 'actionBtnBlueLight'
                                                                                : 'actionBtnBlue'
                                                                        }
                                                                        style={{
                                                                            margin: '10%',
                                                                        }}
                                                                        onClick={
                                                                            handleDeploy
                                                                        }
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                textTransform:
                                                                                    'none',
                                                                            }}
                                                                        >
                                                                            New
                                                                            ZILxWallet
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className={
                                                                            isLight
                                                                                ? 'actionBtnLight'
                                                                                : 'actionBtn'
                                                                        }
                                                                        style={{
                                                                            margin: '10%',
                                                                        }}
                                                                        onClick={() => {
                                                                            //if (net === 'testnet') {
                                                                            handleDeployVC()
                                                                            // } else {
                                                                            //     toast.warn(
                                                                            //         'Only available on testnet.'
                                                                            //     ),
                                                                            //         {
                                                                            //             position: 'top-right',
                                                                            //             autoClose: 2000,
                                                                            //             hideProgressBar: false,
                                                                            //             closeOnClick: true,
                                                                            //             pauseOnHover: true,
                                                                            //             draggable: true,
                                                                            //             progress: undefined,
                                                                            //             theme: toastTheme(isLight),
                                                                            //             toastId: 3,
                                                                            //         }
                                                                            // }
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                textTransform:
                                                                                    'none',
                                                                            }}
                                                                        >
                                                                            NEW
                                                                            SBTxWallet
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    {domainLegend2 ===
                                                        'saved' && <Donate />}
                                                    {domainLegend2 ===
                                                        'saved' &&
                                                        donation !== null && (
                                                            <div
                                                                style={{
                                                                    marginBottom:
                                                                        '5%',
                                                                    textAlign:
                                                                        'center',
                                                                }}
                                                            >
                                                                <button
                                                                    className="button"
                                                                    onClick={
                                                                        handleSubmit
                                                                    }
                                                                >
                                                                    <p>
                                                                        Save{' '}
                                                                        <span
                                                                            className={
                                                                                styles.username
                                                                            }
                                                                        >
                                                                            {
                                                                                didDomain
                                                                            }
                                                                        </span>{' '}
                                                                        DID
                                                                        Domain
                                                                    </p>
                                                                </button>
                                                            </div>
                                                        )}
                                                </>
                                            </div>
                                        )}
                                    </div>
                                ))} */}
                                <div className={styles.cardActiveWrapper}>
                                    <div
                                        onClick={() => {
                                            toggleActive('TypeAddress')
                                        }}
                                        className={
                                            txName === 'TypeAddress'
                                                ? styles.cardActive
                                                : styles.card
                                        }
                                    >
                                        <div>Type Address</div>
                                    </div>
                                    {txName === 'TypeAddress' && (
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
                                            <section
                                                className={styles.container}
                                            >
                                                <input
                                                    style={{
                                                        width: '70%',
                                                        marginRight: '20px',
                                                    }}
                                                    className={styles.txt}
                                                    type="text"
                                                    placeholder="Type address"
                                                    onChange={handleInput}
                                                    onKeyPress={
                                                        handleOnKeyPressAddr
                                                    }
                                                />
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <div
                                                        className={
                                                            domainLegend2 ===
                                                            'save'
                                                                ? 'continueBtn'
                                                                : ''
                                                        }
                                                        onClick={() => {
                                                            handleSave()
                                                        }}
                                                    >
                                                        {domainLegend2 ===
                                                        'save' ? (
                                                            <Image
                                                                src={
                                                                    ContinueArrow
                                                                }
                                                                alt="arrow"
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    marginTop:
                                                                        '5px',
                                                                }}
                                                            >
                                                                <Image
                                                                    width={40}
                                                                    src={
                                                                        TickIco
                                                                    }
                                                                    alt="tick"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </section>
                                            {domainLegend2 === 'saved' && (
                                                <Donate />
                                            )}
                                            {domainLegend2 === 'saved' &&
                                                donation !== null && (
                                                    <div
                                                        style={{
                                                            marginBottom: '5%',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <button
                                                            className="button"
                                                            onClick={
                                                                handleSubmit
                                                            }
                                                        >
                                                            <p>
                                                                Save{' '}
                                                                <span
                                                                    className={
                                                                        styles.username
                                                                    }
                                                                >
                                                                    {didDomain}
                                                                </span>{' '}
                                                                DID Domain
                                                            </p>
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Component
